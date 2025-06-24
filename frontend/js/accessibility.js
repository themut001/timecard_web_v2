// アクセシビリティ強化とキーボードナビゲーション

class AccessibilityManager {
    constructor() {
        this.focusableElements = [];
        this.currentFocusIndex = -1;
        this.isKeyboardMode = false;
        this.announcements = [];
        
        this.init();
    }

    init() {
        this.setupKeyboardNavigation();
        this.setupAriaLabels();
        this.setupFocusManagement();
        this.setupScreenReader();
        this.setupColorBlindSupport();
        this.setupMotionPreferences();
    }

    // キーボードナビゲーションの設定
    setupKeyboardNavigation() {
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardNavigation(e);
        });

        // タブキーでフォーカス移動時にキーボードモードを有効化
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                this.isKeyboardMode = true;
                document.body.classList.add('keyboard-navigation');
            }
        });

        // マウスクリック時にキーボードモードを無効化
        document.addEventListener('mousedown', () => {
            this.isKeyboardMode = false;
            document.body.classList.remove('keyboard-navigation');
        });
    }

    handleKeyboardNavigation(e) {
        switch (e.key) {
            case 'Enter':
            case ' ':
                this.handleEnterSpace(e);
                break;
            case 'Escape':
                this.handleEscape(e);
                break;
            case 'F1':
                e.preventDefault();
                this.showKeyboardShortcuts();
                break;
            case 'h':
                if (e.altKey) {
                    e.preventDefault();
                    this.showHelp();
                }
                break;
            case 's':
                if (e.ctrlKey || e.metaKey) {
                    e.preventDefault();
                    this.triggerSaveAction();
                }
                break;
        }
    }

    handleEnterSpace(e) {
        const target = e.target;
        
        // ボタンや選択可能な要素でEnter/Spaceが押された場合
        if (target.tagName === 'BUTTON' || 
            target.hasAttribute('tabindex') || 
            target.classList.contains('clickable')) {
            
            e.preventDefault();
            target.click();
            this.announceAction(`${target.textContent || target.ariaLabel}が選択されました`);
        }
    }

    handleEscape(e) {
        // モーダルやドロップダウンを閉じる
        const activeModal = document.querySelector('.modal.active');
        if (activeModal) {
            this.closeModal(activeModal);
            return;
        }

        // フォーカスをリセット
        document.activeElement.blur();
    }

    // ARIA ラベルの設定
    setupAriaLabels() {
        // ボタンのARIAラベル
        const checkInBtn = document.getElementById('checkInBtn');
        if (checkInBtn) {
            checkInBtn.setAttribute('aria-label', '出勤打刻ボタン。クリックまたはEnterキーで出勤を記録します');
            checkInBtn.setAttribute('aria-describedby', 'checkin-description');
        }

        const checkOutBtn = document.getElementById('checkOutBtn');
        if (checkOutBtn) {
            checkOutBtn.setAttribute('aria-label', '退勤打刻ボタン。クリックまたはEnterキーで退勤を記録します');
            checkOutBtn.setAttribute('aria-describedby', 'checkout-description');
        }

        // セレクトボックスのARIAラベル
        const employeeSelect = document.getElementById('employeeId');
        if (employeeSelect) {
            employeeSelect.setAttribute('aria-label', '従業員選択。矢印キーで選択肢を移動できます');
            employeeSelect.setAttribute('aria-required', 'true');
        }

        // ライブリージョンの設定
        this.setupLiveRegions();
    }

    setupLiveRegions() {
        // メッセージ用のライブリージョン
        const messageArea = document.getElementById('message');
        if (messageArea) {
            messageArea.setAttribute('role', 'status');
            messageArea.setAttribute('aria-live', 'polite');
            messageArea.setAttribute('aria-atomic', 'true');
        }

        // 勤務状態用のライブリージョン
        const workStatus = document.getElementById('workStatus');
        if (workStatus) {
            workStatus.setAttribute('role', 'status');
            workStatus.setAttribute('aria-live', 'polite');
        }

        // 時計用のライブリージョン（分単位で更新）
        const clock = document.getElementById('clock');
        if (clock) {
            clock.setAttribute('role', 'timer');
            clock.setAttribute('aria-live', 'off'); // 過度な読み上げを防ぐ
        }
    }

    // フォーカス管理
    setupFocusManagement() {
        this.updateFocusableElements();
        
        // フォーカストラップの設定
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                this.handleTabNavigation(e);
            }
        });

        // フォーカス可能要素が動的に変更される場合に対応
        const observer = new MutationObserver(() => {
            this.updateFocusableElements();
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['disabled', 'hidden', 'tabindex']
        });
    }

    updateFocusableElements() {
        const selectors = [
            'button:not([disabled])',
            'select:not([disabled])',
            'input:not([disabled])',
            'textarea:not([disabled])',
            'a[href]',
            '[tabindex]:not([tabindex="-1"])'
        ];

        this.focusableElements = Array.from(
            document.querySelectorAll(selectors.join(', '))
        ).filter(el => {
            return el.offsetParent !== null && 
                   !el.hasAttribute('hidden') &&
                   getComputedStyle(el).visibility !== 'hidden';
        });
    }

    handleTabNavigation(e) {
        if (this.focusableElements.length === 0) return;

        const currentIndex = this.focusableElements.indexOf(document.activeElement);
        
        if (e.shiftKey) {
            // Shift+Tab（前の要素へ）
            const prevIndex = currentIndex <= 0 ? 
                this.focusableElements.length - 1 : 
                currentIndex - 1;
            this.focusableElements[prevIndex].focus();
        } else {
            // Tab（次の要素へ）
            const nextIndex = currentIndex >= this.focusableElements.length - 1 ? 
                0 : 
                currentIndex + 1;
            this.focusableElements[nextIndex].focus();
        }
    }

    // スクリーンリーダー対応
    setupScreenReader() {
        // ページタイトルの動的更新
        this.updatePageTitle('タイムカード - 打刻画面');

        // 構造的なランドマークの設定
        this.setupLandmarks();
    }

    setupLandmarks() {
        // メインコンテンツの識別
        const mainContent = document.querySelector('.max-w-6xl');
        if (mainContent) {
            mainContent.setAttribute('role', 'main');
            mainContent.setAttribute('aria-label', 'メインコンテンツ');
        }

        // ヘッダーの識別
        const header = document.querySelector('header');
        if (header) {
            header.setAttribute('role', 'banner');
            header.setAttribute('aria-label', 'ページヘッダー');
        }

        // ナビゲーションの識別
        const nav = document.querySelector('nav');
        if (nav) {
            nav.setAttribute('role', 'navigation');
            nav.setAttribute('aria-label', 'メインナビゲーション');
        }
    }

    // 色覚異常対応
    setupColorBlindSupport() {
        // 色に依存しない情報伝達の確保
        const buttons = document.querySelectorAll('.btn-glass-success, .btn-glass-danger');
        buttons.forEach(btn => {
            if (btn.classList.contains('btn-glass-success')) {
                btn.setAttribute('data-action', 'positive');
                this.addIcon(btn, 'success');
            } else if (btn.classList.contains('btn-glass-danger')) {
                btn.setAttribute('data-action', 'negative');
                this.addIcon(btn, 'warning');
            }
        });
    }

    addIcon(element, type) {
        const iconMap = {
            success: '✓',
            warning: '⚠',
            info: 'ℹ',
            error: '✗'
        };

        const icon = document.createElement('span');
        icon.className = 'sr-only';
        icon.textContent = iconMap[type] || '';
        element.prepend(icon);
    }

    // アニメーション設定の考慮
    setupMotionPreferences() {
        // ユーザーがアニメーションを無効化している場合
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            this.disableAnimations();
        }

        // 設定変更を監視
        window.matchMedia('(prefers-reduced-motion: reduce)')
            .addEventListener('change', (e) => {
                if (e.matches) {
                    this.disableAnimations();
                } else {
                    this.enableAnimations();
                }
            });
    }

    disableAnimations() {
        document.body.classList.add('no-animations');
        
        // CSSでアニメーションを無効化
        const style = document.createElement('style');
        style.textContent = `
            .no-animations *,
            .no-animations *::before,
            .no-animations *::after {
                animation-duration: 0.01ms !important;
                animation-iteration-count: 1 !important;
                transition-duration: 0.01ms !important;
                scroll-behavior: auto !important;
            }
        `;
        document.head.appendChild(style);
    }

    enableAnimations() {
        document.body.classList.remove('no-animations');
    }

    // 音声案内
    announceAction(message, priority = 'polite') {
        const announcement = document.createElement('div');
        announcement.setAttribute('aria-live', priority);
        announcement.setAttribute('aria-atomic', 'true');
        announcement.className = 'sr-only';
        announcement.textContent = message;
        
        document.body.appendChild(announcement);
        
        // 読み上げ後に要素を削除
        setTimeout(() => {
            document.body.removeChild(announcement);
        }, 1000);
    }

    // ヘルプとキーボードショートカット
    showKeyboardShortcuts() {
        const shortcuts = `
            キーボードショートカット:
            - Tab: 次の要素に移動
            - Shift+Tab: 前の要素に移動
            - Enter/Space: ボタンをクリック
            - Escape: モーダルを閉じる/フォーカスをリセット
            - Alt+H: ヘルプを表示
            - F1: このショートカット一覧を表示
            - Ctrl+S: 保存操作を実行
        `;
        
        this.announceAction(shortcuts, 'assertive');
        alert(shortcuts); // 簡易的な表示
    }

    showHelp() {
        const helpText = `
            タイムカードシステムの使い方:
            1. 従業員選択ドロップダウンから自分の名前を選択
            2. 出勤時は「出勤」ボタンをクリック
            3. 退勤時は「退勤」ボタンをクリック
            4. カメラが利用可能な場合は写真も自動撮影されます
            
            キーボード操作:
            - Tabキーで要素間を移動できます
            - Enter/Spaceキーでボタンを押せます
            - F1キーでキーボードショートカット一覧を表示
        `;
        
        this.announceAction(helpText, 'assertive');
        alert(helpText); // 簡易的な表示
    }

    triggerSaveAction() {
        // 現在フォーカスされている要素に応じて適切な保存操作を実行
        const activeElement = document.activeElement;
        
        if (activeElement.id === 'checkInBtn' && !activeElement.disabled) {
            activeElement.click();
            this.announceAction('出勤打刻を実行しました');
        } else if (activeElement.id === 'checkOutBtn' && !activeElement.disabled) {
            activeElement.click();
            this.announceAction('退勤打刻を実行しました');
        }
    }

    updatePageTitle(title) {
        document.title = title;
    }

    // モーダル関連（将来の拡張用）
    closeModal(modal) {
        modal.classList.remove('active');
        modal.setAttribute('aria-hidden', 'true');
        
        // フォーカスを元の要素に戻す
        const trigger = modal.getAttribute('data-trigger');
        if (trigger) {
            document.getElementById(trigger)?.focus();
        }
    }

    // エラーメッセージの改善
    showAccessibleError(message, element = null) {
        this.announceAction(`エラー: ${message}`, 'assertive');
        
        if (element) {
            element.setAttribute('aria-invalid', 'true');
            element.setAttribute('aria-describedby', 'error-message');
            
            // エラーメッセージ要素の作成/更新
            let errorDiv = document.getElementById('error-message');
            if (!errorDiv) {
                errorDiv = document.createElement('div');
                errorDiv.id = 'error-message';
                errorDiv.className = 'sr-only';
                element.parentNode.appendChild(errorDiv);
            }
            errorDiv.textContent = message;
        }
    }

    clearError(element) {
        element.setAttribute('aria-invalid', 'false');
        element.removeAttribute('aria-describedby');
        
        const errorDiv = document.getElementById('error-message');
        if (errorDiv) {
            errorDiv.remove();
        }
    }
}

// ページ読み込み時にアクセシビリティマネージャーを初期化
document.addEventListener('DOMContentLoaded', () => {
    window.accessibilityManager = new AccessibilityManager();
});

// グローバル関数としてエクスポート
window.announceAction = (message, priority = 'polite') => {
    if (window.accessibilityManager) {
        window.accessibilityManager.announceAction(message, priority);
    }
};

window.showAccessibleError = (message, element = null) => {
    if (window.accessibilityManager) {
        window.accessibilityManager.showAccessibleError(message, element);
    }
};

// スクリーンリーダー専用のスタイル
const srOnlyStyle = document.createElement('style');
srOnlyStyle.textContent = `
    .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
    }
    
    /* キーボードナビゲーション時のフォーカススタイル */
    .keyboard-navigation *:focus {
        outline: 3px solid #4F46E5 !important;
        outline-offset: 2px !important;
        box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.3) !important;
    }
    
    /* ハイコントラストモード対応 */
    @media (prefers-contrast: high) {
        .glass-card {
            background: rgba(255, 255, 255, 0.95) !important;
            border: 2px solid #000 !important;
        }
        
        .btn-glass-success, .btn-glass-danger {
            border: 2px solid #000 !important;
        }
    }
`;

document.head.appendChild(srOnlyStyle);