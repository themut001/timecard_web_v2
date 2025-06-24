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

// ユーザー情報の読み込み
async function loadUserInfo() {
    try {
        const response = await fetch('/api/employees');
        const list = await response.json();
        const info = list.find(emp => emp.employee_id === currentUser.employee_id);

        document.getElementById('accountUsername').value = currentUser.username;
        if (info) {
            document.getElementById('accountEmail').value = info.email || '';
        }
    } catch (error) {
        console.error('ユーザー情報読み込みエラー:', error);
    }
}

let allTags = [];

// タグ一覧の読み込み
async function loadTags(query = '') {
    try {
        const url = query ? `/api/tags?query=${encodeURIComponent(query)}` : '/api/tags';
        const response = await fetch(url);
        allTags = await response.json();
        updateTagSelectOptions();
    } catch (error) {
        console.error('タグ読み込みエラー:', error);
    }
}

function updateTagSelectOptions() {
    document.querySelectorAll('.tagSelect').forEach(select => {
        const current = select.value;
        select.innerHTML = '<option value="">選択してください</option>';
        allTags.forEach(tag => {
            const opt = document.createElement('option');
            opt.value = tag.id;
            opt.textContent = tag.name;
            select.appendChild(opt);
        });
        select.value = current;
    });
}

function addTagEntry() {
    const container = document.getElementById('tagEntries');
    const div = document.createElement('div');
    div.className = 'tag-entry';
    div.innerHTML = `
        <select class="tagSelect"></select>
        <input type="number" class="tagHours" step="0.1" placeholder="時間">
        <button type="button" class="btn btn-danger btn-sm remove-tag-entry">削除</button>
    `;
    container.appendChild(div);
    updateTagSelectOptions();
    div.querySelector('.remove-tag-entry').addEventListener('click', () => div.remove());
}

// 統計情報の読み込み
async function loadStats() {
    try {
        const response = await fetch('/api/my-stats');
        const stats = await response.json();
        
        document.getElementById('workDays').textContent = stats.work_days_this_month;
        document.getElementById('workTime').textContent = stats.work_time_today || '--:--';
        document.getElementById('unreadCount').textContent = stats.unread_notifications;
        
        // バッジ更新
        updateNotificationBadge(stats.unread_notifications);
        
    } catch (error) {
        console.error('統計情報の読み込みエラー:', error);
    }
}

// 通知バッジの更新
function updateNotificationBadge(count) {
    const badge = document.getElementById('notificationBadge');
    if (count > 0) {
        badge.textContent = count;
        badge.style.display = 'inline-block';
    } else {
        badge.style.display = 'none';
    }
}

// タブ切り替え（Tailwind CSS対応）
function showTab(tabName) {
    // すべてのタブコンテンツを非表示
    const contents = document.querySelectorAll('.tab-content');
    contents.forEach(content => {
        content.classList.add('hidden');
    });
    
    // すべてのタブボタンを非アクティブ化
    const tabButtons = document.querySelectorAll('[id^="tab-"]');
    tabButtons.forEach(button => {
        // glass-tab-active クラスを削除し、glass-tab クラスを追加
        button.classList.remove('glass-tab-active');
        button.classList.add('glass-tab');
        
        // テキストの透明度を下げる
        const textSpan = button.querySelector('span');
        if (textSpan) {
            textSpan.classList.remove('text-white');
            textSpan.classList.add('text-white/80');
        }
    });
    
    // 選択されたタブを表示
    const selectedContent = document.getElementById(tabName);
    if (selectedContent) {
        selectedContent.classList.remove('hidden');
    }
    
    // 対応するタブボタンをアクティブ化
    const activeButton = document.getElementById(`tab-${tabName}`);
    if (activeButton) {
        activeButton.classList.remove('glass-tab');
        activeButton.classList.add('glass-tab-active');
        
        // テキストを完全に不透明にする
        const textSpan = activeButton.querySelector('span');
        if (textSpan) {
            textSpan.classList.remove('text-white/80');
            textSpan.classList.add('text-white');
        }
    }
    
    // クリックされたタブボタンをアクティブに
    event.target.classList.add('active');
    
    // 必要に応じてデータを読み込み
    if (tabName === 'report-history') {
        loadReportHistory();
    } else if (tabName === 'attendance') {
        loadAttendanceHistory();
    } else if (tabName === 'notifications') {
        loadNotifications();
    }
}

// 日報の保存
async function saveDailyReport(event) {
    event.preventDefault();
    
    const formData = {
        report_date: document.getElementById('reportDate').value,
        work_content: document.getElementById('workContent').value,
        achievements: document.getElementById('achievements').value,
        issues: document.getElementById('issues').value,
        tomorrow_plan: document.getElementById('tomorrowPlan').value,
        remarks: document.getElementById('remarks').value
    };
    
    try {
        showMessage('保存中...', 'info');
        
        const response = await fetch('/api/daily-report', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        const data = await response.json();

        if (response.ok) {
            showMessage(data.message, 'success');
            // フォームをクリア（日付以外）
            document.getElementById('workContent').value = '';
            document.getElementById('achievements').value = '';
            document.getElementById('issues').value = '';
            document.getElementById('tomorrowPlan').value = '';
            document.getElementById('remarks').value = '';

            // タグ工数登録
            const entries = document.querySelectorAll('.tag-entry');
            const promises = [];
            entries.forEach(entry => {
                const tagId = entry.querySelector('.tagSelect').value;
                const hours = parseFloat(entry.querySelector('.tagHours').value);
                if (tagId && hours) {
                    promises.push(
                        fetch('/api/tag-work', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                date: document.getElementById('reportDate').value,
                                tag_id: tagId,
                                hours: hours
                            })
                        })
                    );
                }
            });
            await Promise.all(promises);
            document.getElementById('tagEntries').innerHTML = '';
            addTagEntry();
        } else {
            showMessage(data.error || '保存に失敗しました', 'error');
        }
        
    } catch (error) {
        console.error('日報保存エラー:', error);
        showMessage('保存中にエラーが発生しました', 'error');
    }
}

// 日報履歴の読み込み
async function loadReportHistory() {
    try {
        const startDate = document.getElementById('reportStartDate').value;
        const endDate = document.getElementById('reportEndDate').value;
        
        let url = '/api/daily-reports?';
        if (startDate) url += `start_date=${startDate}&`;
        if (endDate) url += `end_date=${endDate}`;
        
        const response = await fetch(url);
        const reports = await response.json();
        
        displayReportHistory(reports);
        
    } catch (error) {
        console.error('日報履歴読み込みエラー:', error);
        showMessage('履歴の読み込みに失敗しました', 'error');
    }
}

// 日報履歴の表示
function displayReportHistory(reports) {
    const container = document.getElementById('reportHistoryList');
    
    if (reports.length === 0) {
        container.innerHTML = '<p>日報がありません</p>';
        return;
    }
    
    const html = `
        <table>
            <thead>
                <tr>
                    <th>日付</th>
                    <th>業務内容</th>
                    <th>成果</th>
                    <th>操作</th>
                </tr>
            </thead>
            <tbody>
                ${reports.map(report => `
                    <tr>
                        <td>${report.report_date}</td>
                        <td>${truncateText(report.work_content, 50)}</td>
                        <td>${truncateText(report.achievements || '-', 50)}</td>
                        <td>
                            <button class="btn btn-sm" onclick="viewReport('${report.id}')">詳細</button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    
    container.innerHTML = html;
}

// 勤怠履歴の読み込み
async function loadAttendanceHistory() {
    try {
        const startDate = document.getElementById('attendanceStartDate').value;
        const endDate = document.getElementById('attendanceEndDate').value;
        const employeeId = currentUser.employee_id;
        
        let url = `/api/time-records?employee_id=${employeeId}`;
        if (startDate) url += `&start_date=${startDate}`;
        if (endDate) url += `&end_date=${endDate}`;
        
        const response = await fetch(url);
        const records = await response.json();
        
        displayAttendanceHistory(records);
        
    } catch (error) {
        console.error('勤怠履歴読み込みエラー:', error);
        showMessage('履歴の読み込みに失敗しました', 'error');
    }
}

// 勤怠履歴の表示
function displayAttendanceHistory(records) {
    const container = document.getElementById('attendanceList');
    
    if (records.length === 0) {
        container.innerHTML = '<p>勤怠記録がありません</p>';
        return;
    }
    
    // 日付ごとにグループ化
    const groupedRecords = {};
    records.forEach(record => {
        const date = record.timestamp.split(' ')[0];
        if (!groupedRecords[date]) {
            groupedRecords[date] = [];
        }
        groupedRecords[date].push(record);
    });
    
    const html = `
        <table>
            <thead>
                <tr>
                    <th>日付</th>
                    <th>出勤時刻</th>
                    <th>退勤時刻</th>
                    <th>勤務時間</th>
                </tr>
            </thead>
            <tbody>
                ${Object.keys(groupedRecords).map(date => {
                    const dayRecords = groupedRecords[date];
                    const checkIn = dayRecords.find(r => r.type === 'check_in');
                    const checkOut = dayRecords.find(r => r.type === 'check_out');
                    
                    let workTime = '-';
                    if (checkIn && checkOut) {
                        const inTime = new Date(checkIn.timestamp);
                        const outTime = new Date(checkOut.timestamp);
                        const diff = outTime - inTime;
                        const hours = Math.floor(diff / (1000 * 60 * 60));
                        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                        workTime = `${hours}時間${minutes}分`;
                    }
                    
                    return `
                        <tr>
                            <td>${date}</td>
                            <td>${checkIn ? checkIn.timestamp.split(' ')[1] : '-'}</td>
                            <td>${checkOut ? checkOut.timestamp.split(' ')[1] : '-'}</td>
                            <td>${workTime}</td>
                        </tr>
                    `;
                }).join('')}
            </tbody>
        </table>
    `;
    
    container.innerHTML = html;
}

// 通知の読み込み
async function loadNotifications() {
    try {
        const response = await fetch('/api/notifications');
        const notifications = await response.json();
        
        displayNotifications(notifications);
        
    } catch (error) {
        console.error('通知読み込みエラー:', error);
    }
}

// 通知の表示
function displayNotifications(notifications) {
    const container = document.getElementById('notificationList');
    
    if (notifications.length === 0) {
        container.innerHTML = '<p>通知はありません</p>';
        return;
    }
    
    const html = notifications.map(notification => `
        <div class="notification-item ${notification.is_read ? '' : 'unread'}" 
             onclick="markAsRead(${notification.id})">
            <div class="notification-title">${notification.title}</div>
            <div class="notification-message">${notification.message}</div>
            <div class="notification-time">${formatDateTime(notification.created_at)}</div>
        </div>
    `).join('');
    
    container.innerHTML = html;
}

// 通知を既読にする
async function markAsRead(notificationId) {
    try {
        const response = await fetch(`/api/notifications/${notificationId}/read`, {
            method: 'PUT'
        });
        
        if (response.ok) {
            loadNotifications();
            loadStats(); // 未読数を更新
        }
        
    } catch (error) {
        console.error('既読処理エラー:', error);
    }
}

// アカウント情報更新
async function updateAccount(event) {
    event.preventDefault();

    const data = {
        username: document.getElementById('accountUsername').value,
        password: document.getElementById('accountPassword').value,
    };
    const email = document.getElementById('accountEmail').value;

    try {
        const userRes = await fetch('/api/users/me', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const userResult = await userRes.json();

        const empRes = await fetch('/api/employees/me', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });
        const empResult = await empRes.json();

        if (userRes.ok && empRes.ok) {
            showMessage('アカウント情報を更新しました', 'success');
            document.getElementById('accountPassword').value = '';
            await checkAuth();
        } else {
            const msg = userResult.error || empResult.error || '更新に失敗しました';
            showMessage(msg, 'error');
        }
    } catch (error) {
        console.error('アカウント更新エラー:', error);
        showMessage('更新中にエラーが発生しました', 'error');
    }
}

// テキストの切り詰め
function truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

// 日時のフォーマット
function formatDateTime(dateTimeStr) {
    const date = new Date(dateTimeStr);
    const now = new Date();
    const diff = now - date;
    
    // 1時間以内
    if (diff < 60 * 60 * 1000) {
        const minutes = Math.floor(diff / (60 * 1000));
        return `${minutes}分前`;
    }
    // 24時間以内
    else if (diff < 24 * 60 * 60 * 1000) {
        const hours = Math.floor(diff / (60 * 60 * 1000));
        return `${hours}時間前`;
    }
    // それ以上
    else {
        return date.toLocaleDateString('ja-JP');
    }
}

// メッセージ表示
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
    const baseClasses = 'p-4 rounded-xl text-center font-medium animate-scale-in transition-all duration-300 mt-6';
    
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

// 日報詳細の表示（モーダル）
function viewReport(reportId) {
    // TODO: モーダルで日報詳細を表示
    alert('日報詳細機能は実装準備中です');
}// グローバル変数
let currentUser = null;

// ページ読み込み時の処理
document.addEventListener('DOMContentLoaded', async () => {
    await checkAuth();
    await loadUserInfo();
    await loadTags();
    addTagEntry();
    await loadStats();
    await loadNotifications();
    
    // 日付の初期値を今日に設定
    document.getElementById('reportDate').value = new Date().toISOString().split('T')[0];

    // イベントリスナー
    document.getElementById('dailyReportForm').addEventListener('submit', saveDailyReport);
    const accountForm = document.getElementById('accountForm');
    if (accountForm) {
        accountForm.addEventListener('submit', updateAccount);
    }
    document.getElementById('addTagBtn').addEventListener('click', addTagEntry);
    document.getElementById('tagSearch').addEventListener('input', (e) => {
        loadTags(e.target.value);
    });
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
        
        // 管理者リンクの表示
        if (currentUser.is_admin) {
            const adminLink = document.getElementById('adminLink');
            if (adminLink) {
                adminLink.style.display = 'inline';
            }
        }
        
        // ユーザー名表示
        document.getElementById('currentUser').textContent = currentUser.username;
        
        // ユーザーアバターの初期化
        updateUserInitial(currentUser.username);
        
    } catch (error) {
        console.error('認証チェックエラー:', error);
        window.location.href = '/login';
    }
}
