// グローバル変数
let stream = null;
let selectedEmployeeId = null;
let currentUser = null;
let workStatus = null;

// ページ読み込み時の処理
document.addEventListener('DOMContentLoaded', async () => {
    // 認証チェック
    await checkAuth();
    
    // 時計はHTMLで既に初期化済み
    
    // 従業員リストの読み込み
    await loadEmployees();
    
    // カメラの初期化（少し遅延させて実行）
    setTimeout(() => {
        initCamera();
    }, 500);
    
    // イベントリスナーの設定
    setupEventListeners();
    
    // 本日の打刻履歴を読み込み
    await loadTodayRecords();
});

// 認証チェック
async function checkAuth() {
    try {
        const response = await fetch('/api/check-auth');
        const data = await response.json();
        
        if (!response.ok) {
            window.location.href = '/login';
            return;
        }
        
        currentUser = data.user;
        
        // ユーザー名表示
        document.getElementById('currentUser').textContent = currentUser.username;
        
        // ユーザーアバターの初期化
        updateUserInitial(currentUser.username);
        
        // 管理者リンクの表示
        if (currentUser.is_admin) {
            document.getElementById('adminLink').style.display = 'inline';
        }
        
    } catch (error) {
        console.error('認証チェックエラー:', error);
        window.location.href = '/login';
    }
}

// ログアウト
async function logout() {
    try {
        const response = await fetch('/api/logout', { method: 'POST' });
        if (response.ok) {
            window.location.href = '/login';
        }
    } catch (error) {
        console.error('ログアウトエラー:', error);
    }
}

// 時計の更新は index.html で実装済み

// 従業員リストの読み込み
async function loadEmployees() {
    try {
        const response = await fetch('/api/employees');
        if (!response.ok) {
            throw new Error('従業員リストの取得に失敗しました');
        }
        
        const employees = await response.json();
        const select = document.getElementById('employeeId');
        
        // 既存のオプションをクリア
        select.innerHTML = '<option value="">-- 選択してください --</option>';
        
        // 従業員オプションを追加
        employees.forEach(emp => {
            const option = document.createElement('option');
            option.value = emp.employee_id;
            option.textContent = `${emp.employee_id} - ${emp.name}`;
            if (emp.department) {
                option.textContent += ` (${emp.department})`;
            }
            select.appendChild(option);
        });
        
        // ユーザーが従業員と紐づいている場合は自動選択
        if (currentUser && currentUser.employee_id) {
            select.value = currentUser.employee_id;
            await handleEmployeeSelect(currentUser.employee_id);
        }
        
    } catch (error) {
        console.error('従業員リスト読み込みエラー:', error);
        showMessage('従業員リストの読み込みに失敗しました', 'error');
    }
}

// カメラの初期化（改善版）
async function initCamera() {
    try {
        // カメラの権限を確認
        const permissionStatus = await navigator.permissions.query({ name: 'camera' });
        console.log('カメラ権限:', permissionStatus.state);
        
        // ビデオ要素の取得
        const video = document.getElementById('camera');
        if (!video) {
            console.error('ビデオ要素が見つかりません');
            return;
        }
        
        // カメラのオプション設定
        const constraints = {
            video: {
                width: { ideal: 640, max: 1280 },
                height: { ideal: 480, max: 720 },
                facingMode: 'user'
            },
            audio: false
        };
        
        // メディアストリームを取得
        stream = await navigator.mediaDevices.getUserMedia(constraints);
        
        // ビデオ要素に設定
        video.srcObject = stream;
        
        // 再生を開始（重要：iOSやSafariでは必要）
        video.play().catch(e => {
            console.warn('ビデオの自動再生に失敗:', e);
        });
        
        // ビデオのメタデータが読み込まれたら
        video.addEventListener('loadedmetadata', () => {
            console.log('カメラ初期化成功:', video.videoWidth, 'x', video.videoHeight);
        });
        
    } catch (error) {
        console.error('カメラ初期化エラー:', error);
        
        // エラーの種類に応じてメッセージを表示
        if (error.name === 'NotAllowedError') {
            showMessage('カメラへのアクセスが拒否されました。ブラウザの設定でカメラを許可してください。', 'warning');
        } else if (error.name === 'NotFoundError') {
            showMessage('カメラが見つかりません。カメラが接続されているか確認してください。', 'warning');
        } else if (error.name === 'NotReadableError') {
            showMessage('カメラが他のアプリケーションで使用されています。', 'warning');
        } else {
            showMessage('カメラが利用できません。写真なしで打刻は可能です。', 'warning');
        }
    }
}

// イベントリスナーの設定
function setupEventListeners() {
    // 従業員選択の変更
    const employeeSelect = document.getElementById('employeeId');
    employeeSelect.addEventListener('change', async (e) => {
        await handleEmployeeSelect(e.target.value);
    });
    
    // 出勤ボタン
    document.getElementById('checkInBtn').addEventListener('click', () => {
        if (selectedEmployeeId) {
            recordTime('check_in');
        } else {
            showMessage('従業員を選択してください', 'error');
        }
    });
    
    // 退勤ボタン
    document.getElementById('checkOutBtn').addEventListener('click', () => {
        if (selectedEmployeeId) {
            recordTime('check_out');
        } else {
            showMessage('従業員を選択してください', 'error');
        }
    });
    
    // カメラ再接続ボタン（オプション）
    const cameraRetryBtn = document.getElementById('cameraRetryBtn');
    if (cameraRetryBtn) {
        cameraRetryBtn.addEventListener('click', () => {
            initCamera();
        });
    }
}

// 従業員選択時の処理
async function handleEmployeeSelect(employeeId) {
    selectedEmployeeId = employeeId;
    
    if (!employeeId) {
        // 選択解除時
        document.getElementById('checkInBtn').disabled = true;
        document.getElementById('checkOutBtn').disabled = true;
        document.getElementById('workStatus').classList.add('hidden');
        return;
    }
    
    // 勤務状態を取得
    try {
        const response = await fetch(`/api/work-status/${employeeId}`);
        const status = await response.json();
        workStatus = status;
        
        updateWorkStatusDisplay(status);
        updateButtonStates(status);
        
    } catch (error) {
        console.error('勤務状態取得エラー:', error);
        showMessage('勤務状態の取得に失敗しました', 'error');
    }
}

// 勤務状態の表示更新（Tailwind CSS対応）
function updateWorkStatusDisplay(status) {
    const statusEl = document.getElementById('workStatus');
    const statusMessage = statusEl.querySelector('.status-message');
    
    if (status.is_working) {
        statusMessage.innerHTML = `
            <div class="flex items-center space-x-2 text-green-300 text-lg font-bold mb-3">
                <div class="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                <span>勤務中</span>
            </div>
            <div class="text-white/80 text-sm">
                出勤時刻: <span class="font-semibold">${status.last_check_in}</span>
            </div>
        `;
    } else {
        if (status.last_check_out) {
            statusMessage.innerHTML = `
                <div class="flex items-center space-x-2 text-gray-300 text-lg font-bold mb-3">
                    <div class="w-3 h-3 bg-gray-400 rounded-full"></div>
                    <span>勤務外</span>
                </div>
                <div class="text-white/80 text-sm">
                    最終退勤: <span class="font-semibold">${status.last_check_out}</span>
                </div>
            `;
        } else {
            statusMessage.innerHTML = `
                <div class="flex items-center space-x-2 text-gray-300 text-lg font-bold mb-3">
                    <div class="w-3 h-3 bg-gray-400 rounded-full"></div>
                    <span>未出勤</span>
                </div>
                <div class="text-white/70 text-sm">
                    本日はまだ出勤していません
                </div>
            `;
        }
    }
    
    statusEl.classList.remove('hidden');
}

// ボタン状態の更新
function updateButtonStates(status) {
    const checkInBtn = document.getElementById('checkInBtn');
    const checkOutBtn = document.getElementById('checkOutBtn');
    
    if (status.is_working) {
        // 勤務中：出勤ボタンを無効化、退勤ボタンを有効化
        checkInBtn.disabled = true;
        checkOutBtn.disabled = false;
        checkInBtn.style.opacity = '0.5';
        checkOutBtn.style.opacity = '1';
    } else {
        // 勤務外：出勤ボタンを有効化、退勤ボタンを無効化
        checkInBtn.disabled = false;
        checkOutBtn.disabled = true;
        checkInBtn.style.opacity = '1';
        checkOutBtn.style.opacity = '0.5';
    }
}

// 写真を撮影（改善版）
async function capturePhoto() {
    const video = document.getElementById('camera');
    const canvas = document.getElementById('canvas');
    const context = canvas.getContext('2d');
    
    // ビデオが再生されているかチェック
    if (!video.srcObject || video.readyState < 2) {
        console.log('カメラが利用できないため、写真撮影をスキップします');
        return null;
    }
    
    // ビデオが実際に再生されているか確認
    if (video.videoWidth === 0 || video.videoHeight === 0) {
        console.log('ビデオストリームが準備できていません');
        return null;
    }
    
    // キャンバスのサイズを設定
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // ビデオフレームをキャンバスに描画
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Blobに変換
    return new Promise((resolve) => {
        canvas.toBlob((blob) => {
            if (blob) {
                console.log('写真撮影成功:', blob.size, 'bytes');
            }
            resolve(blob);
        }, 'image/jpeg', 0.8);
    });
}

// 打刻記録
async function recordTime(type) {
    try {
        // ボタンを一時的に無効化
        document.getElementById('checkInBtn').disabled = true;
        document.getElementById('checkOutBtn').disabled = true;
        
        showMessage('打刻処理中...', 'info');
        
        // フォームデータの作成
        const formData = new FormData();
        formData.append('employee_id', selectedEmployeeId);
        formData.append('type', type);
        
        // 写真を撮影（カメラが利用可能な場合）
        const photoBlob = await capturePhoto();
        if (photoBlob) {
            formData.append('photo', photoBlob, 'photo.jpg');
        }
        
        // APIリクエスト
        const response = await fetch('/api/time-record', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // 成功メッセージ
            let message = data.message;
            if (data.warning) {
                message += '\n' + data.warning;
            }
            showMessage(message, data.warning ? 'warning' : 'success');
            
            // プレビューを表示（写真がある場合）
            if (photoBlob && !data.warning) {
                showPreview(photoBlob);
            }
            
            // 打刻履歴を更新
            await loadTodayRecords();
            
            // 勤務状態を再取得
            await handleEmployeeSelect(selectedEmployeeId);
            
        } else {
            showMessage(data.error || '打刻に失敗しました', 'error');
            // エラー後もボタン状態を更新
            await handleEmployeeSelect(selectedEmployeeId);
        }
        
    } catch (error) {
        console.error('打刻エラー:', error);
        showMessage('打刻処理中にエラーが発生しました', 'error');
        // エラー後もボタン状態を更新
        if (selectedEmployeeId) {
            await handleEmployeeSelect(selectedEmployeeId);
        }
    }
}

// プレビューを表示
function showPreview(blob) {
    const preview = document.getElementById('preview');
    if (preview) {
        preview.src = URL.createObjectURL(blob);
        preview.style.display = 'block';
        
        // 3秒後に非表示
        setTimeout(() => {
            preview.style.display = 'none';
            URL.revokeObjectURL(preview.src);
        }, 3000);
    }
}

// 本日の打刻履歴を読み込み
async function loadTodayRecords() {
    try {
        const today = new Date().toISOString().split('T')[0];
        const response = await fetch(`/api/time-records?start_date=${today}&end_date=${today}`);
        
        if (!response.ok) {
            throw new Error('履歴の取得に失敗しました');
        }
        
        const records = await response.json();
        displayRecords(records);
        
    } catch (error) {
        console.error('履歴読み込みエラー:', error);
    }
}

// 打刻履歴を表示
function displayRecords(records) {
    const recordsList = document.getElementById('recordsList');
    
    if (records.length === 0) {
        recordsList.innerHTML = '<p class="no-records" style="text-align: center; color: #7f8c8d;">本日の打刻はありません</p>';
        return;
    }
    
    const html = records.map(record => {
        const typeIcon = record.type === 'check_in' ? '🌅' : '🌙';
        const typeText = record.type === 'check_in' ? '出勤' : '退勤';
        const photoIcon = record.has_photo ? '📸' : '';
        
        return `
            <div class="record-item" style="padding: 15px; border-bottom: 1px solid #ecf0f1; display: flex; justify-content: space-between; align-items: center;">
                <div style="display: flex; align-items: center; gap: 15px;">
                    <span class="record-type" style="font-size: 20px;">${typeIcon}</span>
                    <div>
                        <div style="font-weight: 600;">${record.employee_name}</div>
                        <div style="color: #7f8c8d; font-size: 14px;">${typeText} - ${record.timestamp}</div>
                    </div>
                </div>
                ${photoIcon}
            </div>
        `;
    }).join('');
    
    recordsList.innerHTML = html;
}

// メッセージ表示（Tailwind CSS対応）
function showMessage(text, type = 'info', duration = 5000) {
    const messageEl = document.getElementById('message');
    
    if (!messageEl) return;
    
    messageEl.textContent = text;
    messageEl.className = getMessageClasses(type);
    messageEl.classList.remove('hidden');
    
    if (duration > 0) {
        setTimeout(() => {
            messageEl.classList.add('hidden');
        }, duration);
    }
}

// メッセージタイプに応じたTailwind CSSクラスを返す
function getMessageClasses(type) {
    const baseClasses = 'p-4 rounded-xl text-center font-medium animate-scale-in transition-all duration-300';
    
    switch (type) {
        case 'success':
            return `${baseClasses} bg-green-500/20 text-green-100 border border-green-500/30`;
        case 'error':
            return `${baseClasses} bg-red-500/20 text-red-100 border border-red-500/30`;
        case 'warning':
            return `${baseClasses} bg-yellow-500/20 text-yellow-100 border border-yellow-500/30`;
        case 'info':
            return `${baseClasses} bg-blue-500/20 text-blue-100 border border-blue-500/30`;
        default:
            return `${baseClasses} bg-gray-500/20 text-gray-100 border border-gray-500/30`;
    }
}

// ページを離れる時の処理
window.addEventListener('beforeunload', () => {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
    }
});
