// アニメーション効果の最適化とUX向上

class AnimationManager {
    constructor() {
        this.isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        this.animationQueue = [];
        this.isAnimating = false;
        
        this.init();
    }

    init() {
        this.setupMotionPreferences();
        this.setupIntersectionObserver();
        this.setupAdvancedAnimations();
        this.setupMicroInteractions();
        this.setupLoadingAnimations();
    }

    // モーション設定の監視
    setupMotionPreferences() {
        const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        motionQuery.addEventListener('change', (e) => {
            this.isReducedMotion = e.matches;
            this.updateAnimationSettings();
        });
    }

    updateAnimationSettings() {
        if (this.isReducedMotion) {
            document.documentElement.style.setProperty('--animation-duration', '0.01s');
            document.documentElement.style.setProperty('--transition-duration', '0.01s');
        } else {
            document.documentElement.style.setProperty('--animation-duration', '0.3s');
            document.documentElement.style.setProperty('--transition-duration', '0.3s');
        }
    }

    // Intersection Observer でのアニメーション最適化
    setupIntersectionObserver() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '50px 0px'
        };

        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.animateElement(entry.target);
                }
            });
        }, observerOptions);

        // アニメーション対象要素を監視
        document.querySelectorAll('.animate-on-scroll').forEach(el => {
            this.observer.observe(el);
        });
    }

    animateElement(element) {
        if (this.isReducedMotion) return;

        const animationType = element.dataset.animation || 'fadeIn';
        const delay = element.dataset.delay || 0;
        const duration = element.dataset.duration || 300;

        setTimeout(() => {
            element.classList.add('animate-visible');
            this.applyAnimation(element, animationType, duration);
        }, delay);
    }

    applyAnimation(element, type, duration) {
        const animations = {
            fadeIn: {
                opacity: [0, 1],
                transform: ['translateY(20px)', 'translateY(0)']
            },
            slideUp: {
                opacity: [0, 1],
                transform: ['translateY(50px)', 'translateY(0)']
            },
            slideLeft: {
                opacity: [0, 1],
                transform: ['translateX(50px)', 'translateX(0)']
            },
            scaleIn: {
                opacity: [0, 1],
                transform: ['scale(0.8)', 'scale(1)']
            },
            bounceIn: {
                opacity: [0, 1],
                transform: ['scale(0.3)', 'scale(1.05)', 'scale(1)']
            }
        };

        const keyframes = animations[type] || animations.fadeIn;
        
        element.animate(keyframes, {
            duration: duration,
            easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
            fill: 'forwards'
        });
    }

    // 高度なアニメーション効果
    setupAdvancedAnimations() {
        this.setupParallaxEffect();
        this.setupHoverAnimations();
        this.setupButtonRippleEffect();
        this.setupGlowEffects();
    }

    setupParallaxEffect() {
        if (this.isReducedMotion) return;

        const parallaxElements = document.querySelectorAll('.parallax-element');
        
        window.addEventListener('scroll', this.throttle(() => {
            const scrolled = window.pageYOffset;
            
            parallaxElements.forEach(element => {
                const speed = element.dataset.speed || 0.5;
                const yPos = -(scrolled * speed);
                element.style.transform = `translateY(${yPos}px)`;
            });
        }, 16)); // 60fps
    }

    setupHoverAnimations() {
        const hoverElements = document.querySelectorAll('.hover-animate');
        
        hoverElements.forEach(element => {
            element.addEventListener('mouseenter', () => {
                if (!this.isReducedMotion) {
                    this.createHoverEffect(element);
                }
            });
            
            element.addEventListener('mouseleave', () => {
                if (!this.isReducedMotion) {
                    this.removeHoverEffect(element);
                }
            });
        });
    }

    createHoverEffect(element) {
        element.animate([
            { transform: 'scale(1)', filter: 'brightness(1)' },
            { transform: 'scale(1.05)', filter: 'brightness(1.1)' }
        ], {
            duration: 200,
            easing: 'ease-out',
            fill: 'forwards'
        });
    }

    removeHoverEffect(element) {
        element.animate([
            { transform: 'scale(1.05)', filter: 'brightness(1.1)' },
            { transform: 'scale(1)', filter: 'brightness(1)' }
        ], {
            duration: 200,
            easing: 'ease-out',
            fill: 'forwards'
        });
    }

    setupButtonRippleEffect() {
        const buttons = document.querySelectorAll('button, .btn');
        
        buttons.forEach(button => {
            button.addEventListener('click', (e) => {
                if (this.isReducedMotion) return;
                
                const ripple = document.createElement('span');
                const rect = button.getBoundingClientRect();
                const size = Math.max(rect.width, rect.height);
                const x = e.clientX - rect.left - size / 2;
                const y = e.clientY - rect.top - size / 2;
                
                ripple.style.cssText = `
                    position: absolute;
                    width: ${size}px;
                    height: ${size}px;
                    left: ${x}px;
                    top: ${y}px;
                    background: rgba(255, 255, 255, 0.3);
                    border-radius: 50%;
                    pointer-events: none;
                    transform: scale(0);
                    z-index: 1;
                `;
                
                button.style.position = 'relative';
                button.style.overflow = 'hidden';
                button.appendChild(ripple);
                
                ripple.animate([
                    { transform: 'scale(0)', opacity: 1 },
                    { transform: 'scale(2)', opacity: 0 }
                ], {
                    duration: 600,
                    easing: 'ease-out'
                }).onfinish = () => ripple.remove();
            });
        });
    }

    setupGlowEffects() {
        const glowElements = document.querySelectorAll('.glow-on-hover');
        
        glowElements.forEach(element => {
            element.addEventListener('mouseenter', () => {
                if (!this.isReducedMotion) {
                    this.addGlowEffect(element);
                }
            });
            
            element.addEventListener('mouseleave', () => {
                if (!this.isReducedMotion) {
                    this.removeGlowEffect(element);
                }
            });
        });
    }

    addGlowEffect(element) {
        const glowColor = element.dataset.glowColor || 'rgba(59, 130, 246, 0.5)';
        
        element.animate([
            { boxShadow: '0 0 0 rgba(0,0,0,0)' },
            { boxShadow: `0 0 20px ${glowColor}` }
        ], {
            duration: 300,
            easing: 'ease-out',
            fill: 'forwards'
        });
    }

    removeGlowEffect(element) {
        element.animate([
            { boxShadow: `0 0 20px rgba(59, 130, 246, 0.5)` },
            { boxShadow: '0 0 0 rgba(0,0,0,0)' }
        ], {
            duration: 300,
            easing: 'ease-out',
            fill: 'forwards'
        });
    }

    // マイクロインタラクション
    setupMicroInteractions() {
        this.setupFormInteractions();
        this.setupToggleAnimations();
        this.setupProgressAnimations();
    }

    setupFormInteractions() {
        const inputs = document.querySelectorAll('input, select, textarea');
        
        inputs.forEach(input => {
            // フォーカス時のアニメーション
            input.addEventListener('focus', () => {
                if (!this.isReducedMotion) {
                    this.animateFocus(input);
                }
            });
            
            // バリデーション結果のアニメーション
            input.addEventListener('invalid', () => {
                if (!this.isReducedMotion) {
                    this.animateError(input);
                }
            });
        });
    }

    animateFocus(element) {
        element.animate([
            { transform: 'scale(1)', boxShadow: '0 0 0 0 rgba(59, 130, 246, 0)' },
            { transform: 'scale(1.02)', boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.3)' }
        ], {
            duration: 200,
            easing: 'ease-out',
            fill: 'forwards'
        });
    }

    animateError(element) {
        element.animate([
            { transform: 'translateX(0)' },
            { transform: 'translateX(-5px)' },
            { transform: 'translateX(5px)' },
            { transform: 'translateX(-5px)' },
            { transform: 'translateX(0)' }
        ], {
            duration: 400,
            easing: 'ease-in-out'
        });
    }

    setupToggleAnimations() {
        const toggles = document.querySelectorAll('[data-toggle]');
        
        toggles.forEach(toggle => {
            toggle.addEventListener('click', () => {
                if (!this.isReducedMotion) {
                    this.animateToggle(toggle);
                }
            });
        });
    }

    animateToggle(element) {
        const isActive = element.classList.contains('active');
        
        element.animate([
            { transform: 'rotate(0deg)' },
            { transform: 'rotate(180deg)' }
        ], {
            duration: 300,
            easing: 'ease-in-out',
            direction: isActive ? 'reverse' : 'normal'
        });
    }

    setupProgressAnimations() {
        const progressBars = document.querySelectorAll('.progress-bar');
        
        progressBars.forEach(bar => {
            this.animateProgress(bar);
        });
    }

    animateProgress(progressBar) {
        const targetWidth = progressBar.dataset.progress || '0%';
        
        progressBar.animate([
            { width: '0%' },
            { width: targetWidth }
        ], {
            duration: 1000,
            easing: 'ease-out',
            fill: 'forwards'
        });
    }

    // ローディングアニメーション
    setupLoadingAnimations() {
        this.createLoadingSpinner();
        this.setupSkeletonLoading();
    }

    createLoadingSpinner() {
        const style = document.createElement('style');
        style.textContent = `
            .loading-spinner {
                width: 40px;
                height: 40px;
                border: 4px solid rgba(255, 255, 255, 0.3);
                border-top: 4px solid #fff;
                border-radius: 50%;
                animation: spin 1s linear infinite;
            }
            
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            
            .skeleton {
                background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
                background-size: 200% 100%;
                animation: skeleton-loading 1.5s infinite;
            }
            
            @keyframes skeleton-loading {
                0% { background-position: 200% 0; }
                100% { background-position: -200% 0; }
            }
        `;
        document.head.appendChild(style);
    }

    setupSkeletonLoading() {
        const skeletonElements = document.querySelectorAll('.skeleton');
        
        skeletonElements.forEach(element => {
            // データがロードされたらスケルトンを削除
            const observer = new MutationObserver(() => {
                if (element.textContent.trim() !== '') {
                    element.classList.remove('skeleton');
                    observer.disconnect();
                }
            });
            
            observer.observe(element, { childList: true, subtree: true });
        });
    }

    // ユーティリティ関数
    throttle(func, delay) {
        let timeoutId;
        let lastExecTime = 0;
        
        return function (...args) {
            const currentTime = Date.now();
            
            if (currentTime - lastExecTime > delay) {
                func.apply(this, args);
                lastExecTime = currentTime;
            } else {
                clearTimeout(timeoutId);
                timeoutId = setTimeout(() => {
                    func.apply(this, args);
                    lastExecTime = Date.now();
                }, delay - (currentTime - lastExecTime));
            }
        };
    }

    // パブリックメソッド
    showLoading(element) {
        if (this.isReducedMotion) {
            element.textContent = '読み込み中...';
            return;
        }
        
        const spinner = document.createElement('div');
        spinner.className = 'loading-spinner';
        element.innerHTML = '';
        element.appendChild(spinner);
    }

    hideLoading(element, content = '') {
        element.innerHTML = content;
    }

    animateCountUp(element, endValue, duration = 1000) {
        if (this.isReducedMotion) {
            element.textContent = endValue;
            return;
        }
        
        const startValue = 0;
        const increment = endValue / (duration / 16);
        let currentValue = startValue;
        
        const timer = setInterval(() => {
            currentValue += increment;
            if (currentValue >= endValue) {
                currentValue = endValue;
                clearInterval(timer);
            }
            element.textContent = Math.round(currentValue);
        }, 16);
    }

    async slideDown(element, duration = 300) {
        if (this.isReducedMotion) {
            element.style.display = 'block';
            return;
        }
        
        element.style.height = '0';
        element.style.overflow = 'hidden';
        element.style.display = 'block';
        
        const fullHeight = element.scrollHeight;
        
        await element.animate([
            { height: '0px', opacity: 0 },
            { height: `${fullHeight}px`, opacity: 1 }
        ], {
            duration,
            easing: 'ease-out'
        }).finished;
        
        element.style.height = 'auto';
        element.style.overflow = 'visible';
    }

    async slideUp(element, duration = 300) {
        if (this.isReducedMotion) {
            element.style.display = 'none';
            return;
        }
        
        const fullHeight = element.scrollHeight;
        element.style.height = `${fullHeight}px`;
        element.style.overflow = 'hidden';
        
        await element.animate([
            { height: `${fullHeight}px`, opacity: 1 },
            { height: '0px', opacity: 0 }
        ], {
            duration,
            easing: 'ease-out'
        }).finished;
        
        element.style.display = 'none';
        element.style.height = 'auto';
        element.style.overflow = 'visible';
    }

    // 成功/エラーアニメーション
    showSuccessAnimation(element) {
        if (this.isReducedMotion) return;
        
        element.animate([
            { transform: 'scale(1)', backgroundColor: 'rgba(34, 197, 94, 0.2)' },
            { transform: 'scale(1.05)', backgroundColor: 'rgba(34, 197, 94, 0.4)' },
            { transform: 'scale(1)', backgroundColor: 'rgba(34, 197, 94, 0.2)' }
        ], {
            duration: 600,
            easing: 'ease-in-out'
        });
    }

    showErrorAnimation(element) {
        if (this.isReducedMotion) return;
        
        element.animate([
            { transform: 'scale(1)', backgroundColor: 'rgba(239, 68, 68, 0.2)' },
            { transform: 'scale(1.05)', backgroundColor: 'rgba(239, 68, 68, 0.4)' },
            { transform: 'scale(1)', backgroundColor: 'rgba(239, 68, 68, 0.2)' }
        ], {
            duration: 600,
            easing: 'ease-in-out'
        });
    }
}

// グローバルインスタンス
window.animationManager = new AnimationManager();

// グローバル関数としてエクスポート
window.showLoading = (element) => window.animationManager.showLoading(element);
window.hideLoading = (element, content) => window.animationManager.hideLoading(element, content);
window.animateCountUp = (element, endValue, duration) => window.animationManager.animateCountUp(element, endValue, duration);
window.slideDown = (element, duration) => window.animationManager.slideDown(element, duration);
window.slideUp = (element, duration) => window.animationManager.slideUp(element, duration);
window.showSuccessAnimation = (element) => window.animationManager.showSuccessAnimation(element);
window.showErrorAnimation = (element) => window.animationManager.showErrorAnimation(element);

// ページ読み込み時の初期化
document.addEventListener('DOMContentLoaded', () => {
    // 既存の要素にアニメーションクラスを追加
    document.querySelectorAll('.glass-card, .glass-card-solid').forEach((el, index) => {
        el.classList.add('animate-on-scroll');
        el.dataset.animation = 'fadeIn';
        el.dataset.delay = index * 100;
    });
    
    // ボタンにホバーアニメーションを追加
    document.querySelectorAll('button').forEach(btn => {
        btn.classList.add('hover-animate');
    });
    
    // グロー効果を追加
    document.querySelectorAll('.btn-glass-success, .btn-glass-danger').forEach(btn => {
        btn.classList.add('glow-on-hover');
        btn.dataset.glowColor = btn.classList.contains('btn-glass-success') ? 
            'rgba(34, 197, 94, 0.5)' : 'rgba(239, 68, 68, 0.5)';
    });
});