// ページ読み込み時の処理
document.addEventListener('DOMContentLoaded', () => {
    // 既にログイン済みかチェック
    checkExistingSession();
    
    // フォームのイベントリスナー
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    
    // Enterキーでログイン
    document.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleLogin(e);
        }
    });
});

// 既存セッションのチェック
async function checkExistingSession() {
    try {
        const response = await fetch('/api/check-auth');
        const data = await response.json();
        
        if (response.ok && data.authenticated) {
            // 既にログイン済みの場合はリダイレクト
            window.location.href = '/';
        }
    } catch (error) {
        // エラーは無視（未ログイン状態として扱う）
    }
}

// ログイン処理
async function handleLogin(event) {
    event.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    if (!username || !password) {
        showMessage('ユーザー名とパスワードを入力してください', 'error');
        return;
    }
    
    const loginBtn = document.getElementById('loginBtn');
    loginBtn.disabled = true;
    loginBtn.textContent = 'ログイン中...';
    
    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            if (data.user.is_admin) {
                // 管理者は選択画面を表示（成功メッセージは表示しない）
                showRedirectOptions();
            } else {
                // 一般ユーザーは成功メッセージ後に打刻画面へ
                showMessage('ログインしました', 'success');
                setTimeout(() => {
                    window.location.href = '/';
                }, 1000);
            }
            
        } else {
            showMessage(data.error || 'ログインに失敗しました', 'error');
            loginBtn.disabled = false;
            loginBtn.textContent = 'ログイン';
        }
        
    } catch (error) {
        console.error('ログインエラー:', error);
        showMessage('ログイン処理中にエラーが発生しました', 'error');
        loginBtn.disabled = false;
        loginBtn.textContent = 'ログイン';
    }
}

// リダイレクトオプションの表示（管理者用）
function showRedirectOptions() {
    const message = document.getElementById('loginMessage');
    const optionsHtml = `
        <div class="text-center space-y-4">
            <div class="flex items-center justify-center space-x-2 text-green-100">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <span class="font-semibold">ログインしました</span>
            </div>
            <p class="text-white/80">どちらの画面に移動しますか？</p>
            <div class="flex flex-col sm:flex-row gap-3 mt-4">
                <button onclick="window.location.href='/'" class="flex-1 py-3 px-6 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105">
                    <span class="flex items-center justify-center">
                        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        打刻画面
                    </span>
                </button>
                <button onclick="window.location.href='/admin'" class="flex-1 py-3 px-6 bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105">
                    <span class="flex items-center justify-center">
                        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                        </svg>
                        管理画面
                    </span>
                </button>
            </div>
        </div>
    `;
    
    // Tailwind CSSクラスを適用
    message.innerHTML = optionsHtml;
    message.className = 'mt-6 p-6 rounded-xl bg-green-500/20 border border-green-500/30 transition-all duration-300';
    message.classList.remove('hidden');
    
    // この画面は自動的に消さない
}

// メッセージ表示（Tailwind CSS対応）
function showMessage(text, type = 'info') {
    const messageEl = document.getElementById('loginMessage');
    
    // HTMLコンテンツか通常のテキストかを判定
    if (text.includes('<div') || text.includes('<button')) {
        // HTMLコンテンツの場合（管理者選択画面）
        messageEl.innerHTML = text;
    } else {
        // 通常のテキストメッセージの場合
        messageEl.textContent = text;
    }
    
    // Tailwind CSSクラスを適用
    messageEl.className = getMessageClasses(type);
    messageEl.classList.remove('hidden');
    
    // エラーメッセージと管理者選択画面以外は自動的に非表示
    if (type !== 'error' && !text.includes('<button')) {
        setTimeout(() => {
            messageEl.classList.add('hidden');
        }, 5000);
    }
}

// メッセージタイプに応じたTailwind CSSクラスを返す
function getMessageClasses(type) {
    const baseClasses = 'mt-6 p-4 rounded-xl text-center text-sm font-medium transition-all duration-300';
    
    switch (type) {
        case 'success':
            return `${baseClasses} bg-green-500/20 text-green-100 border border-green-500/30`;
        case 'error':
            return `${baseClasses} bg-red-500/20 text-red-100 border border-red-500/30`;
        case 'warning':
            return `${baseClasses} bg-yellow-500/20 text-yellow-100 border border-yellow-500/30`;
        default:
            return `${baseClasses} bg-blue-500/20 text-blue-100 border border-blue-500/30`;
    }
}
