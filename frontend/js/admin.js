// グローバル変数
let employees = [];
let currentUser = null;

// ページ読み込み時の処理
document.addEventListener('DOMContentLoaded', async () => {
    await checkAuth();
    await loadEmployees();

    // フォームのイベントリスナー
    document.getElementById('employeeForm').addEventListener('submit', createEmployee);
    const toggle = document.getElementById('togglePassword');
    if (toggle) {
        toggle.addEventListener('change', () => {
            const pwd = document.getElementById('newPassword');
            pwd.type = toggle.checked ? 'text' : 'password';
        });
    }

    const syncBtn = document.getElementById('syncTagsBtn');
    if (syncBtn) {
        syncBtn.addEventListener('click', syncTags);
    }
});

// 認証チェック
async function checkAuth() {
    try {
        const response = await fetch('/api/check-auth');
        const data = await response.json();
        
        if (!response.ok || !data.user.is_admin) {
            alert('管理者権限が必要です');
            window.location.href = '/';
            return;
        }
        
        currentUser = data.user;
        document.getElementById('currentUser').textContent = currentUser.username;
        
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

// タブ切り替え
function showTab(tabName) {
    // すべてのタブコンテンツを非表示
    const contents = document.querySelectorAll('.tab-content');
    contents.forEach(content => {
        content.style.display = 'none';
    });
    
    // すべてのタブボタンを非アクティブ
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => {
        tab.classList.remove('active');
    });
    
    // 選択されたタブを表示
    document.getElementById(tabName).style.display = 'block';
    
    // クリックされたタブボタンをアクティブに
    event.target.classList.add('active');
    
    // 必要に応じてデータを読み込み
    if (tabName === 'attendance') {
        searchAttendance();
    } else if (tabName === 'reports') {
        searchReports();
    } else if (tabName === 'tag-hours') {
        loadTagHours();
    }
}

// 従業員リストの読み込み
async function loadEmployees() {
    try {
        const response = await fetch('/api/employees');
        employees = await response.json();
        
        displayEmployeeList();
        updateEmployeeSelects();
        
    } catch (error) {
        console.error('従業員リスト読み込みエラー:', error);
        showMessage('従業員リストの読み込みに失敗しました', 'error');
    }
}

// 従業員リストの表示
function displayEmployeeList() {
    const container = document.getElementById('employeeList');
    
    if (employees.length === 0) {
        container.innerHTML = '<p>従業員が登録されていません</p>';
        return;
    }
    
    const html = `
        <table>
            <thead>
                <tr>
                    <th>従業員ID</th>
                    <th>氏名</th>
                    <th>メールアドレス</th>
                    <th>部署</th>
                    <th>役職</th>
                    <th>ユーザー名</th>
                    <th>権限</th>
                    <th>最終ログイン</th>
                    <th>登録日</th>
                    <th>操作</th>
                </tr>
            </thead>
            <tbody>
                ${employees.map(emp => `
                    <tr>
                        <td>${emp.employee_id}</td>
                        <td>${emp.name}</td>
                        <td>${emp.email || '-'}</td>
                        <td>${emp.department || '-'}</td>
                        <td>${emp.position || '-'}</td>
                        <td>${emp.username || '-'}</td>
                        <td>${emp.is_admin ? '<span class="badge">管理者</span>' : '一般'}</td>
                        <td>${emp.last_login ? new Date(emp.last_login).toLocaleString('ja-JP') : '-'}</td>
                        <td>${new Date(emp.created_at).toLocaleDateString('ja-JP')}</td>
                        <td>
                            ${emp.username ? `<button class="btn btn-sm" onclick="deleteUser('${emp.username}')">削除</button>` : '-'}
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    
    container.innerHTML = html;
}

// 従業員セレクトボックスの更新
function updateEmployeeSelects() {
    const selects = ['filterEmployee', 'reportFilterEmployee'];
    
    selects.forEach(selectId => {
        const select = document.getElementById(selectId);
        if (!select) return;
        
        const currentValue = select.value;
        select.innerHTML = '<option value="">全員</option>';
        
        employees.forEach(emp => {
            const option = document.createElement('option');
            option.value = emp.employee_id;
            option.textContent = `${emp.employee_id} - ${emp.name}`;
            select.appendChild(option);
        });
        
        select.value = currentValue;
    });
}

// 従業員の作成
async function createEmployee(event) {
    event.preventDefault();
    
    const data = {
        employee_id: document.getElementById('newEmployeeId').value,
        name: document.getElementById('newEmployeeName').value,
        email: document.getElementById('newEmployeeEmail').value,
        department: document.getElementById('newEmployeeDepartment').value,
        position: document.getElementById('newEmployeePosition').value,
        username: document.getElementById('newUsername').value,
        password: document.getElementById('newPassword').value,
        is_admin: document.getElementById('isAdmin').checked
    };
    
    try {
        const response = await fetch('/api/employees', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showMessage(result.message, 'success');
            document.getElementById('employeeForm').reset();
            await loadEmployees();
        } else {
            showMessage(result.error || '従業員の登録に失敗しました', 'error');
        }
        
    } catch (error) {
        console.error('従業員登録エラー:', error);
        showMessage('従業員の登録中にエラーが発生しました', 'error');
    }
}

// ユーザー削除
async function deleteUser(username) {
    if (!confirm(`${username} を削除しますか？`)) return;

    try {
        const response = await fetch(`/api/users/${encodeURIComponent(username)}`, { method: 'DELETE' });
        const result = await response.json();

        if (response.ok) {
            showMessage(result.message, 'success');
            await loadEmployees();
        } else {
            showMessage(result.error || '削除に失敗しました', 'error');
        }
    } catch (error) {
        console.error('ユーザー削除エラー:', error);
        showMessage('削除中にエラーが発生しました', 'error');
    }
}


// 勤怠記録の検索
async function searchAttendance() {
    try {
        const params = new URLSearchParams();
        const employeeId = document.getElementById('filterEmployee').value;
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;
        
        if (employeeId) params.append('employee_id', employeeId);
        if (startDate) params.append('start_date', startDate);
        if (endDate) params.append('end_date', endDate);
        
        const response = await fetch(`/api/time-records?${params}`);
        const records = await response.json();
        
        displayAttendanceRecords(records);
        
    } catch (error) {
        console.error('勤怠記録検索エラー:', error);
        showMessage('勤怠記録の検索に失敗しました', 'error');
    }
}

// 勤怠記録の表示
function displayAttendanceRecords(records) {
    const container = document.getElementById('attendanceTable');
    
    if (records.length === 0) {
        container.innerHTML = '<p>該当する記録がありません</p>';
        return;
    }
    
    const html = `
        <table>
            <thead>
                <tr>
                    <th>日時</th>
                    <th>従業員ID</th>
                    <th>氏名</th>
                    <th>種別</th>
                    <th>写真</th>
                </tr>
            </thead>
            <tbody>
                ${records.map(record => `
                    <tr>
                        <td>${record.timestamp}</td>
                        <td>${record.employee_id}</td>
                        <td>${record.employee_name}</td>
                        <td>${record.type === 'check_in' ? '出勤' : '退勤'}</td>
                        <td>${record.has_photo ? '📸' : '-'}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    
    container.innerHTML = html;
}

// CSV出力
async function exportCSV() {
    try {
        const params = new URLSearchParams();
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;
        
        if (startDate) params.append('start_date', startDate);
        if (endDate) params.append('end_date', endDate);
        
        window.location.href = `/api/export-csv?${params}`;
        showMessage('CSV出力を開始しました', 'success');
        
    } catch (error) {
        console.error('CSV出力エラー:', error);
        showMessage('CSV出力に失敗しました', 'error');
    }
}

// 日報の検索
async function searchReports() {
    try {
        const params = new URLSearchParams();
        const startDate = document.getElementById('reportStartDate').value;
        const endDate = document.getElementById('reportEndDate').value;
        
        if (startDate) params.append('start_date', startDate);
        if (endDate) params.append('end_date', endDate);
        
        const response = await fetch(`/api/daily-reports?${params}`);
        const reports = await response.json();
        
        displayReports(reports);
        
    } catch (error) {
        console.error('日報検索エラー:', error);
        showMessage('日報の検索に失敗しました', 'error');
    }
}

// 日報の表示
function displayReports(reports) {
    const container = document.getElementById('reportsTable');
    
    if (reports.length === 0) {
        container.innerHTML = '<p>該当する日報がありません</p>';
        return;
    }
    
    const html = `
        <table>
            <thead>
                <tr>
                    <th>日付</th>
                    <th>氏名</th>
                    <th>業務内容</th>
                    <th>成果</th>
                    <th>操作</th>
                </tr>
            </thead>
            <tbody>
                ${reports.map(report => `
                    <tr>
                        <td>${report.report_date}</td>
                        <td>${report.employee_name}</td>
                        <td>${truncateText(report.work_content, 30)}</td>
                        <td>${truncateText(report.achievements || '-', 30)}</td>
                        <td>
                            <button class="btn btn-sm" onclick='viewReport(${JSON.stringify(report)})'>詳細</button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    
    container.innerHTML = html;
}

// 日報詳細の表示
function viewReport(report) {
    const modal = document.getElementById('reportModal');
    const detail = document.getElementById('reportDetail');
    
    detail.innerHTML = `
        <div class="report-detail">
            <p><strong>日付:</strong> ${report.report_date}</p>
            <p><strong>従業員:</strong> ${report.employee_name}</p>
            <p><strong>作成日時:</strong> ${report.created_at}</p>
            <p><strong>更新日時:</strong> ${report.updated_at}</p>
            
            <h3>業務内容</h3>
            <p>${report.work_content.replace(/\n/g, '<br>')}</p>
            
            ${report.achievements ? `
                <h3>成果・達成事項</h3>
                <p>${report.achievements.replace(/\n/g, '<br>')}</p>
            ` : ''}
            
            ${report.issues ? `
                <h3>課題・問題点</h3>
                <p>${report.issues.replace(/\n/g, '<br>')}</p>
            ` : ''}
            
            ${report.tomorrow_plan ? `
                <h3>明日の予定</h3>
                <p>${report.tomorrow_plan.replace(/\n/g, '<br>')}</p>
            ` : ''}
            
            ${report.remarks ? `
                <h3>備考</h3>
                <p>${report.remarks.replace(/\n/g, '<br>')}</p>
            ` : ''}
        </div>
    `;
    
    modal.style.display = 'block';
}

// モーダルを閉じる
function closeReportModal() {
    document.getElementById('reportModal').style.display = 'none';
}

// モーダル外クリックで閉じる
window.onclick = function(event) {
    const modal = document.getElementById('reportModal');
    if (event.target === modal) {
        modal.style.display = 'none';
    }
}

// タグ工数読み込み
async function loadTagHours() {
    try {
        const params = new URLSearchParams();
        const startDate = document.getElementById('tagHoursStartDate').value;
        const endDate = document.getElementById('tagHoursEndDate').value;
        if (startDate) params.append('start_date', startDate);
        if (endDate) params.append('end_date', endDate);
        const response = await fetch(`/api/tag-work-summary?${params}`);
        const data = await response.json();
        displayTagHours(data);
    } catch (error) {
        console.error('タグ工数読み込みエラー:', error);
        showMessage('タグ工数の取得に失敗しました', 'error');
    }
}

// Notionタグ同期
async function syncTags() {
    try {
        const response = await fetch('/api/tags/sync', { method: 'POST' });
        const result = await response.json();
        if (response.ok) {
            showMessage(result.message, 'success');
            loadTagHours();
        } else {
            showMessage(result.error || '同期に失敗しました', 'error');
        }
    } catch (error) {
        console.error('タグ同期エラー:', error);
        showMessage('同期に失敗しました', 'error');
    }
}

function displayTagHours(list) {
    const container = document.getElementById('tagHoursTable');
    if (!list || list.length === 0) {
        container.innerHTML = '<p>データがありません</p>';
        return;
    }
    const html = `
        <table>
            <thead>
                <tr>
                    <th>タグ</th>
                    <th>総工数(時間)</th>
                </tr>
            </thead>
            <tbody>
                ${list.map(r => `
                    <tr>
                        <td>${r.tag}</td>
                        <td>${r.total_hours}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    container.innerHTML = html;
}

// テキストの切り詰め
function truncateText(text, maxLength) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

// メッセージ表示
function showMessage(text, type = 'info', duration = 5000) {
    const messageEl = document.getElementById('adminMessage');
    messageEl.textContent = text;
    messageEl.className = `message ${type}`;
    messageEl.style.display = 'block';
    
    if (duration > 0) {
        setTimeout(() => {
            messageEl.style.display = 'none';
        }, duration);
    }
}
