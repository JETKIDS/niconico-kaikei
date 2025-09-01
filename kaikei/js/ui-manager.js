/**
 * 保存状態管理クラス
 * 自動保存状態の表示と管理を担当
 */
class SaveStatusManager {
    constructor() {
        this.statusElement = null;
        this.statusTextElement = null;
        this.statusIconElement = null;
        this.hasUnsavedChanges = false;
        this.lastSaveTime = null;
        this.retryTimeoutId = null;
        
        this.init();
    }

    /**
     * 初期化
     */
    init() {
        // DOM要素の取得
        this.statusElement = document.getElementById('save-status');
        this.statusTextElement = document.getElementById('save-status-text');
        this.statusIconElement = document.getElementById('save-status-icon');
        
        // イベントリスナーの設定
        this.setupEventListeners();
        
        // 初期状態の設定
        this.showStatus('ready', 'データ準備完了');
    }

    /**
     * イベントリスナー設定
     */
    setupEventListeners() {
        // データ保存状態の監視
        document.addEventListener('dataSaveStatus', (event) => {
            const { success, timestamp, error, recordCount } = event.detail;
            
            if (success) {
                this.lastSaveTime = timestamp;
                this.hasUnsavedChanges = false;
                this.showStatus('saved', `保存完了 (${recordCount}件) - ${this.formatTime(timestamp)}`);
                
                // 3秒後に通常状態に戻す
                setTimeout(() => {
                    if (!this.hasUnsavedChanges) {
                        this.showStatus('ready', '最新の状態');
                    }
                }, 3000);
            } else {
                this.showStatus('error', `保存エラー: ${error || '不明なエラー'}`);
            }
        });

        // データ変更の監視
        document.addEventListener('dataChanged', (event) => {
            this.hasUnsavedChanges = true;
            this.showStatus('unsaved', '未保存の変更があります');
        });

        // 保存再試行が必要な場合
        document.addEventListener('saveRetryRequired', (event) => {
            const { error, retryCount, hasUnsavedChanges } = event.detail;
            this.hasUnsavedChanges = hasUnsavedChanges;
            this.showRetryDialog(error, retryCount);
        });

        // ページ離脱時の警告
        window.addEventListener('beforeunload', (event) => {
            if (this.hasUnsavedChanges) {
                event.preventDefault();
                event.returnValue = '未保存の変更があります。ページを離れますか？';
                return event.returnValue;
            }
        });
    }

    /**
     * 状態表示
     */
    showStatus(type, message) {
        if (!this.statusElement || !this.statusTextElement || !this.statusIconElement) {
            return;
        }

        // 既存のクラスをクリア
        this.statusElement.className = 'save-status';
        
        // 状態に応じたスタイルとアイコンを設定
        switch (type) {
            case 'ready':
                this.statusElement.classList.add('status-ready');
                this.statusIconElement.textContent = '✓';
                break;
            case 'saving':
                this.statusElement.classList.add('status-saving');
                this.statusIconElement.textContent = '💾';
                break;
            case 'saved':
                this.statusElement.classList.add('status-saved');
                this.statusIconElement.textContent = '✅';
                break;
            case 'unsaved':
                this.statusElement.classList.add('status-unsaved');
                this.statusIconElement.textContent = '⚠️';
                break;
            case 'error':
                this.statusElement.classList.add('status-error');
                this.statusIconElement.textContent = '❌';
                break;
            case 'loading':
                this.statusElement.classList.add('status-loading');
                this.statusIconElement.textContent = '⏳';
                break;
        }

        this.statusTextElement.textContent = message;
    }

    /**
     * 再試行ダイアログ表示
     */
    showRetryDialog(errorMessage, retryCount) {
        const message = `データの保存に失敗しました (試行回数: ${retryCount}回)\n\nエラー: ${errorMessage}\n\n手動で再試行しますか？`;
        
        if (confirm(message)) {
            this.showStatus('saving', '保存を再試行中...');
            
            // DataManagerの再試行メソッドを呼び出し
            if (window.dataManager && typeof window.dataManager.retrySave === 'function') {
                window.dataManager.retrySave().catch((error) => {
                    console.error('手動再試行も失敗しました:', error);
                    this.showStatus('error', '保存に失敗しました');
                });
            }
        } else {
            this.showStatus('unsaved', '未保存の変更があります（保存に失敗）');
        }
    }

    /**
     * 時刻フォーマット
     */
    formatTime(date) {
        return date.toLocaleTimeString('ja-JP', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    }

    /**
     * 保存状態の手動更新
     */
    updateSaveStatus(hasUnsavedChanges = null) {
        if (hasUnsavedChanges !== null) {
            this.hasUnsavedChanges = hasUnsavedChanges;
        }

        if (this.hasUnsavedChanges) {
            this.showStatus('unsaved', '未保存の変更があります');
        } else if (this.lastSaveTime) {
            this.showStatus('ready', `最後の保存: ${this.formatTime(this.lastSaveTime)}`);
        } else {
            this.showStatus('ready', '最新の状態');
        }
    }

    /**
     * 保存中状態の表示
     */
    showSaving() {
        this.showStatus('saving', '保存中...');
    }

    /**
     * ローディング状態の表示
     */
    showLoading(message = 'データ読み込み中...') {
        this.showStatus('loading', message);
    }
}

/**
 * ローディング管理クラス
 * ローディング状態の表示と管理を担当
 */
class LoadingManager {
    constructor() {
        this.activeLoaders = new Set();
        this.loadingOverlay = null;
    }

    /**
     * ローディング表示
     */
    show(message = 'データを読み込み中...', subtext = '') {
        const loaderId = Date.now().toString();
        this.activeLoaders.add(loaderId);

        if (!this.loadingOverlay) {
            this.loadingOverlay = document.createElement('div');
            this.loadingOverlay.className = 'loading-overlay';
            this.loadingOverlay.innerHTML = `
                <div class="loading-content">
                    <div class="loading-spinner"></div>
                    <div class="loading-text" id="loading-text">${message}</div>
                    <div class="loading-subtext" id="loading-subtext">${subtext}</div>
                </div>
            `;
            document.body.appendChild(this.loadingOverlay);
        } else {
            document.getElementById('loading-text').textContent = message;
            document.getElementById('loading-subtext').textContent = subtext;
        }

        return loaderId;
    }

    /**
     * ローディング非表示
     */
    hide(loaderId) {
        if (loaderId) {
            this.activeLoaders.delete(loaderId);
        }

        if (this.activeLoaders.size === 0 && this.loadingOverlay) {
            this.loadingOverlay.remove();
            this.loadingOverlay = null;
        }
    }

    /**
     * 全てのローディングを非表示
     */
    hideAll() {
        this.activeLoaders.clear();
        if (this.loadingOverlay) {
            this.loadingOverlay.remove();
            this.loadingOverlay = null;
        }
    }

    /**
     * 店舗切り替え時のローディング
     */
    showStoreSwitching(element) {
        if (element) {
            element.classList.add('store-switching-loader');
        }
    }

    /**
     * 店舗切り替えローディング終了
     */
    hideStoreSwitching(element) {
        if (element) {
            element.classList.remove('store-switching-loader');
        }
    }
}

/**
 * トースト通知管理クラス
 */
class ToastManager {
    constructor() {
        this.container = null;
        this.toasts = new Map();
        this.init();
    }

    init() {
        this.container = document.createElement('div');
        this.container.className = 'toast-container';
        document.body.appendChild(this.container);
    }

    /**
     * トースト表示
     */
    show(message, type = 'info', duration = 5000, title = '') {
        const toastId = Date.now().toString();
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <div class="toast-header">
                <div class="toast-title">${title || this.getDefaultTitle(type)}</div>
                <button class="toast-close" onclick="toastManager.hide('${toastId}')">&times;</button>
            </div>
            <div class="toast-body">${message}</div>
        `;

        this.container.appendChild(toast);
        this.toasts.set(toastId, toast);

        // アニメーション表示
        setTimeout(() => toast.classList.add('show'), 100);

        // 自動削除
        if (duration > 0) {
            setTimeout(() => this.hide(toastId), duration);
        }

        return toastId;
    }

    /**
     * トースト非表示
     */
    hide(toastId) {
        const toast = this.toasts.get(toastId);
        if (toast) {
            toast.classList.remove('show');
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
                this.toasts.delete(toastId);
            }, 300);
        }
    }

    /**
     * デフォルトタイトル取得
     */
    getDefaultTitle(type) {
        const titles = {
            success: '成功',
            error: 'エラー',
            warning: '警告',
            info: '情報'
        };
        return titles[type] || '通知';
    }
}

/**
 * パフォーマンス監視クラス
 */
class PerformanceMonitor {
    constructor() {
        this.metrics = {
            renderTime: [],
            dataLoadTime: [],
            memoryUsage: []
        };
        this.isMonitoring = false;
        this.indicator = null;
    }

    /**
     * 監視開始
     */
    startMonitoring() {
        this.isMonitoring = true;
        this.createIndicator();
        this.startMemoryMonitoring();
    }

    /**
     * 監視停止
     */
    stopMonitoring() {
        this.isMonitoring = false;
        if (this.indicator) {
            this.indicator.remove();
            this.indicator = null;
        }
    }

    /**
     * レンダリング時間測定
     */
    measureRenderTime(operation, callback) {
        const startTime = performance.now();
        const result = callback();
        const endTime = performance.now();
        const renderTime = endTime - startTime;
        
        this.metrics.renderTime.push(renderTime);
        this.updateIndicator('render', renderTime);
        
        if (renderTime > 100) {
            console.warn(`遅いレンダリング検出: ${operation} - ${renderTime.toFixed(2)}ms`);
        }
        
        return result;
    }

    /**
     * データ読み込み時間測定
     */
    measureDataLoadTime(operation, callback) {
        const startTime = performance.now();
        const result = callback();
        const endTime = performance.now();
        const loadTime = endTime - startTime;
        
        this.metrics.dataLoadTime.push(loadTime);
        this.updateIndicator('load', loadTime);
        
        return result;
    }

    /**
     * メモリ監視
     */
    startMemoryMonitoring() {
        if (!this.isMonitoring) return;
        
        if (performance.memory) {
            const memoryInfo = performance.memory;
            const usedMB = Math.round(memoryInfo.usedJSHeapSize / 1024 / 1024);
            this.metrics.memoryUsage.push(usedMB);
            
            if (usedMB > 100) {
                this.showMemoryWarning(usedMB);
            }
        }
        
        setTimeout(() => this.startMemoryMonitoring(), 5000);
    }

    /**
     * インジケーター作成
     */
    createIndicator() {
        this.indicator = document.createElement('div');
        this.indicator.className = 'performance-indicator';
        document.body.appendChild(this.indicator);
    }

    /**
     * インジケーター更新
     */
    updateIndicator(type, value) {
        if (!this.indicator) return;
        
        const displayValue = value.toFixed(1);
        const unit = type === 'render' || type === 'load' ? 'ms' : 'MB';
        this.indicator.textContent = `${type}: ${displayValue}${unit}`;
        this.indicator.classList.add('show');
        
        setTimeout(() => {
            if (this.indicator) {
                this.indicator.classList.remove('show');
            }
        }, 2000);
    }

    /**
     * メモリ警告表示
     */
    showMemoryWarning(usedMB) {
        if (window.toastManager) {
            window.toastManager.show(
                `メモリ使用量が多くなっています (${usedMB}MB)。ページの再読み込みを検討してください。`,
                'warning',
                10000,
                'パフォーマンス警告'
            );
        }
    }
}

/**
 * マニュアルボタン管理クラス
 * マニュアルボタンの機能とエラーハンドリングを担当
 */
class ManualButtonManager {
    constructor() {
        this.button = null;
        this.manualUrl = 'manual.html';
        this.isInitialized = false;
        this.errorMessages = {
            fileNotFound: 'マニュアルファイルが見つかりません。管理者にお問い合わせください。',
            popupBlocked: 'ポップアップがブロックされました。ブラウザの設定を確認してください。',
            generalError: 'マニュアルを開く際にエラーが発生しました。'
        };
    }

    /**
     * 初期化
     */
    init() {
        try {
            // ブラウザ互換性チェック
            if (!this.checkBrowserCompatibility()) {
                console.warn('ブラウザ互換性の問題が検出されました - 基本機能のみ利用可能');
            }

            this.button = document.getElementById('manual-button');
            if (!this.button) {
                console.error('マニュアルボタンが見つかりません');
                return false;
            }

            // 既存のクリックイベントを削除（JavaScriptが有効な場合のみ）
            this.button.removeAttribute('onclick');
            
            // 新しいイベントリスナーを追加
            this.button.addEventListener('click', (e) => this.handleClick(e));
            this.button.addEventListener('keydown', (e) => this.handleKeydown(e));

            this.isInitialized = true;
            console.log('✓ ManualButtonManager initialized with browser compatibility checks');
            return true;
        } catch (error) {
            console.error('ManualButtonManager初期化エラー:', error);
            
            // エラー時はフォールバック機能を有効化
            this.enableFallbackMode();
            return false;
        }
    }

    /**
     * ブラウザ互換性チェック
     */
    checkBrowserCompatibility() {
        const compatibility = {
            fetch: typeof fetch !== 'undefined',
            promise: typeof Promise !== 'undefined',
            addEventListener: typeof document.addEventListener !== 'undefined',
            querySelector: typeof document.querySelector !== 'undefined',
            windowOpen: typeof window.open !== 'undefined',
            localStorage: this.checkLocalStorageSupport(),
            cssSupports: typeof CSS !== 'undefined' && typeof CSS.supports !== 'undefined'
        };

        const issues = [];
        
        // 必須機能のチェック
        if (!compatibility.addEventListener) {
            issues.push('addEventListener not supported - using fallback event handling');
        }
        
        if (!compatibility.windowOpen) {
            issues.push('window.open not supported - manual navigation required');
        }
        
        if (!compatibility.fetch) {
            issues.push('fetch API not supported - file validation disabled');
        }
        
        if (!compatibility.promise) {
            issues.push('Promise not supported - async operations may fail');
        }

        // 警告の表示
        if (issues.length > 0) {
            console.group('Browser Compatibility Issues:');
            issues.forEach(issue => console.warn(issue));
            console.groupEnd();
            
            // 互換性情報をユーザーに通知
            if (window.toastManager) {
                window.toastManager.show(
                    'ブラウザの一部機能が制限されています。最新のブラウザの使用を推奨します。',
                    'warning',
                    8000,
                    'ブラウザ互換性'
                );
            }
        }

        // ブラウザ情報をログ出力
        this.logBrowserInfo();

        return issues.length === 0;
    }

    /**
     * LocalStorage対応チェック
     */
    checkLocalStorageSupport() {
        try {
            const testKey = '__localStorage_test__';
            localStorage.setItem(testKey, 'test');
            localStorage.removeItem(testKey);
            return true;
        } catch (e) {
            return false;
        }
    }

    /**
     * ブラウザ情報のログ出力
     */
    logBrowserInfo() {
        const userAgent = navigator.userAgent;
        const browserInfo = {
            userAgent: userAgent,
            language: navigator.language,
            platform: navigator.platform,
            cookieEnabled: navigator.cookieEnabled,
            onLine: navigator.onLine
        };

        // 主要ブラウザの検出
        let browserName = 'Unknown';
        if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
            browserName = 'Chrome';
        } else if (userAgent.includes('Firefox')) {
            browserName = 'Firefox';
        } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
            browserName = 'Safari';
        } else if (userAgent.includes('Edg')) {
            browserName = 'Edge';
        } else if (userAgent.includes('MSIE') || userAgent.includes('Trident')) {
            browserName = 'Internet Explorer';
        }

        console.log(`Browser detected: ${browserName}`);
        console.log('Browser info:', browserInfo);

        // 古いブラウザの警告
        if (browserName === 'Internet Explorer') {
            console.warn('Internet Explorer is not fully supported. Please use a modern browser.');
            if (window.toastManager) {
                window.toastManager.show(
                    'Internet Explorerは完全にサポートされていません。モダンブラウザの使用を強く推奨します。',
                    'error',
                    15000,
                    'ブラウザサポート'
                );
            }
        }
    }

    /**
     * フォールバックモード有効化
     */
    enableFallbackMode() {
        console.log('Enabling fallback mode for manual button');
        
        // 基本的なクリックハンドラーを設定
        if (this.button) {
            this.button.onclick = () => {
                try {
                    window.open(this.manualUrl, '_blank', 'noopener,noreferrer');
                } catch (error) {
                    console.error('Fallback manual open failed:', error);
                    alert('マニュアルを開けませんでした。URLを直接入力してください: ' + this.manualUrl);
                }
            };
        }
    }

    /**
     * クリックイベントハンドラー
     */
    async handleClick(event) {
        event.preventDefault();
        
        try {
            // ボタンを一時的に無効化
            this.setButtonState(false, '確認中...');
            
            // ファイル存在確認
            const fileExists = await this.validateManualFile();
            if (!fileExists) {
                this.showFileNotFoundError();
                return;
            }

            // マニュアルを開く
            await this.openManual();
            
        } catch (error) {
            console.error('マニュアルボタンクリックエラー:', error);
            this.showError(this.errorMessages.generalError);
        } finally {
            // ボタンを再有効化
            this.setButtonState(true, 'マニュアル');
        }
    }

    /**
     * キーボードイベントハンドラー
     */
    handleKeydown(event) {
        // Enter または Space キーでクリックイベントを発火
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            this.handleClick(event);
        }
    }

    /**
     * マニュアルファイルの存在確認
     */
    async validateManualFile() {
        // file://プロトコルの場合はfetchが使えないため、存在すると仮定
        if (window.location.protocol === 'file:') {
            console.log('✓ file://プロトコルのため、マニュアルファイルの存在を仮定します');
            return true;
        }
        
        try {
            // まずHEADリクエストで確認
            const response = await fetch(this.manualUrl, { 
                method: 'HEAD',
                cache: 'no-cache',
                timeout: 5000
            });
            
            if (response.ok) {
                console.log('✓ マニュアルファイルの存在を確認しました');
                return true;
            } else if (response.status === 404) {
                console.error('✗ マニュアルファイルが見つかりません (404)');
                return false;
            } else {
                console.warn(`マニュアルファイル確認で予期しないレスポンス: ${response.status}`);
                // 404以外のエラーの場合は存在すると仮定
                return true;
            }
        } catch (error) {
            console.warn('ファイル存在確認エラー:', error);
            
            // ネットワークエラーの場合は、より詳細な確認を試行
            return await this.fallbackFileCheck();
        }
    }

    /**
     * フォールバック用ファイル確認
     */
    async fallbackFileCheck() {
        // file://プロトコルの場合は常にtrueを返す
        if (window.location.protocol === 'file:') {
            console.log('✓ file://プロトコルのため、フォールバック確認をスキップします');
            return true;
        }
        
        try {
            // GETリクエストで再試行（より確実だが重い）
            const response = await fetch(this.manualUrl, {
                method: 'GET',
                cache: 'no-cache',
                timeout: 3000
            });
            
            if (response.ok) {
                console.log('✓ フォールバック確認でマニュアルファイルを確認しました');
                return true;
            } else if (response.status === 404) {
                console.error('✗ フォールバック確認でもマニュアルファイルが見つかりません');
                return false;
            } else {
                console.warn('フォールバック確認で予期しないレスポンス:', response.status);
                return true;
            }
        } catch (error) {
            console.warn('フォールバック確認もエラー:', error);
            // 最終的にはファイルが存在すると仮定（オフライン環境等を考慮）
            return true;
        }
    }

    /**
     * ファイル存在確認結果に基づくエラーメッセージ表示
     */
    showFileNotFoundError() {
        const detailedMessage = `
            マニュアルファイル (${this.manualUrl}) が見つかりません。
            
            考えられる原因:
            • ファイルが削除または移動された
            • ファイル名が変更された
            • サーバーの問題
            
            対処法:
            • ページを再読み込みしてください
            • 管理者にお問い合わせください
        `;

        if (window.toastManager) {
            window.toastManager.show(
                'マニュアルファイルが見つかりません',
                'error',
                10000,
                'ファイルエラー'
            );
        }

        // 詳細なエラーダイアログも表示
        if (window.uiManager && typeof window.uiManager.showEnhancedErrorMessage === 'function') {
            window.uiManager.showEnhancedErrorMessage(
                'マニュアルファイルエラー',
                detailedMessage.trim(),
                {
                    type: 'error',
                    showRetry: true,
                    retryAction: () => this.handleClick(new Event('click')),
                    showDetails: true,
                    details: `ファイルパス: ${this.manualUrl}\n確認時刻: ${new Date().toLocaleString()}`
                }
            );
        } else {
            alert(detailedMessage.trim());
        }
    }

    /**
     * マニュアルを開く
     */
    async openManual() {
        try {
            const newWindow = window.open(this.manualUrl, '_blank', 'noopener,noreferrer');
            
            // より確実なポップアップブロック検出
            if (this.isPopupBlocked(newWindow)) {
                this.handlePopupBlocked();
                return;
            }

            // 成功時のフィードバック
            this.showSuccess('マニュアルを新しいタブで開きました');
            
        } catch (error) {
            console.error('マニュアルオープンエラー:', error);
            this.handlePopupBlocked();
        }
    }

    /**
     * ポップアップブロック検出
     */
    isPopupBlocked(newWindow) {
        // 基本的な検出
        if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
            return true;
        }
        
        // より詳細な検出（一部のブラウザ用）
        try {
            // 少し待ってから再度チェック
            setTimeout(() => {
                if (newWindow.closed) {
                    console.warn('ポップアップが即座に閉じられました（ブロックされた可能性）');
                    this.handlePopupBlocked();
                }
            }, 100);
            
            // ウィンドウのプロパティにアクセスできるかチェック
            if (newWindow.location === undefined) {
                return true;
            }
            
            return false;
        } catch (error) {
            console.warn('ポップアップ検出エラー:', error);
            return true;
        }
    }

    /**
     * ポップアップブロック時の処理
     */
    handlePopupBlocked() {
        console.warn('ポップアップがブロックされました');
        
        // 詳細なポップアップブロック対応ダイアログを表示
        this.showPopupBlockedDialog();
    }

    /**
     * ポップアップブロック対応ダイアログ
     */
    showPopupBlockedDialog() {
        const dialogHTML = `
            <div class="modal-overlay" id="popup-blocked-modal">
                <div class="modal-content popup-blocked-dialog">
                    <div class="modal-header">
                        <h3>🚫 ポップアップがブロックされました</h3>
                        <button class="close-btn" onclick="manualButtonManager.hidePopupBlockedDialog()">&times;</button>
                    </div>
                    <div class="modal-body">
                        <p class="error-message">ブラウザの設定によりマニュアルを新しいタブで開けませんでした。</p>
                        
                        <div class="popup-solutions">
                            <h4>💡 解決方法:</h4>
                            <div class="solution-options">
                                <div class="solution-option">
                                    <h5>方法1: 直接リンクを使用</h5>
                                    <p>下のボタンをクリックしてマニュアルを開いてください</p>
                                    <button class="btn btn-primary" onclick="manualButtonManager.createDirectLink()">
                                        📖 マニュアルを開く
                                    </button>
                                </div>
                                
                                <div class="solution-option">
                                    <h5>方法2: 同じタブで開く</h5>
                                    <p>現在のページからマニュアルに移動します（戻るボタンで戻れます）</p>
                                    <button class="btn btn-secondary" onclick="manualButtonManager.openInSameTab()">
                                        🔄 同じタブで開く
                                    </button>
                                </div>
                                
                                <div class="solution-option">
                                    <h5>方法3: ポップアップを許可</h5>
                                    <p>ブラウザのアドレスバー付近のポップアップブロックアイコンをクリックして許可してください</p>
                                    <div class="browser-instructions">
                                        <strong>Chrome/Edge:</strong> アドレスバー右端の🚫アイコン → 「許可」<br>
                                        <strong>Firefox:</strong> アドレスバー左端の🛡️アイコン → 「ポップアップを許可」<br>
                                        <strong>Safari:</strong> 「Safari」メニュー → 「設定」→ 「Webサイト」→ 「ポップアップウィンドウ」
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="popup-prevention">
                            <h4>🔧 今後の対策:</h4>
                            <p>このサイトのポップアップを常に許可するには、ブラウザの設定で当サイトを信頼済みサイトに追加してください。</p>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-primary" onclick="manualButtonManager.createDirectLink()">
                            マニュアルを開く
                        </button>
                        <button class="btn btn-secondary" onclick="manualButtonManager.hidePopupBlockedDialog()">
                            閉じる
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', dialogHTML);
        
        // アクセシビリティ対応
        const modal = document.getElementById('popup-blocked-modal');
        if (modal) {
            modal.setAttribute('role', 'dialog');
            modal.setAttribute('aria-labelledby', 'popup-blocked-title');
            modal.setAttribute('aria-modal', 'true');
            
            // 最初のボタンにフォーカス
            const firstButton = modal.querySelector('.btn');
            if (firstButton) {
                firstButton.focus();
            }
        }
    }

    /**
     * ポップアップブロックダイアログを閉じる
     */
    hidePopupBlockedDialog() {
        const modal = document.getElementById('popup-blocked-modal');
        if (modal) {
            modal.remove();
        }
    }

    /**
     * 同じタブでマニュアルを開く
     */
    openInSameTab() {
        if (confirm('現在のページからマニュアルページに移動します。よろしいですか？\n（ブラウザの戻るボタンで戻ることができます）')) {
            try {
                window.location.href = this.manualUrl;
            } catch (error) {
                console.error('同じタブでのマニュアルオープンエラー:', error);
                this.showError('マニュアルページに移動できませんでした。');
            }
        }
    }

    /**
     * 直接リンクを作成
     */
    createDirectLink() {
        // ダイアログを閉じる
        this.hidePopupBlockedDialog();
        
        // 直接リンクを作成
        const link = document.createElement('a');
        link.href = this.manualUrl;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.textContent = '📖 マニュアルを開く (クリックしてください)';
        link.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            z-index: 10001;
            background: #a03030;
            color: white;
            padding: 20px 40px;
            border-radius: 8px;
            text-decoration: none;
            font-weight: bold;
            font-size: 16px;
            box-shadow: 0 6px 12px rgba(0,0,0,0.3);
            border: 2px solid #fff;
            cursor: pointer;
            transition: all 0.3s ease;
        `;
        
        // ホバー効果
        link.addEventListener('mouseenter', () => {
            link.style.background = '#8a2828';
            link.style.transform = 'translate(-50%, -50%) scale(1.05)';
        });
        
        link.addEventListener('mouseleave', () => {
            link.style.background = '#a03030';
            link.style.transform = 'translate(-50%, -50%) scale(1)';
        });
        
        document.body.appendChild(link);
        
        // 成功メッセージ
        this.showSuccess('直接リンクを作成しました。クリックしてマニュアルを開いてください。');
        
        // 10秒後に自動削除
        const autoRemoveTimeout = setTimeout(() => {
            if (link.parentNode) {
                link.parentNode.removeChild(link);
            }
        }, 10000);
        
        // クリック時の処理
        link.addEventListener('click', (e) => {
            // タイムアウトをクリア
            clearTimeout(autoRemoveTimeout);
            
            // 少し遅延してリンクを削除
            setTimeout(() => {
                if (link.parentNode) {
                    link.parentNode.removeChild(link);
                }
            }, 500);
            
            // 成功メッセージ
            this.showSuccess('マニュアルを開いています...');
        });
        
        // ESCキーで閉じる
        const escHandler = (e) => {
            if (e.key === 'Escape') {
                clearTimeout(autoRemoveTimeout);
                if (link.parentNode) {
                    link.parentNode.removeChild(link);
                }
                document.removeEventListener('keydown', escHandler);
            }
        };
        document.addEventListener('keydown', escHandler);
        
        // フォーカスを当てる
        link.focus();
    }

    /**
     * ボタンの状態設定
     */
    setButtonState(enabled, text) {
        if (!this.button) return;
        
        this.button.disabled = !enabled;
        const textElement = this.button.querySelector('.manual-button-text');
        if (textElement) {
            textElement.textContent = text;
        }
        
        if (enabled) {
            this.button.classList.remove('loading');
        } else {
            this.button.classList.add('loading');
        }
    }

    /**
     * エラーメッセージ表示
     */
    showError(message) {
        if (window.toastManager) {
            window.toastManager.show(message, 'error', 8000, 'マニュアルエラー');
        } else {
            alert(`エラー: ${message}`);
        }
    }

    /**
     * 成功メッセージ表示
     */
    showSuccess(message) {
        if (window.toastManager) {
            window.toastManager.show(message, 'success', 3000, 'マニュアル');
        }
    }

    /**
     * 手動でマニュアルを開く（フォールバック用）
     */
    forceOpenManual() {
        try {
            window.location.href = this.manualUrl;
        } catch (error) {
            console.error('強制マニュアルオープンエラー:', error);
            this.showError('マニュアルを開けませんでした。URLを直接入力してください: ' + this.manualUrl);
        }
    }

    /**
     * 破棄処理
     */
    destroy() {
        if (this.button) {
            this.button.removeEventListener('click', this.handleClick);
            this.button.removeEventListener('keydown', this.handleKeydown);
        }
        this.isInitialized = false;
    }
}

/**
 * UI管理クラス
 * ユーザーインターフェースの制御と表示を担当
 */
class UIManager {
    constructor(dataManager) {
        this.dataManager = dataManager;
        this.contentArea = document.getElementById('content-area');
        this.currentSection = 'sales';
        this.saveStatusManager = new SaveStatusManager();
        this.loadingManager = new LoadingManager();
        this.toastManager = new ToastManager();
        this.performanceMonitor = new PerformanceMonitor();
        this.manualButtonManager = new ManualButtonManager();
        this.setupErrorHandling();
        
        // グローバル変数として設定
        window.loadingManager = this.loadingManager;
        window.toastManager = this.toastManager;
        window.performanceMonitor = this.performanceMonitor;
        window.manualButtonManager = this.manualButtonManager;
    }

    /**
     * 初期化
     */
    init() {
        this.setupNavigation();
        this.saveStatusManager.init();
        
        // マニュアルボタンの初期化と統合確認
        const manualInitSuccess = this.manualButtonManager.init();
        if (manualInitSuccess) {
            console.log('✓ ManualButtonManager successfully integrated with UI-Manager');
            
            // UI競合チェック（DOM読み込み完了後）
            setTimeout(() => {
                this.checkUIConflicts();
            }, 100);
        } else {
            console.warn('⚠️ ManualButtonManager initialization failed - manual button may not work properly');
        }
        
        this.showSection('sales');
    }

    /**
     * UI要素の競合チェック
     */
    checkUIConflicts() {
        const conflicts = [];
        
        // マニュアルボタンの位置確認
        const manualButton = document.getElementById('manual-button');
        if (manualButton) {
            const rect = manualButton.getBoundingClientRect();
            
            // 他のヘッダー要素との重複チェック
            const headerElements = document.querySelectorAll('header *:not(#manual-button):not(.manual-button *)');
            headerElements.forEach(element => {
                const elementRect = element.getBoundingClientRect();
                if (this.isOverlapping(rect, elementRect)) {
                    conflicts.push({
                        type: 'overlap',
                        element1: 'manual-button',
                        element2: element.tagName + (element.id ? '#' + element.id : ''),
                        severity: 'warning'
                    });
                }
            });
            
            // z-index確認
            const computedStyle = window.getComputedStyle(manualButton);
            const zIndex = parseInt(computedStyle.zIndex, 10) || 0;
            if (zIndex < 100) {
                conflicts.push({
                    type: 'z-index',
                    element: 'manual-button',
                    current: zIndex,
                    recommended: 100,
                    severity: 'info'
                });
            }
        } else {
            conflicts.push({
                type: 'missing',
                element: 'manual-button',
                severity: 'error'
            });
        }
        
        // 競合があれば報告
        if (conflicts.length > 0) {
            console.group('UI Integration Check Results:');
            conflicts.forEach(conflict => {
                const logMethod = conflict.severity === 'error' ? 'error' : 
                                conflict.severity === 'warning' ? 'warn' : 'info';
                console[logMethod](`${conflict.type}:`, conflict);
            });
            console.groupEnd();
        } else {
            console.log('✓ No UI conflicts detected for manual button');
        }
        
        return conflicts;
    }

    /**
     * 要素の重複判定
     */
    isOverlapping(rect1, rect2) {
        return !(rect1.right < rect2.left || 
                rect1.left > rect2.right || 
                rect1.bottom < rect2.top || 
                rect1.top > rect2.bottom);
    }

    /**
     * エラーハンドリングの設定
     */
    setupErrorHandling() {
        // 店舗未選択エラーの処理
        document.addEventListener('storeNotSelectedError', (event) => {
            const { category, storeCount, message } = event.detail;
            this.showStoreNotSelectedDialog(category, storeCount, message);
        });

        // 店舗自動復旧の通知
        document.addEventListener('storeAutoRecovered', (event) => {
            const { recoveredStore, reason } = event.detail;
            this.showMessage(`${reason}\n現在の店舗: ${recoveredStore.name}`, 'warning');
        });

        // データ移動時の重複確認
        document.addEventListener('dataMoveConfirmRequired', (event) => {
            const { recordId, category, targetStoreId, duplicates, warnings, record } = event.detail;
            this.showDataMoveDuplicateConfirmDialog(recordId, category, targetStoreId, duplicates, warnings, record);
        });
    }

    /**
     * 強化されたエラーメッセージ表示
     */
    showEnhancedErrorMessage(title, message, options = {}) {
        const {
            type = 'error',
            showRetry = false,
            retryAction = null,
            showDetails = false,
            details = '',
            autoClose = false,
            duration = 0
        } = options;

        const modalId = `error-modal-${Date.now()}`;
        const dialogHTML = `
            <div class="modal-overlay" id="${modalId}">
                <div class="modal-content error-dialog">
                    <div class="modal-header">
                        <h3>${this.getErrorIcon(type)} ${title}</h3>
                        <button class="close-btn" onclick="uiManager.hideErrorDialog('${modalId}')">&times;</button>
                    </div>
                    <div class="modal-body">
                        <p class="error-message">${message}</p>
                        ${showDetails && details ? `
                        <div class="error-details">
                            <h4>詳細情報:</h4>
                            <pre>${details}</pre>
                        </div>
                        ` : ''}
                        <div class="user-guidance">
                            <h4>推奨される対処法:</h4>
                            <ul>
                                <li>ページを再読み込みしてみてください</li>
                                <li>ブラウザのキャッシュをクリアしてください</li>
                                <li>問題が続く場合は、データのバックアップを取ってください</li>
                            </ul>
                        </div>
                    </div>
                    <div class="modal-footer">
                        ${showRetry ? `
                        <button class="btn btn-primary" onclick="uiManager.retryAction('${modalId}', ${retryAction ? 'true' : 'false'})">
                            再試行
                        </button>
                        ` : ''}
                        <button class="btn btn-secondary" onclick="uiManager.hideErrorDialog('${modalId}')">
                            閉じる
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', dialogHTML);

        // 再試行アクションを保存
        if (retryAction) {
            this.retryActions = this.retryActions || new Map();
            this.retryActions.set(modalId, retryAction);
        }

        // 自動クローズ
        if (autoClose && duration > 0) {
            setTimeout(() => this.hideErrorDialog(modalId), duration);
        }

        return modalId;
    }

    /**
     * エラーアイコン取得
     */
    getErrorIcon(type) {
        const icons = {
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️',
            success: '✅'
        };
        return icons[type] || '❌';
    }

    /**
     * エラーダイアログを閉じる
     */
    hideErrorDialog(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.remove();
        }
        
        // 再試行アクションをクリーンアップ
        if (this.retryActions) {
            this.retryActions.delete(modalId);
        }
    }

    /**
     * 再試行アクション実行
     */
    retryAction(modalId, hasAction) {
        if (hasAction && this.retryActions && this.retryActions.has(modalId)) {
            const action = this.retryActions.get(modalId);
            this.hideErrorDialog(modalId);
            
            try {
                action();
            } catch (error) {
                console.error('再試行アクション実行エラー:', error);
                this.showEnhancedErrorMessage(
                    '再試行エラー',
                    `再試行に失敗しました: ${error.message}`
                );
            }
        } else {
            this.hideErrorDialog(modalId);
            location.reload();
        }
    }

    /**
     * 店舗未選択ダイアログ表示（強化版）
     */
    showStoreNotSelectedDialog(category, storeCount, message) {
        const categoryNames = {
            'sales': '売上',
            'purchases': '仕入れ',
            'fixedCosts': '固定費',
            'variableCosts': '変動費',
            'laborCosts': '人件費',
            'consumptionTax': '消費税',
            'monthlyPayments': '月々の返済',
            'manufacturerDeposits': 'メーカー保証金'
        };

        const categoryName = categoryNames[category] || category;

        const dialogHTML = `
            <div class="modal-overlay" id="store-not-selected-modal">
                <div class="modal-content error-dialog">
                    <div class="modal-header">
                        <h3>⚠️ 店舗が選択されていません</h3>
                        <button class="close-btn" onclick="uiManager.hideStoreNotSelectedDialog()">&times;</button>
                    </div>
                    <div class="modal-body">
                        <p class="error-message">${categoryName}データを入力するには、まず店舗を選択する必要があります。</p>
                        <div class="error-details">
                            <p><strong>登録済み店舗数:</strong> ${storeCount}店舗</p>
                            <p><strong>操作方法:</strong></p>
                            <ol>
                                <li>画面上部のヘッダーにある店舗選択ドロップダウンをクリック</li>
                                <li>データを入力したい店舗を選択</li>
                                <li>再度データ入力を行ってください</li>
                            </ol>
                        </div>
                        ${storeCount === 0 ? `
                        <div class="no-store-warning">
                            <p><strong>店舗が登録されていません。</strong></p>
                            <p>まず店舗管理画面で店舗を登録してください。</p>
                        </div>
                        ` : ''}
                        <div class="user-guidance">
                            <h4>💡 ヒント:</h4>
                            <p>店舗を選択すると、その店舗専用のデータ入力・管理ができるようになります。</p>
                        </div>
                    </div>
                    <div class="modal-footer">
                        ${storeCount > 0 ? `
                        <button class="btn btn-primary" onclick="uiManager.focusStoreSelector()">
                            <span class="tooltip">店舗選択画面へ
                                <span class="tooltip-text">ヘッダーの店舗選択ドロップダウンにフォーカスします</span>
                            </span>
                        </button>
                        ` : `
                        <button class="btn btn-primary" onclick="uiManager.showSection('stores')">
                            店舗管理画面へ
                        </button>
                        `}
                        <button class="btn btn-secondary" onclick="uiManager.hideStoreNotSelectedDialog()">
                            閉じる
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', dialogHTML);
        
        // アクセシビリティ向上
        const modal = document.getElementById('store-not-selected-modal');
        if (modal) {
            modal.setAttribute('role', 'dialog');
            modal.setAttribute('aria-labelledby', 'store-not-selected-title');
            modal.setAttribute('aria-modal', 'true');
            
            // フォーカストラップ
            const focusableElements = modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
            if (focusableElements.length > 0) {
                focusableElements[0].focus();
            }
        }
    }

    /**
     * 店舗未選択ダイアログを閉じる
     */
    hideStoreNotSelectedDialog() {
        const modal = document.getElementById('store-not-selected-modal');
        if (modal) {
            modal.remove();
        }
    }

    /**
     * 店舗選択にフォーカス
     */
    focusStoreSelector() {
        this.hideStoreNotSelectedDialog();
        const storeSelector = document.getElementById('global-store');
        if (storeSelector) {
            storeSelector.focus();
            storeSelector.click();
            
            // ハイライト効果
            storeSelector.style.boxShadow = '0 0 10px #a03030';
            setTimeout(() => {
                storeSelector.style.boxShadow = '';
            }, 2000);
        }
    }

    /**
     * 全選択/選択解除
     */
    selectAllRecords(category) {
        const checkboxes = document.querySelectorAll(`#data-table-${category} .record-checkbox`);
        const selectAllCheckbox = document.getElementById('select-all-checkbox');
        
        checkboxes.forEach(checkbox => {
            checkbox.checked = true;
        });
        
        if (selectAllCheckbox) {
            selectAllCheckbox.checked = true;
        }
        
        this.updateSelectionCount(category);
    }

    /**
     * 選択解除
     */
    clearSelection(category) {
        const checkboxes = document.querySelectorAll(`#data-table-${category} .record-checkbox`);
        const selectAllCheckbox = document.getElementById('select-all-checkbox');
        
        checkboxes.forEach(checkbox => {
            checkbox.checked = false;
        });
        
        if (selectAllCheckbox) {
            selectAllCheckbox.checked = false;
        }
        
        this.updateSelectionCount(category);
    }

    /**
     * 全選択チェックボックス切り替え
     */
    toggleSelectAll(selectAllCheckbox, category) {
        const checkboxes = document.querySelectorAll(`#data-table-${category} .record-checkbox`);
        
        checkboxes.forEach(checkbox => {
            checkbox.checked = selectAllCheckbox.checked;
        });
        
        this.updateSelectionCount(category);
    }

    /**
     * 選択数更新
     */
    updateSelectionCount(category) {
        const checkboxes = document.querySelectorAll(`#data-table-${category} .record-checkbox:checked`);
        const count = checkboxes.length;
        
        const selectionCount = document.getElementById('selection-count');
        const moveButton = document.getElementById('move-selected-btn');
        
        if (selectionCount) {
            selectionCount.textContent = `${count}件選択中`;
        }
        
        if (moveButton) {
            moveButton.disabled = count === 0;
            moveButton.textContent = count > 0 ? `選択したデータを移動 (${count}件)` : '選択したデータを移動';
        }
        
        // 全選択チェックボックスの状態更新
        const selectAllCheckbox = document.getElementById('select-all-checkbox');
        const allCheckboxes = document.querySelectorAll(`#data-table-${category} .record-checkbox`);
        
        if (selectAllCheckbox && allCheckboxes.length > 0) {
            const checkedCount = document.querySelectorAll(`#data-table-${category} .record-checkbox:checked`).length;
            selectAllCheckbox.checked = checkedCount === allCheckboxes.length;
            selectAllCheckbox.indeterminate = checkedCount > 0 && checkedCount < allCheckboxes.length;
        }
    }

    /**
     * メッセージ表示（トースト対応版）
     */
    showMessage(message, type = 'info', duration = 3000) {
        if (this.toastManager) {
            this.toastManager.show(message, type, duration);
        } else {
            // フォールバック: 従来のメッセージ表示
            const messageDiv = document.createElement('div');
            messageDiv.className = `message ${type}-message`;
            messageDiv.textContent = message;
            
            const contentArea = document.getElementById('content-area');
            if (contentArea) {
                contentArea.insertBefore(messageDiv, contentArea.firstChild);
                
                setTimeout(() => {
                    if (messageDiv.parentNode) {
                        messageDiv.parentNode.removeChild(messageDiv);
                    }
                }, duration);
            }
        }
    }

    /**
     * ナビゲーション設定
     */
    setupNavigation() {
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = link.getAttribute('data-section');
                this.showSection(section);
                
                // アクティブリンクの更新
                navLinks.forEach(l => l.classList.remove('active'));
                link.classList.add('active');
            });
        });
    }

    /**
     * セクション表示（パフォーマンス最適化版）
     */
    showSection(section, globalYear = null, globalMonth = null) {
        // パフォーマンス測定開始
        return this.performanceMonitor.measureRenderTime(`showSection-${section}`, () => {
            this.currentSection = section;
            
            // 現在のセクションを記録
            if (window.app) {
                window.app.setCurrentSection(section);
            }
            
            // ローディング表示
            const loaderId = this.loadingManager.show(`${this.getSectionTitle(section)}を読み込み中...`);
            
            try {
                // 非同期でセクション表示を実行
                setTimeout(() => {
                    try {
                        switch(section) {
                            case 'sales':
                                this.showDataManagement('売上管理', 'sales');
                                break;
                            case 'purchases':
                                this.showDataManagement('仕入れ管理', 'purchases');
                                break;
                            case 'fixed-costs':
                                this.showDataManagement('固定費管理', 'fixedCosts');
                                break;
                            case 'variable-costs':
                                this.showVariableCostsManagement();
                                break;
                            case 'labor-costs':
                                this.showDataManagement('人件費管理', 'laborCosts');
                                break;
                            case 'consumption-tax':
                                this.showDataManagement('消費税管理', 'consumptionTax');
                                break;
                            case 'monthly-payments':
                                this.showDataManagement('月々の返済管理', 'monthlyPayments');
                                break;
                            case 'manufacturer-deposits':
                                this.showDataManagement('メーカー保証金管理', 'manufacturerDeposits');
                                break;
                            case 'reports':
                                this.showReports();
                                break;
                            case 'stores':
                                this.showStoreManagement();
                                break;
                            case 'backup':
                                this.showBackupManagement();
                                break;
                            default:
                                this.showDataManagement('売上管理', 'sales');
                        }
                        
                        // ローディング終了
                        this.loadingManager.hide(loaderId);
                        
                        // 成功通知
                        this.toastManager.show(
                            `${this.getSectionTitle(section)}を表示しました`,
                            'success',
                            2000
                        );
                        
                    } catch (error) {
                        console.error(`セクション表示エラー (${section}):`, error);
                        this.loadingManager.hide(loaderId);
                        this.showEnhancedErrorMessage(
                            'セクション表示エラー',
                            `${this.getSectionTitle(section)}の表示に失敗しました: ${error.message}`,
                            {
                                showRetry: true,
                                retryAction: () => this.showSection(section, globalYear, globalMonth)
                            }
                        );
                    }
                }, 50); // 短い遅延でUIの応答性を保つ
                
            } catch (error) {
                this.loadingManager.hide(loaderId);
                throw error;
            }
        });
    }

    /**
     * セクションタイトル取得
     */
    getSectionTitle(section) {
        const titles = {
            'sales': '売上管理',
            'purchases': '仕入れ管理',
            'fixed-costs': '固定費管理',
            'variable-costs': '変動費管理',
            'labor-costs': '人件費管理',
            'consumption-tax': '消費税管理',
            'monthly-payments': '月々の返済管理',
            'manufacturer-deposits': 'メーカー保証金管理',
            'reports': '収支レポート',
            'stores': '店舗管理',
            'backup': 'データ管理'
        };
        return titles[section] || section;
    }

    /**
     * データ管理画面表示
     */
    showDataManagement(title, category) {
        let data = this.dataManager.getDataByCategory(category);
        
        // アクティブ店舗フィルターを適用
        if (window.storeManager) {
            const activeStoreId = window.storeManager.getActiveStoreId();
            if (activeStoreId) {
                data = data.filter(record => record.storeId === activeStoreId);
            }
        }
        
        // グローバル日付フィルターを適用
        if (window.app) {
            const globalDate = window.app.getGlobalDate();
            data = data.filter(record => 
                record.year === globalDate.year && record.month === globalDate.month
            );
        }
        
        // 現在の表示年月を取得
        const globalDate = window.app ? window.app.getGlobalDate() : { year: new Date().getFullYear(), month: new Date().getMonth() + 1 };
        
        this.contentArea.innerHTML = `
            <div class="section-header">
                <h2>${title}</h2>
                <div class="section-controls">
                    <div class="current-date-display">
                        <span class="date-label">表示中:</span>
                        <span class="date-value">${globalDate.year}年${globalDate.month}月</span>
                        <span class="record-count">(${data.length}件)</span>
                    </div>
                    ${(category === 'fixedCosts' || category === 'consumptionTax' || category === 'monthlyPayments' || category === 'manufacturerDeposits') ? `<button class="btn btn-secondary" onclick="uiManager.showBatchInputForm('${category}')">一括登録</button>` : ''}
                    <button class="btn" onclick="uiManager.showInputForm('${category}')">新規追加</button>
                </div>
            </div>
            <div id="data-display">
                ${this.renderDataTable(category, data)}
            </div>
            <div id="form-container" style="display: none;">
                <!-- フォームは動的に生成 -->
            </div>
        `;
    }

    /**
     * データテーブル表示（パフォーマンス最適化版）
     */
    renderDataTable(category, data) {
        if (data.length === 0) {
            return `
                <div class="no-data-message">
                    <p>データがありません。</p>
                    <p>新規追加ボタンからデータを追加してください。</p>
                </div>
            `;
        }

        // 大量データの場合は仮想スクロールを使用
        const useVirtualScroll = data.length > 100;
        const storeCount = window.storeManager ? window.storeManager.getStoreCount() : 0;
        const showDataMove = storeCount > 1;

        // 検索・フィルター機能
        let tableHTML = `
            <div class="table-controls">
                <div class="search-controls">
                    <input type="text" class="search-input" placeholder="データを検索..." 
                           onkeyup="uiManager.filterTableData('${category}', this.value)">
                    <span class="search-results-count" id="search-results-count">
                        ${data.length}件中${data.length}件表示
                    </span>
                </div>
                ${showDataMove ? `
                <div class="data-move-controls">
                    <div class="selection-controls">
                        <button class="btn btn-secondary" onclick="uiManager.selectAllRecords('${category}')">全選択</button>
                        <button class="btn btn-secondary" onclick="uiManager.clearSelection('${category}')">選択解除</button>
                        <button class="btn btn-primary" onclick="uiManager.showDataMoveDialog('${category}')" id="move-selected-btn" disabled>
                            選択したデータを移動
                        </button>
                    </div>
                    <div class="selection-info">
                        <span id="selection-count">0件選択中</span>
                    </div>
                </div>
                ` : ''}
            </div>
        `;

        if (useVirtualScroll) {
            tableHTML += this.renderVirtualScrollTable(category, data, showDataMove);
        } else {
            tableHTML += this.renderStandardTable(category, data, showDataMove);
        }

        // パフォーマンス情報表示
        if (data.length > 50) {
            tableHTML += `
                <div class="data-compression-info">
                    データ件数: ${data.length}件 
                    ${useVirtualScroll ? '(仮想スクロール使用)' : ''}
                </div>
            `;
        }

        return tableHTML;
    }

    /**
     * 標準テーブル表示
     */
    renderStandardTable(category, data, showDataMove) {
        const headers = this.getTableHeaders(category);
        
        let tableHTML = `
            <table class="data-table" id="data-table-${category}">
                <thead>
                    <tr>
                        ${showDataMove ? '<th><input type="checkbox" id="select-all-checkbox" onchange="uiManager.toggleSelectAll(this, \'' + category + '\')"></th>' : ''}
        `;
        
        headers.forEach(header => {
            tableHTML += `<th>${header}</th>`;
        });
        tableHTML += '<th>操作</th></tr></thead><tbody id="table-body-' + category + '">';

        // データ行生成
        data.forEach(record => {
            tableHTML += this.renderTableRow(record, category, headers, showDataMove);
        });

        tableHTML += '</tbody></table>';
        return tableHTML;
    }

    /**
     * 仮想スクロールテーブル表示
     */
    renderVirtualScrollTable(category, data, showDataMove) {
        const headers = this.getTableHeaders(category);
        const itemHeight = 50; // 各行の高さ（px）
        const containerHeight = 400; // コンテナの高さ（px）
        
        return `
            <div class="virtual-scroll-container" id="virtual-scroll-${category}" 
                 style="height: ${containerHeight}px;" 
                 onscroll="uiManager.handleVirtualScroll('${category}')">
                <div class="virtual-scroll-content" id="virtual-content-${category}" 
                     style="height: ${data.length * itemHeight}px;">
                    <table class="data-table large-data-table">
                        <thead style="position: sticky; top: 0; background: white; z-index: 10;">
                            <tr>
                                ${showDataMove ? '<th><input type="checkbox" id="select-all-checkbox" onchange="uiManager.toggleSelectAll(this, \'' + category + '\')"></th>' : ''}
                                ${headers.map(header => `<th>${header}</th>`).join('')}
                                <th>操作</th>
                            </tr>
                        </thead>
                        <tbody id="virtual-table-body-${category}">
                            <!-- 仮想スクロール用の行がここに動的に生成される -->
                        </tbody>
                    </table>
                </div>
            </div>
            <script>
                // 仮想スクロールデータを保存
                window.virtualScrollData = window.virtualScrollData || {};
                window.virtualScrollData['${category}'] = ${JSON.stringify(data)};
                // 初期表示
                uiManager.updateVirtualScrollView('${category}');
            </script>
        `;
    }

    /**
     * テーブル行生成
     */
    renderTableRow(record, category, headers, showDataMove) {
        let rowHTML = '<tr>';
        
        // 複数選択チェックボックス
        if (showDataMove) {
            rowHTML += `<td><input type="checkbox" class="record-checkbox" value="${record.id}" onchange="uiManager.updateSelectionCount('${category}')"></td>`;
        }
        
        headers.forEach(header => {
            const value = this.getRecordValue(record, header);
            rowHTML += `<td title="${value}">${value}</td>`;
        });
        
        rowHTML += `
            <td>
                <button class="btn btn-secondary" onclick="uiManager.showEditForm('${category}', '${record.id}')" title="編集">編集</button>
                <button class="btn btn-danger" onclick="uiManager.deleteRecord('${category}', '${record.id}')" title="削除">削除</button>
                ${showDataMove ? `<button class="btn btn-info" onclick="uiManager.showSingleDataMoveDialog('${category}', '${record.id}')" title="移動">移動</button>` : ''}
            </td>
        `;
        rowHTML += '</tr>';
        
        return rowHTML;
    }

    /**
     * 仮想スクロール処理
     */
    handleVirtualScroll(category) {
        // スクロール位置に基づいて表示する行を更新
        this.updateVirtualScrollView(category);
    }

    /**
     * 仮想スクロールビュー更新
     */
    updateVirtualScrollView(category) {
        const container = document.getElementById(`virtual-scroll-${category}`);
        const tbody = document.getElementById(`virtual-table-body-${category}`);
        
        if (!container || !tbody || !window.virtualScrollData || !window.virtualScrollData[category]) {
            return;
        }

        const data = window.virtualScrollData[category];
        const itemHeight = 50;
        const containerHeight = container.clientHeight;
        const scrollTop = container.scrollTop;
        
        // 表示範囲を計算
        const startIndex = Math.floor(scrollTop / itemHeight);
        const endIndex = Math.min(startIndex + Math.ceil(containerHeight / itemHeight) + 5, data.length);
        
        // 表示する行を生成
        const headers = this.getTableHeaders(category);
        const storeCount = window.storeManager ? window.storeManager.getStoreCount() : 0;
        const showDataMove = storeCount > 1;
        
        let rowsHTML = '';
        for (let i = startIndex; i < endIndex; i++) {
            const record = data[i];
            if (record) {
                const rowHTML = this.renderTableRow(record, category, headers, showDataMove);
                rowsHTML += `<div class="virtual-scroll-item" style="transform: translateY(${i * itemHeight}px);">${rowHTML}</div>`;
            }
        }
        
        tbody.innerHTML = rowsHTML;
    }

    /**
     * テーブルデータフィルタリング
     */
    filterTableData(category, searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const tbody = document.getElementById(`table-body-${category}`) || 
                     document.getElementById(`virtual-table-body-${category}`);
        
        if (!tbody) return;
        
        const rows = tbody.querySelectorAll('tr');
        let visibleCount = 0;
        
        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            const isVisible = text.includes(searchLower);
            row.style.display = isVisible ? '' : 'none';
            if (isVisible) visibleCount++;
        });
        
        // 検索結果数を更新
        const resultCount = document.getElementById('search-results-count');
        if (resultCount) {
            const totalCount = rows.length;
            resultCount.textContent = `${totalCount}件中${visibleCount}件表示`;
        }
    }

    /**
     * テーブルヘッダー取得
     */
    getTableHeaders(category) {
        const commonHeaders = ['年', '月', '金額', '備考'];
        
        switch(category) {
            case 'purchases':
                return ['年', '月', '金額', 'メーカー名', '備考'];
            case 'fixedCosts':
            case 'variableCosts':
                return ['年', '月', 'カテゴリー', '金額', '備考'];

            case 'monthlyPayments':
                return ['年', '月', '金額', '返済先', '備考'];
            case 'manufacturerDeposits':
                return ['年', '月', '金額', 'メーカー名', '備考'];
            case 'consumptionTax':
                return ['年', '月', '金額', '備考'];
            default:
                return commonHeaders;
        }
    }

    /**
     * 安全な数値フォーマット
     */
    formatNumber(value) {
        if (value == null || (typeof value === 'number' && isNaN(value))) {
            return '0';
        }
        return Number(value).toLocaleString();
    }

    /**
     * レコード値取得
     */
    getRecordValue(record, header) {
        switch(header) {
            case '年': return record.year;
            case '月': return record.month;
            case '金額': return record.amount ? this.formatNumber(record.amount) + '円' : '0円';
            case '備考': return record.note || '';
            case 'カテゴリー': return record.category || '';
            case '返済先': return record.payee || '';
            case 'メーカー名': return record.manufacturer || '';
            default: return '';
        }
    }

    /**
     * 入力フォーム表示（店舗未選択エラーハンドリング強化版）
     */
    showInputForm(category) {
        // 店舗選択状態をチェック
        const storeCheckResult = this.validateStoreSelection(category);
        if (!storeCheckResult.isValid) {
            // 店舗未選択エラーダイアログを表示
            this.showStoreNotSelectedDialog(category, storeCheckResult.storeCount, storeCheckResult.message);
            return;
        }
        
        const formContainer = document.getElementById('form-container');
        const formHTML = this.generateInputForm(category);
        
        formContainer.innerHTML = formHTML;
        formContainer.style.display = 'block';
        
        // フォームイベントの設定
        this.setupFormEvents(category);
        
        // 現在の年月をデフォルト値として設定
        const currentDate = new Date();
        const yearInput = document.getElementById('year');
        const monthInput = document.getElementById('month');
        
        if (yearInput && monthInput) {
            yearInput.value = currentDate.getFullYear();
            monthInput.value = currentDate.getMonth() + 1;
        }
        
        // 店舗情報を表示
        this.displayCurrentStoreInfo();
    }

    /**
     * 店舗選択状態のバリデーション
     */
    validateStoreSelection(category) {
        const storeCount = window.storeManager ? window.storeManager.getStoreCount() : 0;
        const activeStoreId = window.storeManager ? window.storeManager.getActiveStoreId() : null;
        
        // 店舗が登録されていない場合
        if (storeCount === 0) {
            return {
                isValid: false,
                storeCount: 0,
                message: '店舗が登録されていません。まず店舗を登録してください。'
            };
        }
        
        // アクティブ店舗が選択されていない場合
        if (!activeStoreId) {
            return {
                isValid: false,
                storeCount: storeCount,
                message: '店舗が選択されていません。ヘッダーの店舗選択ドロップダウンから店舗を選択してください。'
            };
        }
        
        // アクティブ店舗が存在するかチェック
        if (window.storeManager) {
            try {
                window.storeManager.getStoreById(activeStoreId);
            } catch (error) {
                return {
                    isValid: false,
                    storeCount: storeCount,
                    message: '選択された店舗が見つかりません。店舗を再選択してください。'
                };
            }
        }
        
        return {
            isValid: true,
            storeCount: storeCount,
            activeStoreId: activeStoreId
        };
    }

    /**
     * 現在の店舗情報を表示
     */
    displayCurrentStoreInfo() {
        if (!window.storeManager) return;
        
        try {
            const activeStore = window.storeManager.getActiveStore();
            if (activeStore) {
                // フォーム内に店舗情報を表示
                const storeInfoElement = document.getElementById('current-store-info');
                if (storeInfoElement) {
                    storeInfoElement.innerHTML = `
                        <div class="current-store-display">
                            <span class="store-label">入力先店舗:</span>
                            <span class="store-name">${activeStore.name}</span>
                        </div>
                    `;
                }
            }
        } catch (error) {
            console.warn('店舗情報の表示に失敗しました:', error);
        }
    }

    /**
     * 編集フォーム表示
     */
    showEditForm(category, recordId) {
        try {
            const record = this.dataManager.getRecordById(category, recordId);
            const formContainer = document.getElementById('form-container');
            const formHTML = this.generateInputForm(category, record);
            
            formContainer.innerHTML = formHTML;
            formContainer.style.display = 'block';
            
            // フォームイベントの設定
            this.setupFormEvents(category, recordId);
            
        } catch (error) {
            this.showValidationError('編集対象のレコードが見つかりません: ' + error.message);
        }
    }

    /**
     * レコード削除
     */
    deleteRecord(category, recordId) {
        if (confirm('このレコードを削除しますか？')) {
            try {
                this.dataManager.deleteRecord(category, recordId);
                this.showSection(this.currentSection); // 画面を再描画
                this.showMessage('レコードを削除しました', 'success');
            } catch (error) {
                this.showMessage('削除に失敗しました: ' + error.message, 'error');
            }
        }
    }

    /**
     * 収支レポート表示画面
     * 月別収支の詳細表示、カテゴリー別内訳表示、年月選択フィルター機能を提供
     */
    showReports() {
        // グローバル日付を使用
        const globalDate = window.app ? window.app.getGlobalDate() : { year: new Date().getFullYear(), month: new Date().getMonth() + 1 };
        
        // 現在のアクティブ店舗情報を取得
        const activeStore = window.storeManager ? window.storeManager.getActiveStore() : null;
        const storeName = activeStore ? activeStore.name : 'すべての店舗';
        
        this.contentArea.innerHTML = `
            <div class="section-header">
                <h2>収支レポート</h2>
                <div class="report-controls">
                    <div class="report-mode-selector">
                        <label for="report-mode">表示モード:</label>
                        <select id="report-mode" onchange="uiManager.changeReportMode()">
                            <option value="single">単一店舗</option>
                            <option value="consolidated">全店舗統合</option>
                            <option value="comparison">店舗別比較</option>
                        </select>
                    </div>
                    <div class="current-date-display">
                        <span class="date-label">表示中:</span>
                        <span class="date-value">${globalDate.year}年${globalDate.month}月</span>
                        <span class="store-label">店舗:</span>
                        <span class="store-value">${storeName}</span>
                        <button class="btn btn-secondary" onclick="uiManager.showYearlyReport()">年間レポート表示</button>
                    </div>
                    <div class="export-controls">
                        <div class="export-dropdown">
                            <button class="btn btn-primary dropdown-toggle" onclick="uiManager.toggleExportDropdown()">
                                CSVエクスポート ▼
                            </button>
                            <div id="export-dropdown-menu" class="dropdown-menu" style="display: none;">
                                <button class="dropdown-item" onclick="uiManager.exportCurrentMonth()">
                                    現在の月をエクスポート
                                </button>
                                <button class="dropdown-item" onclick="uiManager.exportCurrentYear()">
                                    現在の年をエクスポート
                                </button>
                                <button class="dropdown-item" onclick="uiManager.showCustomExportDialog()">
                                    期間指定エクスポート
                                </button>
                                <button class="dropdown-item" onclick="uiManager.exportAllData()">
                                    全データエクスポート
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div id="report-content">
                <div id="monthly-report">
                    <!-- 月別レポートがここに表示される -->
                </div>
                <div id="yearly-report" style="display: none;">
                    <!-- 年間レポートがここに表示される -->
                </div>
                <div id="consolidated-report" style="display: none;">
                    <!-- 統合レポートがここに表示される -->
                </div>
                <div id="comparison-report" style="display: none;">
                    <!-- 比較レポートがここに表示される -->
                </div>
            </div>
        `;
        
        // グローバル日付でレポートを表示
        this.showMonthlyReport(globalDate.year, globalDate.month);
    }

    /**
     * レポート更新
     */
    updateReport() {
        const year = parseInt(document.getElementById('report-year').value, 10);
        const month = parseInt(document.getElementById('report-month').value, 10);
        
        if (!year || !month) {
            document.getElementById('monthly-report').innerHTML = '<p>年と月を選択してください。</p>';
            return;
        }
        
        // 年間レポートを非表示にして月別レポートを表示
        document.getElementById('yearly-report').style.display = 'none';
        document.getElementById('monthly-report').style.display = 'block';
        
        this.showMonthlyReport(year, month);
    }

    /**
     * 月別収支レポート表示
     */
    showMonthlyReport(year, month) {
        try {
            // ChartManagerを使用して収支計算
            const chartManager = new ChartManager(this.dataManager);
            const balanceData = chartManager.calculateMonthlyBalance(year, month);
            
            const reportHTML = this.generateMonthlyReportHTML(balanceData);
            document.getElementById('monthly-report').innerHTML = reportHTML;
            
            // グラフを描画（DOM要素が作成された後に実行）
            setTimeout(() => {
                chartManager.renderMonthlyChart(year, month);
            }, 100);
            
        } catch (error) {
            console.error('月別レポート生成エラー:', error);
            document.getElementById('monthly-report').innerHTML = 
                `<div class="error-message">レポートの生成に失敗しました: ${error.message}</div>`;
        }
    }

    /**
     * 月別レポートHTML生成
     */
    generateMonthlyReportHTML(balanceData) {
        const { year, month, sales, grossProfit, totalExpenses, profit, isDeficit, deficitWarning, categoryBreakdown, recordCounts } = balanceData;
        
        // 現在のアクティブ店舗情報を取得
        const activeStore = window.storeManager ? window.storeManager.getActiveStore() : null;
        const storeName = activeStore ? activeStore.name : 'すべての店舗';
        
        let html = `
            <div class="monthly-report">
                <div class="report-header">
                    <h3>${year}年${month}月の収支レポート（${storeName}）</h3>
                    <div class="report-summary ${isDeficit ? 'deficit' : 'profit'}">
                        <div class="summary-item">
                            <span class="label">売上:</span>
                            <span class="value income">${this.formatNumber(sales)}円</span>
                        </div>
                        <div class="summary-item">
                            <span class="label">粗利:</span>
                            <span class="value income">${this.formatNumber(grossProfit)}円</span>
                        </div>
                        <div class="summary-item">
                            <span class="label">支出:</span>
                            <span class="value expense">${this.formatNumber(totalExpenses)}円</span>
                        </div>
                        <div class="summary-item profit-item">
                            <span class="label">${isDeficit ? '赤字:' : '利益:'}</span>
                            <span class="value ${isDeficit ? 'deficit' : 'profit'}">${this.formatNumber(Math.abs(profit))}円</span>
                        </div>
                        ${balanceData.profitMargin !== undefined ? `
                        <div class="summary-item">
                            <span class="label">利益率:</span>
                            <span class="value">${balanceData.profitMargin.toFixed(1)}%</span>
                        </div>
                        ` : ''}
                    </div>
                </div>
        `;
        
        // 赤字警告表示
        if (deficitWarning) {
            html += `
                <div class="deficit-warning ${deficitWarning.severity}">
                    <div class="warning-header">
                        <i class="warning-icon">⚠️</i>
                        <strong>収支警告</strong>
                    </div>
                    <p class="warning-message">${deficitWarning.message}</p>
                    <div class="warning-details">
                        <p>赤字率: ${deficitWarning.deficitPercentage.toFixed(1)}%</p>
                    </div>
                    ${deficitWarning.recommendations && deficitWarning.recommendations.length > 0 ? `
                    <div class="recommendations">
                        <h4>改善提案:</h4>
                        <ul>
                            ${deficitWarning.recommendations.map(rec => `<li>${rec}</li>`).join('')}
                        </ul>
                    </div>
                    ` : ''}
                </div>
            `;
        }
        
        // カテゴリー別内訳表示
        html += `
                <div class="category-breakdown">
                    <h4>カテゴリー別内訳</h4>
                    <div class="breakdown-grid">
                        <div class="breakdown-section">
                            <h5>収入</h5>
                            <div class="breakdown-item">
                                <span class="category-name">売上</span>
                                <span class="category-amount income">${sales.toLocaleString()}円</span>
                                <span class="category-count">(${recordCounts.sales}件)</span>
                            </div>
                        </div>
                        
                        <div class="breakdown-section">
                            <h5>支出</h5>
        `;
        
        // 支出カテゴリーの詳細
        const expenseCategories = [
            { key: 'purchases', name: '仕入れ', amount: balanceData.purchases, count: recordCounts.purchases },
            { key: 'fixedCosts', name: '固定費', amount: balanceData.fixedCosts, count: recordCounts.fixedCosts },
            { key: 'variableCosts', name: '変動費', amount: balanceData.variableCosts, count: recordCounts.variableCosts },
            { key: 'laborCosts', name: '人件費', amount: balanceData.laborCosts, count: recordCounts.laborCosts },

            { key: 'consumptionTax', name: '消費税', amount: balanceData.consumptionTax, count: recordCounts.consumptionTax },
            { key: 'monthlyPayments', name: '月々の返済', amount: balanceData.monthlyPayments, count: recordCounts.monthlyPayments },
            { key: 'manufacturerDeposits', name: 'メーカー保証金', amount: balanceData.manufacturerDeposits, count: recordCounts.manufacturerDeposits }
        ];
        
        expenseCategories.forEach(category => {
            const percentage = categoryBreakdown[category.key] ? categoryBreakdown[category.key].percentage : 0;
            html += `
                            <div class="breakdown-item">
                                <span class="category-name">${category.name}</span>
                                <span class="category-amount expense">${this.formatNumber(category.amount)}円</span>
                                <span class="category-percentage">(${percentage.toFixed(1)}%)</span>
                                <span class="category-count">(${category.count}件)</span>
                            </div>
            `;
        });
        
        html += `
                        </div>
                    </div>
                </div>
        `;
        
        // グラフ表示セクション
        html += `
            <div class="charts-section">
                    <h4>グラフ表示</h4>
                    <div class="charts-container">
                        <div class="chart-item">
                            <div class="chart-wrapper">
                                <canvas id="expenseBreakdownChart" width="400" height="300"></canvas>
                            </div>
                        </div>
                        <div class="chart-item">
                            <div class="chart-wrapper">
                                <canvas id="incomeExpenseChart" width="400" height="300"></canvas>
                            </div>
                        </div>
                    </div>
                </div>
        `;
        
        const totalRecords = Object.values(recordCounts).reduce((sum, count) => sum + count, 0);
        if (totalRecords > 0) {
            html += `
                <div class="charts-section">
                    <h4>グラフ表示</h4>
                    <div class="charts-container">
                        <div class="chart-item">
                            <div class="chart-wrapper">
                                <canvas id="expenseBreakdownChart" width="400" height="300"></canvas>
                            </div>
                        </div>
                        <div class="chart-item">
                            <div class="chart-wrapper">
                                <canvas id="incomeExpenseChart" width="400" height="300"></canvas>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        } else {
            html += `
                <div class="no-data-message">
                    <p>この月のデータがありません。</p>
                    <p>各管理画面からデータを入力してください。</p>
                </div>
            `;
        }
        
        html += `
            </div>
        `;
        
        return html;
    }

    /**
     * 年間レポート表示
     */
    showYearlyReport() {
        const globalDate = window.app ? window.app.getGlobalDate() : { year: new Date().getFullYear(), month: new Date().getMonth() + 1 };
        const year = globalDate.year;
        
        if (!year) {
            alert('年を選択してください。');
            return;
        }
        
        // 月別レポートを非表示にして年間レポートを表示
        document.getElementById('monthly-report').style.display = 'none';
        document.getElementById('yearly-report').style.display = 'block';
        
        try {
            const chartManager = new ChartManager(this.dataManager);
            const yearlyData = chartManager.calculateYearlyBalance(year);
            
            const reportHTML = this.generateYearlyReportHTML(yearlyData);
            document.getElementById('yearly-report').innerHTML = reportHTML;
            
            // グラフを描画（DOM要素が作成された後に実行）
            setTimeout(() => {
                chartManager.renderYearlyChart(year);
            }, 100);
            
        } catch (error) {
            console.error('年間レポート生成エラー:', error);
            document.getElementById('yearly-report').innerHTML = 
                `<div class="error-message">年間レポートの生成に失敗しました: ${error.message}</div>`;
        }
    }

    /**
     * 年間レポートHTML生成
     */
    generateYearlyReportHTML(yearlyData) {
        const { year, totalSales, totalExpenses, totalProfit, averageMonthlyProfit, 
                deficitMonthsCount, profitableMonthsCount, monthlyResults, yearlyProfitMargin } = yearlyData;
        
        // 現在のアクティブ店舗情報を取得
        const activeStore = window.storeManager ? window.storeManager.getActiveStore() : null;
        const storeName = activeStore ? activeStore.name : 'すべての店舗';
        
        let html = `
            <div class="yearly-report">
                <div class="report-header">
                    <h3>${year}年の年間収支レポート（${storeName}）</h3>
                    <button class="btn btn-secondary" onclick="uiManager.showMonthlyReportFromYearly()">月間レポートに戻る</button>
                    <div class="yearly-summary ${totalProfit < 0 ? 'deficit' : 'profit'}">
                        <div class="summary-grid">
                            <div class="summary-item">
                                <span class="label">年間売上:</span>
                                <span class="value income">${totalSales.toLocaleString()}円</span>
                            </div>
                            <div class="summary-item">
                                <span class="label">年間支出:</span>
                                <span class="value expense">${totalExpenses.toLocaleString()}円</span>
                            </div>
                            <div class="summary-item">
                                <span class="label">年間${totalProfit < 0 ? '赤字' : '利益'}:</span>
                                <span class="value ${totalProfit < 0 ? 'deficit' : 'profit'}">${Math.abs(totalProfit).toLocaleString()}円</span>
                            </div>
                            <div class="summary-item">
                                <span class="label">月平均${totalProfit < 0 ? '赤字' : '利益'}:</span>
                                <span class="value">${Math.abs(averageMonthlyProfit).toLocaleString()}円</span>
                            </div>
                            <div class="summary-item">
                                <span class="label">利益率:</span>
                                <span class="value">${yearlyProfitMargin.toFixed(1)}%</span>
                            </div>
                            <div class="summary-item">
                                <span class="label">黒字月数:</span>
                                <span class="value profit">${profitableMonthsCount}ヶ月</span>
                            </div>
                            <div class="summary-item">
                                <span class="label">赤字月数:</span>
                                <span class="value deficit">${deficitMonthsCount}ヶ月</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="monthly-breakdown">
                    <h4>月別収支推移</h4>
                    <div class="monthly-table-container">
                        <table class="monthly-table">
                            <thead>
                                <tr>
                                    <th>月</th>
                                    <th>売上</th>
                                    <th>支出</th>
                                    <th>利益/赤字</th>
                                    <th>利益率</th>
                                    <th>状況</th>
                                </tr>
                            </thead>
                            <tbody>
        `;
        
        monthlyResults.forEach(monthData => {
            const profitClass = monthData.isDeficit ? 'deficit' : 'profit';
            const statusText = monthData.isDeficit ? '赤字' : '黒字';
            const statusClass = monthData.isDeficit ? 'status-deficit' : 'status-profit';
            
            html += `
                                <tr class="monthly-row ${profitClass}">
                                    <td>${monthData.month}月</td>
                                    <td class="amount income">${monthData.sales.toLocaleString()}円</td>
                                    <td class="amount expense">${monthData.totalExpenses.toLocaleString()}円</td>
                                    <td class="amount ${profitClass}">${Math.abs(monthData.profit).toLocaleString()}円</td>
                                    <td class="percentage">${monthData.profitMargin.toFixed(1)}%</td>
                                    <td class="status ${statusClass}">${statusText}</td>
                                </tr>
            `;
        });
        
        html += `
                            </tbody>
                        </table>
                    </div>
                </div>
                
                <div class="charts-section">
                    <h4>年間推移グラフ</h4>
                    <div class="charts-container">
                        <div class="chart-item">
                            <div class="chart-wrapper">
                                <canvas id="yearlyTrendChart" width="400" height="300"></canvas>
                            </div>
                        </div>
                        <div class="chart-item">
                            <div class="chart-wrapper">
                                <canvas id="yearlyComparisonChart" width="400" height="300"></canvas>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        return html;
    }

    /**
     * メッセージ表示
     */
    showMessage(message, type = 'info') {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}-message`;
        messageDiv.textContent = message;
        
        // メッセージを画面上部に表示
        this.contentArea.insertBefore(messageDiv, this.contentArea.firstChild);
        
        // 3秒後に自動削除
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.parentNode.removeChild(messageDiv);
            }
        }, 3000);
    }

    /**
     * バリデーションエラー表示
     */
    showValidationError(message) {
        this.showMessage(message, 'error');
    }

    /**
     * 年選択オプション生成
     */
    generateYearOptions() {
        const currentYear = new Date().getFullYear();
        const years = [];
        
        // 過去5年から未来2年まで
        for (let year = currentYear - 5; year <= currentYear + 2; year++) {
            years.push(`<option value="${year}">${year}年</option>`);
        }
        
        return years.join('');
    }

    /**
     * 月選択オプション生成
     */
    generateMonthOptions() {
        const months = [];
        for (let month = 1; month <= 12; month++) {
            months.push(`<option value="${month}">${month}月</option>`);
        }
        return months.join('');
    }



    /**
     * 入力フォーム生成
     */
    generateInputForm(category, record = null) {
        const isEdit = record !== null;
        const title = isEdit ? 'データ編集' : 'データ追加';
        const submitText = isEdit ? '更新' : '追加';
        
        let formHTML = `
            <div class="form-overlay">
                <div class="form-modal">
                    <div class="form-header">
                        <h3>${title}</h3>
                        <button type="button" class="close-btn" onclick="uiManager.hideForm()">&times;</button>
                    </div>
                    <div id="current-store-info" class="current-store-info">
                        <!-- 店舗情報がここに表示される -->
                    </div>
                    <form id="data-form" class="data-form">
                        <div class="form-errors" id="form-errors" style="display: none;"></div>
        `;

        // グローバル日付を取得（新規作成時のデフォルト値として使用）
        const globalDate = window.app ? window.app.getGlobalDate() : { year: new Date().getFullYear(), month: new Date().getMonth() + 1 };
        const defaultYear = record ? record.year : globalDate.year;
        const defaultMonth = record ? record.month : globalDate.month;
        
        // 共通フィールド（年、月、金額）
        formHTML += `
            <div class="form-group">
                <label for="year">年 <span class="required">*</span></label>
                <input type="number" id="year" name="year" min="2000" max="2100" 
                       value="${defaultYear}" required>
                <div class="field-error" id="year-error"></div>
            </div>
            
            <div class="form-group">
                <label for="month">月 <span class="required">*</span></label>
                <select id="month" name="month" required>
                    <option value="">選択してください</option>
        `;
        
        for (let month = 1; month <= 12; month++) {
            const selected = month === defaultMonth ? 'selected' : '';
            formHTML += `<option value="${month}" ${selected}>${month}月</option>`;
        }
        
        formHTML += `
                </select>
                <div class="field-error" id="month-error"></div>
            </div>
            
            <div class="form-group">
                <label for="amount">金額 <span class="required">*</span></label>
                <input type="number" id="amount" name="amount" min="0" step="1" 
                       value="${record ? record.amount : ''}" required>
                <div class="field-error" id="amount-error"></div>
            </div>
        `;

        // カテゴリー固有のフィールド
        switch(category) {
            case 'purchases':
                formHTML += `
                    <div class="form-group">
                        <label for="manufacturer">メーカー名</label>
                        <input type="text" id="manufacturer" name="manufacturer" maxlength="100" 
                               value="${record ? record.manufacturer || '' : ''}" 
                               placeholder="メーカー名を入力（任意）">
                        <div class="field-error" id="manufacturer-error"></div>
                    </div>
                `;
                break;
            case 'fixedCosts':
                formHTML += this.generateCategoryField('固定費カテゴリー', 'category', [
                    '家賃', '車両費', '車両保険料', '労働保険料', 'その他'
                ], record ? record.category : '');
                break;
            case 'variableCosts':
                formHTML += this.generateCategoryField('変動費カテゴリー', 'category', [
                    '旅費交通費', '水道光熱費', '通信費', '修繕費（車検含む）', '雑費・消耗品費'
                ], record ? record.category : '');
                break;
            case 'laborCosts':
                // 人件費は基本フィールドのみ（年、月、金額、備考）
                // 追加フィールドは不要
                break;

            case 'monthlyPayments':
                formHTML += `
                    <div class="form-group">
                        <label for="payee">返済先 <span class="required">*</span></label>
                        <input type="text" id="payee" name="payee" maxlength="100" 
                               value="${record ? record.payee : ''}" required>
                        <div class="field-error" id="payee-error"></div>
                    </div>
                `;
                break;
            case 'manufacturerDeposits':
                formHTML += `
                    <div class="form-group">
                        <label for="manufacturer">メーカー名 <span class="required">*</span></label>
                        <input type="text" id="manufacturer" name="manufacturer" maxlength="100" 
                               value="${record ? record.manufacturer : ''}" required>
                        <div class="field-error" id="manufacturer-error"></div>
                    </div>
                `;
                break;
        }

        // 備考フィールド（共通）
        formHTML += `
            <div class="form-group">
                <label for="note">備考</label>
                <textarea id="note" name="note" maxlength="200" rows="3" 
                          placeholder="備考を入力してください（200文字以内）">${record ? record.note || '' : ''}</textarea>
                <div class="field-error" id="note-error"></div>
                <div class="char-count">
                    <span id="note-count">0</span>/200文字
                </div>
            </div>
        `;

        // フォームボタン
        formHTML += `
                        <div class="form-actions">
                            <button type="button" class="btn btn-secondary" onclick="uiManager.hideForm()">キャンセル</button>
                            <button type="submit" class="btn btn-primary">${submitText}</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        return formHTML;
    }

    /**
     * カテゴリーフィールド生成
     */
    generateCategoryField(label, name, options, selectedValue = '') {
        let fieldHTML = `
            <div class="form-group">
                <label for="${name}">${label} <span class="required">*</span></label>
                <select id="${name}" name="${name}" required>
                    <option value="">選択してください</option>
        `;
        
        options.forEach(option => {
            const selected = selectedValue === option ? 'selected' : '';
            fieldHTML += `<option value="${option}" ${selected}>${option}</option>`;
        });
        
        fieldHTML += `
                </select>
                <div class="field-error" id="${name}-error"></div>
            </div>
        `;
        
        return fieldHTML;
    }

    /**
     * フォームイベント設定
     */
    setupFormEvents(category, recordId = null) {
        const form = document.getElementById('data-form');
        const noteField = document.getElementById('note');
        const noteCount = document.getElementById('note-count');

        // 備考文字数カウント
        if (noteField && noteCount) {
            const updateCharCount = () => {
                const count = noteField.value.length;
                noteCount.textContent = count;
                noteCount.parentElement.style.color = count > 200 ? '#e74c3c' : '#666';
            };
            
            noteField.addEventListener('input', updateCharCount);
            updateCharCount(); // 初期値設定
        }

        // フォーム送信イベント
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleFormSubmit(category, recordId);
        });

        // リアルタイムバリデーション
        const inputs = form.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            input.addEventListener('blur', () => {
                this.validateField(input);
            });
            
            input.addEventListener('input', () => {
                this.clearFieldError(input.name);
            });
        });
    }

    /**
     * フォーム送信処理
     */
    handleFormSubmit(category, recordId = null) {
        const form = document.getElementById('data-form');
        const formData = new FormData(form);
        
        // フォームデータをオブジェクトに変換
        const data = {};
        for (let [key, value] of formData.entries()) {
            if (key === 'year' || key === 'month' || key === 'amount') {
                data[key] = value ? Number(value) : null;
            } else {
                data[key] = value.trim();
            }
        }

        // 空の備考は削除
        if (!data.note) {
            delete data.note;
        }

        try {
            // クライアントサイドバリデーション
            const validation = this.dataManager.validateRecord(category, data);
            if (!validation.isValid) {
                this.showFormErrors(validation.errors);
                return;
            }

            // データ保存
            if (recordId) {
                // 更新
                this.dataManager.updateRecord(category, recordId, data);
                this.showMessage('データを更新しました', 'success');
            } else {
                // 新規追加
                this.dataManager.addRecord(category, data);
                this.showMessage('データを追加しました', 'success');
            }

            // フォームを閉じて画面を更新
            this.hideForm();
            this.showSection(this.currentSection);

        } catch (error) {
            this.showFormErrors([error.message]);
        }
    }

    /**
     * フィールドバリデーション
     */
    validateField(field) {
        const value = field.value.trim();
        const fieldName = field.name;
        let error = null;

        switch (fieldName) {
            case 'year':
                if (!value) {
                    error = '年は必須項目です';
                } else if (isNaN(Number(value)) || Number(value) < 2000 || Number(value) > 2100) {
                    error = '年は2000年から2100年の間で入力してください';
                }
                break;
            case 'month':
                if (!value) {
                    error = '月は必須項目です';
                } else if (isNaN(Number(value)) || Number(value) < 1 || Number(value) > 12) {
                    error = '月は1から12の間で選択してください';
                }
                break;
            case 'amount':
                if (!value) {
                    error = '金額は必須項目です';
                } else if (isNaN(Number(value)) || Number(value) < 0) {
                    error = '金額は0以上の数値で入力してください';
                } else if (Number(value) > 999999999) {
                    error = '金額は999,999,999円以下で入力してください';
                }
                break;
            case 'note':
                if (value.length > 200) {
                    error = '備考は200文字以内で入力してください';
                }
                break;
            case 'category':
            case 'payee':
            case 'manufacturer':
                if (!value) {
                    error = 'この項目は必須です';
                } else if (value.length > 100) {
                    error = '100文字以内で入力してください';
                }
                break;
        }

        if (error) {
            this.showFieldError(fieldName, error);
            return false;
        } else {
            this.clearFieldError(fieldName);
            return true;
        }
    }

    /**
     * フィールドエラー表示
     */
    showFieldError(fieldName, message) {
        const errorElement = document.getElementById(`${fieldName}-error`);
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
        }
        
        const field = document.getElementById(fieldName);
        if (field) {
            field.classList.add('error');
        }
    }

    /**
     * フィールドエラークリア
     */
    clearFieldError(fieldName) {
        const errorElement = document.getElementById(`${fieldName}-error`);
        if (errorElement) {
            errorElement.style.display = 'none';
        }
        
        const field = document.getElementById(fieldName);
        if (field) {
            field.classList.remove('error');
        }
    }

    /**
     * フォームエラー表示
     */
    showFormErrors(errors) {
        const errorContainer = document.getElementById('form-errors');
        if (errorContainer && errors.length > 0) {
            errorContainer.innerHTML = `
                <ul>
                    ${errors.map(error => `<li>${error}</li>`).join('')}
                </ul>
            `;
            errorContainer.style.display = 'block';
            
            // エラー表示位置にスクロール
            errorContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    /**
     * フォーム非表示
     */
    hideForm() {
        const formContainer = document.getElementById('form-container');
        if (formContainer) {
            formContainer.style.display = 'none';
            formContainer.innerHTML = '';
        }
    }

    /**
     * バックアップ管理画面表示
     */
    showBackupManagement() {
        // 現在のアクティブ店舗情報を取得
        const activeStore = window.storeManager ? window.storeManager.getActiveStore() : null;
        const storeName = activeStore ? activeStore.name : 'すべての店舗';
        
        this.contentArea.innerHTML = `
            <div class="section-header">
                <h2>データ管理・バックアップ</h2>
                <div class="section-controls">
                    <div class="current-store-display">
                        <span class="store-label">対象店舗:</span>
                        <span class="store-value">${storeName}</span>
                    </div>
                    <button class="btn btn-primary" onclick="uiManager.oneClickExport()">ワンクリックエクスポート</button>
                    <button class="btn btn-secondary" onclick="uiManager.showCreateBackupDialog()">詳細バックアップ作成</button>
                </div>
            </div>
            
            <!-- 簡単データ共有セクション -->
            <div id="easy-sharing-section" class="backup-section">
                <h3>簡単データ共有</h3>
                <div class="easy-sharing-controls">
                    <div class="sharing-option">
                        <h4>📤 データエクスポート</h4>
                        <p>現在の店舗データを簡単にエクスポートできます</p>
                        <div class="sharing-buttons">
                            <button class="btn btn-primary" onclick="uiManager.oneClickExport()">
                                📁 ワンクリックエクスポート
                            </button>
                            <button class="btn btn-secondary" onclick="uiManager.exportCurrentStoreOnly()">
                                🏪 現在の店舗のみエクスポート
                            </button>
                        </div>
                    </div>
                    
                    <div class="sharing-option">
                        <h4>📥 データインポート</h4>
                        <p>ファイルをドラッグ&ドロップするか、ボタンでファイルを選択してください</p>
                        <div class="drop-zone" id="file-drop-zone">
                            <div class="drop-zone-content">
                                <div class="drop-icon">📁</div>
                                <div class="drop-text">
                                    <p><strong>ファイルをここにドラッグ&ドロップ</strong></p>
                                    <p>または</p>
                                    <button class="btn btn-primary" onclick="uiManager.selectImportFile()">
                                        ファイルを選択
                                    </button>
                                </div>
                            </div>
                        </div>
                        <input type="file" id="import-file-input" accept=".json" style="display: none;">
                    </div>
                </div>
            </div>
            <div id="backup-content">
                <div class="backup-section">
                    <h3>バックアップ一覧</h3>
                    <div id="backup-list">
                        ${this.renderBackupList()}
                    </div>
                </div>
            </div>
            
            <!-- バックアップ作成ダイアログ -->
            <div id="create-backup-dialog" class="modal" style="display: none;">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>手動バックアップ作成</h3>
                        <button type="button" class="close-btn" onclick="uiManager.hideCreateBackupDialog()">&times;</button>
                    </div>
                    <div class="modal-body">
                        <form id="create-backup-form">
                            <div class="form-group">
                                <label for="backup-description">バックアップの説明（任意）:</label>
                                <input type="text" id="backup-description" name="description" 
                                       placeholder="例: 月次決算前のバックアップ" maxlength="100">
                            </div>
                            <div class="form-actions">
                                <button type="button" class="btn btn-secondary" onclick="uiManager.hideCreateBackupDialog()">キャンセル</button>
                                <button type="submit" class="btn btn-primary">バックアップ作成</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
            
            <!-- バックアップインポートダイアログ -->
            <div id="import-backup-dialog" class="modal" style="display: none;">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>バックアップファイルインポート</h3>
                        <button type="button" class="close-btn" onclick="uiManager.hideImportBackupDialog()">&times;</button>
                    </div>
                    <div class="modal-body">
                        <form id="import-backup-form">
                            <div class="form-group">
                                <label for="backup-file">バックアップファイル（JSON形式）:</label>
                                <input type="file" id="backup-file" name="file" accept=".json" required>
                                <small class="form-help">以前にエクスポートしたバックアップファイルを選択してください</small>
                            </div>
                            <div class="form-actions">
                                <button type="button" class="btn btn-secondary" onclick="uiManager.hideImportBackupDialog()">キャンセル</button>
                                <button type="submit" class="btn btn-primary">インポート</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;
        
        // フォームイベントの設定
        this.setupBackupFormEvents();
        
        // ファイルインポートの初期化
        setTimeout(() => {
            this.initializeFileImport();
        }, 100);
    }

    /**
     * バックアップリスト表示
     */
    renderBackupList() {
        try {
            const backups = this.dataManager.getAllBackups();
            
            if (backups.length === 0) {
                return '<p class="no-data">バックアップがありません。</p>';
            }
            
            let html = `
                <div class="backup-list">
                    <table class="backup-table">
                        <thead>
                            <tr>
                                <th>作成日時</th>
                                <th>種類</th>
                                <th>説明</th>
                                <th>レコード数</th>
                                <th>サイズ</th>
                                <th>操作</th>
                            </tr>
                        </thead>
                        <tbody>
            `;
            
            backups.forEach(backup => {
                const typeLabel = backup.type === 'manual' ? '手動' : 
                                backup.type === 'imported' ? 'インポート' : '自動';
                const typeClass = backup.type === 'manual' ? 'backup-manual' : 
                                backup.type === 'imported' ? 'backup-imported' : 'backup-auto';
                const sizeKB = Math.round(backup.size / 1024);
                
                html += `
                    <tr class="backup-row ${typeClass}">
                        <td class="backup-date">${backup.displayName}</td>
                        <td class="backup-type">
                            <span class="type-badge ${typeClass}">${typeLabel}</span>
                        </td>
                        <td class="backup-description">${backup.description}</td>
                        <td class="backup-count">${backup.recordCount}件</td>
                        <td class="backup-size">${sizeKB}KB</td>
                        <td class="backup-actions">
                            <button class="btn btn-sm btn-primary" 
                                    onclick="uiManager.confirmRestoreBackup('${backup.key}', '${backup.displayName}')"
                                    title="このバックアップから復元">
                                復元
                            </button>
                            <button class="btn btn-sm btn-secondary" 
                                    onclick="uiManager.exportBackup('${backup.key}')"
                                    title="バックアップファイルをダウンロード">
                                エクスポート
                            </button>
                            ${backup.type !== 'auto' ? `
                            <button class="btn btn-sm btn-danger" 
                                    onclick="uiManager.confirmDeleteBackup('${backup.key}', '${backup.displayName}')"
                                    title="このバックアップを削除">
                                削除
                            </button>
                            ` : ''}
                        </td>
                    </tr>
                `;
            });
            
            html += `
                        </tbody>
                    </table>
                </div>
            `;
            
            return html;
            
        } catch (error) {
            console.error('バックアップリスト表示エラー:', error);
            return '<div class="error-message">バックアップリストの表示に失敗しました</div>';
        }
    }

    /**
     * バックアップフォームイベント設定
     */
    setupBackupFormEvents() {
        // バックアップ作成フォーム
        const createForm = document.getElementById('create-backup-form');
        if (createForm) {
            createForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.handleCreateBackup();
            });
        }
        
        // バックアップインポートフォーム
        const importForm = document.getElementById('import-backup-form');
        if (importForm) {
            importForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.handleImportBackup();
            });
        }
    }

    /**
     * バックアップ作成ダイアログ表示
     */
    showCreateBackupDialog() {
        document.getElementById('create-backup-dialog').style.display = 'block';
        document.getElementById('backup-description').focus();
    }

    /**
     * バックアップ作成ダイアログ非表示
     */
    hideCreateBackupDialog() {
        document.getElementById('create-backup-dialog').style.display = 'none';
        document.getElementById('create-backup-form').reset();
    }

    /**
     * バックアップインポートダイアログ表示
     */
    showImportBackupDialog() {
        document.getElementById('import-backup-dialog').style.display = 'block';
    }

    /**
     * バックアップインポートダイアログ非表示
     */
    hideImportBackupDialog() {
        document.getElementById('import-backup-dialog').style.display = 'none';
        document.getElementById('import-backup-form').reset();
    }

    /**
     * バックアップ作成処理
     */
    async handleCreateBackup() {
        try {
            const description = document.getElementById('backup-description').value.trim();
            
            // ローディング表示
            this.showMessage('バックアップを作成中...', 'info');
            
            const result = await this.dataManager.createManualBackup(description);
            
            if (result.success) {
                this.showMessage('バックアップを作成しました', 'success');
                this.hideCreateBackupDialog();
                
                // バックアップリストを更新
                document.getElementById('backup-list').innerHTML = this.renderBackupList();
            }
            
        } catch (error) {
            console.error('バックアップ作成エラー:', error);
            this.showMessage('バックアップの作成に失敗しました: ' + error.message, 'error');
        }
    }

    /**
     * バックアップインポート処理
     */
    async handleImportBackup() {
        try {
            const fileInput = document.getElementById('backup-file');
            const file = fileInput.files[0];
            
            if (!file) {
                this.showMessage('ファイルを選択してください', 'error');
                return;
            }
            
            // ローディング表示
            this.showMessage('バックアップファイルをインポート中...', 'info');
            
            const result = await this.dataManager.importBackupFromFile(file);
            
            if (result.success) {
                this.showMessage(`バックアップファイルをインポートしました（${result.recordCount}件のレコード）`, 'success');
                this.hideImportBackupDialog();
                
                // バックアップリストを更新
                document.getElementById('backup-list').innerHTML = this.renderBackupList();
            }
            
        } catch (error) {
            console.error('バックアップインポートエラー:', error);
            this.showMessage('バックアップのインポートに失敗しました: ' + error.message, 'error');
        }
    }

    /**
     * バックアップ復元確認
     */
    confirmRestoreBackup(backupKey, displayName) {
        const message = `「${displayName}」のバックアップから復元しますか？\n\n現在のデータは自動的にバックアップされてから復元が実行されます。`;
        
        if (confirm(message)) {
            this.handleRestoreBackup(backupKey);
        }
    }

    /**
     * バックアップ復元処理
     */
    async handleRestoreBackup(backupKey) {
        try {
            // ローディング表示
            this.showMessage('バックアップから復元中...', 'info');
            
            const result = await this.dataManager.restoreFromBackup(backupKey);
            
            if (result.success) {
                this.showMessage(`復元が完了しました（${result.recordCount}件のレコード）`, 'success');
                
                // バックアップリストを更新
                document.getElementById('backup-list').innerHTML = this.renderBackupList();
                
                // 他の画面のデータも更新されるように通知
                setTimeout(() => {
                    this.showMessage('データが復元されました。各管理画面で最新のデータを確認してください。', 'info');
                }, 2000);
            }
            
        } catch (error) {
            console.error('バックアップ復元エラー:', error);
            this.showMessage('バックアップからの復元に失敗しました: ' + error.message, 'error');
        }
    }

    /**
     * バックアップエクスポート
     */
    async exportBackup(backupKey) {
        try {
            const result = this.dataManager.exportBackupToFile(backupKey);
            
            if (result.success) {
                this.showMessage(`バックアップファイル「${result.filename}」をダウンロードしました`, 'success');
            }
            
        } catch (error) {
            console.error('バックアップエクスポートエラー:', error);
            this.showMessage('バックアップのエクスポートに失敗しました: ' + error.message, 'error');
        }
    }

    /**
     * バックアップ削除確認
     */
    confirmDeleteBackup(backupKey, displayName) {
        const message = `「${displayName}」のバックアップを削除しますか？\n\nこの操作は取り消せません。`;
        
        if (confirm(message)) {
            this.handleDeleteBackup(backupKey);
        }
    }

    /**
     * バックアップ削除処理
     */
    async handleDeleteBackup(backupKey) {
        try {
            const result = this.dataManager.deleteBackup(backupKey);
            
            if (result.success) {
                this.showMessage('バックアップを削除しました', 'success');
                
                // バックアップリストを更新
                document.getElementById('backup-list').innerHTML = this.renderBackupList();
            }
            
        } catch (error) {
            console.error('バックアップ削除エラー:', error);
            this.showMessage('バックアップの削除に失敗しました: ' + error.message, 'error');
        }
    }

    /**
     * CSVエクスポートドロップダウンの表示切り替え
     */
    toggleExportDropdown() {
        const dropdown = document.getElementById('export-dropdown-menu');
        if (dropdown) {
            dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
        }
    }

    /**
     * 現在選択中の月のデータをCSVエクスポート
     */
    async exportCurrentMonth() {
        try {
            // グローバル日付を使用
            const globalDate = window.app ? window.app.getGlobalDate() : { year: new Date().getFullYear(), month: new Date().getMonth() + 1 };
            const activeStore = window.storeManager ? window.storeManager.getActiveStore() : null;
            const storeName = activeStore ? activeStore.name : 'AllStores';
            
            const result = this.dataManager.exportToCSV({
                exportType: 'monthly',
                year: globalDate.year,
                month: globalDate.month,
                storeName: storeName
            });
            
            this.showMessage(`${globalDate.year}年${globalDate.month}月（${activeStore ? activeStore.name : 'すべての店舗'}）のデータをCSVエクスポートしました（${result.recordCount}件）`, 'success');
            this.toggleExportDropdown(); // ドロップダウンを閉じる
            
        } catch (error) {
            console.error('月別CSVエクスポートエラー:', error);
            this.showMessage('CSVエクスポートに失敗しました: ' + error.message, 'error');
        }
    }

    /**
     * 現在選択中の年のデータをCSVエクスポート
     */
    async exportCurrentYear() {
        try {
            // グローバル日付を使用
            const globalDate = window.app ? window.app.getGlobalDate() : { year: new Date().getFullYear(), month: new Date().getMonth() + 1 };
            const activeStore = window.storeManager ? window.storeManager.getActiveStore() : null;
            const storeName = activeStore ? activeStore.name : 'AllStores';
            
            const result = this.dataManager.exportToCSV({
                exportType: 'yearly',
                year: globalDate.year,
                storeName: storeName
            });
            
            this.showMessage(`${globalDate.year}年（${activeStore ? activeStore.name : 'すべての店舗'}）のデータをCSVエクスポートしました（${result.recordCount}件）`, 'success');
            this.toggleExportDropdown(); // ドロップダウンを閉じる
            
        } catch (error) {
            console.error('年別CSVエクスポートエラー:', error);
            this.showMessage('CSVエクスポートに失敗しました: ' + error.message, 'error');
        }
    }

    /**
     * 全データをCSVエクスポート
     */
    async exportAllData() {
        try {
            const activeStore = window.storeManager ? window.storeManager.getActiveStore() : null;
            const storeText = activeStore ? `（${activeStore.name}）` : '（すべての店舗）';
            
            if (!confirm(`全データ${storeText}をCSVエクスポートしますか？データ量が多い場合、時間がかかる場合があります。`)) {
                return;
            }
            
            const storeName = activeStore ? activeStore.name : 'AllStores';
            const result = this.dataManager.exportToCSV({
                exportType: 'all',
                storeName: storeName
            });
            
            this.showMessage(`全データ${storeText}をCSVエクスポートしました（${result.recordCount}件）`, 'success');
            this.toggleExportDropdown(); // ドロップダウンを閉じる
            
        } catch (error) {
            console.error('全データCSVエクスポートエラー:', error);
            this.showMessage('CSVエクスポートに失敗しました: ' + error.message, 'error');
        }
    }

    /**
     * 期間指定エクスポートダイアログの表示
     */
    showCustomExportDialog() {
        this.toggleExportDropdown(); // ドロップダウンを閉じる
        
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();
        const currentMonth = currentDate.getMonth() + 1;
        
        this.showModal('期間指定CSVエクスポート', `
            <form id="custom-export-form" class="form">
                <div class="form-group">
                    <label>開始年月:</label>
                    <div class="date-input-group">
                        <select id="start-year" class="form-control">
                            ${this.generateYearOptions()}
                        </select>
                        <span>年</span>
                        <select id="start-month" class="form-control">
                            ${this.generateMonthOptions()}
                        </select>
                        <span>月</span>
                    </div>
                </div>
                <div class="form-group">
                    <label>終了年月:</label>
                    <div class="date-input-group">
                        <select id="end-year" class="form-control">
                            ${this.generateYearOptions()}
                        </select>
                        <span>年</span>
                        <select id="end-month" class="form-control">
                            ${this.generateMonthOptions()}
                        </select>
                        <span>月</span>
                    </div>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn btn-primary" onclick="uiManager.executeCustomExport()">
                        エクスポート実行
                    </button>
                    <button type="button" class="btn btn-secondary" onclick="uiManager.hideModal()">
                        キャンセル
                    </button>
                </div>
            </form>
        `);
        
        // デフォルト値を設定（過去1年間）
        const startYear = currentMonth === 1 ? currentYear - 1 : currentYear;
        const startMonth = currentMonth === 1 ? 1 : 1;
        
        document.getElementById('start-year').value = startYear;
        document.getElementById('start-month').value = startMonth;
        document.getElementById('end-year').value = currentYear;
        document.getElementById('end-month').value = currentMonth;
    }

    /**
     * 期間指定エクスポートの実行
     */
    async executeCustomExport() {
        try {
            const startYear = parseInt(document.getElementById('start-year').value, 10);
            const startMonth = parseInt(document.getElementById('start-month').value, 10);
            const endYear = parseInt(document.getElementById('end-year').value, 10);
            const endMonth = parseInt(document.getElementById('end-month').value, 10);
            
            // 期間の妥当性チェック
            const startDate = startYear * 100 + startMonth;
            const endDate = endYear * 100 + endMonth;
            
            if (startDate > endDate) {
                this.showMessage('開始年月は終了年月より前に設定してください', 'error');
                return;
            }
            
            const result = this.dataManager.exportToCSV({
                exportType: 'range',
                startYear: startYear,
                startMonth: startMonth,
                endYear: endYear,
                endMonth: endMonth
            });
            
            this.hideModal();
            this.showMessage(
                `${startYear}年${startMonth}月〜${endYear}年${endMonth}月のデータをCSVエクスポートしました（${result.recordCount}件）`, 
                'success'
            );
            
        } catch (error) {
            console.error('期間指定CSVエクスポートエラー:', error);
            this.showMessage('CSVエクスポートに失敗しました: ' + error.message, 'error');
        }
    }

    /**
     * 一括登録フォーム表示
     */
    showBatchInputForm(category) {
        let title = '';
        let formHTML = '';
        switch(category) {
            case 'fixedCosts':
                title = '固定費一括登録';
                formHTML = this.generateBatchInputForm(category, ['家賃', '車両費', '車両保険料', '労働保険料', 'その他']);
                break;
            case 'consumptionTax':
                title = '消費税一括登録';
                formHTML = this.generateBatchInputForm(category, ['消費税']);
                break;
            case 'monthlyPayments':
                title = '月々の返済一括登録';
                formHTML = this.generateBatchInputForm(category, [], '返済先'); // 返済先は動的に入力されるため空
                break;
            case 'manufacturerDeposits':
                title = 'メーカー保証金一括登録';
                formHTML = this.generateBatchInputForm(category, [], 'メーカー名'); // メーカー名は動的に入力されるため空
                break;
            default:
                title = '一括登録';
                formHTML = ''; // Fallback or error
        }
        this.showModal(title, formHTML);
        this.setupBatchFormEvents(category);
    }

    /**
     * 一括登録フォーム生成
     */
    generateBatchInputForm(category, categoryOptions, specificFieldLabel = null) {
        let categoryFieldHTML = '';
        if (specificFieldLabel) {
            // 特定のフィールド（返済先、メーカー名など）
            const fieldName = category === 'monthlyPayments' ? 'payee' : 'manufacturer';
            categoryFieldHTML = `
                <div class="form-group">
                    <label for="${fieldName}">${specificFieldLabel} <span class="required">*</span></label>
                    <input type="text" id="${fieldName}" name="${fieldName}" maxlength="100" required>
                    <div class="field-error" id="${fieldName}-error"></div>
                </div>
            `;
        } else if (categoryOptions && categoryOptions.length > 0) {
            // カテゴリー選択フィールド
            categoryFieldHTML = this.generateCategoryField(
                category === 'fixedCosts' ? '固定費カテゴリー' :
                category === 'consumptionTax' ? '消費税カテゴリー' :
                'カテゴリー',
                'category',
                categoryOptions
            );
        }

        return `
            <form id="batch-data-form" class="data-form">
                <div class="form-errors" id="batch-form-errors" style="display: none;"></div>
                <div class="form-group">
                    <label for="start-year">開始年月 <span class="required">*</span></label>
                    <div class="date-input-group">
                        <select id="start-year" name="startYear" required>${this.generateYearOptions()}</select>
                        <select id="start-month" name="startMonth" required>${this.generateMonthOptions()}</select>
                    </div>
                </div>
                <div class="form-group">
                    <label for="end-year">終了年月 <span class="required">*</span></label>
                    <div class="date-input-group">
                        <select id="end-year" name="endYear" required>${this.generateYearOptions()}</select>
                        <select id="end-month" name="endMonth" required>${this.generateMonthOptions()}</select>
                    </div>
                </div>
                ${categoryFieldHTML}
                <div class="form-group">
                    <label for="amount">毎月の金額 <span class="required">*</span></label>
                    <input type="number" id="amount" name="amount" min="0" step="1" required>
                </div>
                <div class="form-group">
                    <label for="note">備考</label>
                    <textarea id="note" name="note" maxlength="200" rows="3"></textarea>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="uiManager.hideModal()">キャンセル</button>
                    <button type="submit" class="btn btn-primary">登録</button>
                </div>
            </form>
        `;
    }

    /**
     * 固定費一括登録フォームイベント設定
     */
    setupBatchFormEvents(category) {
        const form = document.getElementById('batch-data-form');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleBatchFormSubmit(category);
        });
    }

    /**
     * 固定費一括登録フォーム送信処理
     */
    handleBatchFormSubmit(category) {
        const form = document.getElementById('batch-data-form');
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        const startYear = parseInt(data.startYear, 10);
        const startMonth = parseInt(data.startMonth, 10);
        const endYear = parseInt(data.endYear, 10);
        const endMonth = parseInt(data.endMonth, 10);
        const amount = parseInt(data.amount, 10);

        if (startYear * 12 + startMonth > endYear * 12 + endMonth) {
            this.showFormErrors(['開始年月は終了年月より前に設定してください'], 'batch-form-errors');
            return;
        }

        const records = [];
        for (let year = startYear; year <= endYear; year++) {
            const mStart = (year === startYear) ? startMonth : 1;
            const mEnd = (year === endYear) ? endMonth : 12;
            for (let month = mStart; month <= mEnd; month++) {
                records.push({
                    year: year,
                    month: month,
                    category: data.category,
                    amount: amount,
                    note: data.note,
                    ...(category === 'monthlyPayments' && { payee: data.payee }),
                    ...(category === 'manufacturerDeposits' && { manufacturer: data.manufacturer })
                });
            }
        }

        try {
            this.dataManager.addMultipleRecords(category, records);
            this.hideModal();
            this.showSection(this.currentSection);
            this.showMessage(`${records.length}件の固定費データを一括登録しました`, 'success');
        } catch (error) {
            this.showFormErrors([error.message], 'batch-form-errors');
        }
    }

    showModal(title, content) {
        const modal = document.createElement('div');
        modal.className = 'form-overlay';
        modal.innerHTML = `
            <div class="form-modal">
                <div class="form-header">
                    <h3>${title}</h3>
                    <button type="button" class="close-btn" onclick="uiManager.hideModal()">&times;</button>
                </div>
                <div class="modal-body">${content}</div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    hideModal() {
        const modal = document.querySelector('.form-overlay');
        if (modal) {
            modal.remove();
        }
    }

    /**
     * 変動費管理画面表示
     */
    showVariableCostsManagement() {
        const globalDate = window.app ? window.app.getGlobalDate() : { year: new Date().getFullYear(), month: new Date().getMonth() + 1 };
        const { year, month } = globalDate;

        const categories = ['旅費交通費', '水道光熱費', '通信費', '修繕費（車検含む）', '雑費・消耗品費'];
        const monthlyData = this.dataManager.getRecordsByMonth(year, month).variableCosts;

        let formHTML = `
            <div class="section-header">
                <h2>変動費管理</h2>
                <div class="section-controls">
                    <div class="current-date-display">
                        <span class="date-label">表示中:</span>
                        <span class="date-value">${year}年${month}月</span>
                    </div>
                </div>
            </div>
            <form id="variable-costs-form" class="data-form">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>カテゴリー</th>
                            <th>金額</th>
                            <th>備考</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        categories.forEach(category => {
            const record = monthlyData.find(r => r.category === category);
            formHTML += `
                <tr>
                    <td>${category}</td>
                    <td><input type="number" name="amount_${category}" value="${record ? record.amount : ''}" class="form-control form-control-lg"></td>
                    <td><input type="text" name="note_${category}" value="${record ? record.note : ''}" class="form-control"></td>
                </tr>
            `;
        });

        formHTML += `
                    </tbody>
                </table>
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">保存</button>
                </div>
            </form>
        `;

        this.contentArea.innerHTML = formHTML;
        this.setupVariableCostsFormEvents(year, month, categories);
    }

    /**
     * 変動費フォームイベント設定
     */
    setupVariableCostsFormEvents(year, month, categories) {
        const form = document.getElementById('variable-costs-form');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleVariableCostsFormSubmit(year, month, categories);
        });
    }

    /**
     * 変動費フォーム送信処理
     */
    handleVariableCostsFormSubmit(year, month, categories) {
        const form = document.getElementById('variable-costs-form');
        const formData = new FormData(form);
        const records = [];

        categories.forEach(category => {
            const amount = formData.get(`amount_${category}`);
            if (amount && amount > 0) {
                records.push({
                    year: year,
                    month: month,
                    category: category,
                    amount: parseInt(amount, 10),
                    note: formData.get(`note_${category}`)
                });
            }
        });

        try {
            this.dataManager.syncMonthlyRecords('variableCosts', year, month, records);
            this.showMessage('変動費を保存しました', 'success');
        } catch (error) {
            this.showMessage('変動費の保存に失敗しました: ' + error.message, 'error');
        }
    }

    /**
     * 年間レポートから月間レポートに表示を切り替える
     */
    showMonthlyReportFromYearly() {
        document.getElementById('yearly-report').style.display = 'none';
        document.getElementById('monthly-report').style.display = 'block';
    }

    /**
     * レポートモード変更処理
     */
    changeReportMode() {
        const reportMode = document.getElementById('report-mode').value;
        const globalDate = window.app ? window.app.getGlobalDate() : { year: new Date().getFullYear(), month: new Date().getMonth() + 1 };

        // すべてのレポートを非表示
        document.getElementById('monthly-report').style.display = 'none';
        document.getElementById('yearly-report').style.display = 'none';
        document.getElementById('consolidated-report').style.display = 'none';
        document.getElementById('comparison-report').style.display = 'none';

        switch (reportMode) {
            case 'single':
                document.getElementById('monthly-report').style.display = 'block';
                this.showMonthlyReport(globalDate.year, globalDate.month);
                break;
            case 'consolidated':
                document.getElementById('consolidated-report').style.display = 'block';
                this.showConsolidatedReport(globalDate.year, globalDate.month);
                break;
            case 'comparison':
                document.getElementById('comparison-report').style.display = 'block';
                this.showComparisonReport(globalDate.year, globalDate.month);
                break;
        }
    }

    /**
     * 統合レポート表示
     */
    showConsolidatedReport(year, month) {
        try {
            const consolidatedData = window.chartManager.calculateConsolidatedBalance(year, month);
            
            const reportHTML = this.generateConsolidatedReportHTML(consolidatedData);
            document.getElementById('consolidated-report').innerHTML = reportHTML;
            
            // グラフを描画（DOM要素が作成された後に実行）
            setTimeout(() => {
                if (window.chartManager && typeof window.chartManager.renderConsolidatedChart === 'function') {
                    window.chartManager.renderConsolidatedChart(year, month);
                }
            }, 100);
            
        } catch (error) {
            console.error('統合レポート生成エラー:', error);
            document.getElementById('consolidated-report').innerHTML = 
                `<div class="error-message">統合レポートの生成に失敗しました: ${error.message}</div>`;
        }
    }

    /**
     * 比較レポート表示
     */
    showComparisonReport(year, month) {
        try {
            const comparisonData = window.chartManager.calculateStoreComparison(year, month);
            
            const reportHTML = this.generateComparisonReportHTML(comparisonData, year, month);
            document.getElementById('comparison-report').innerHTML = reportHTML;
            
        } catch (error) {
            console.error('比較レポート生成エラー:', error);
            document.getElementById('comparison-report').innerHTML = 
                `<div class="error-message">比較レポートの生成に失敗しました: ${error.message}</div>`;
        }
    }

    /**
     * 統合レポートHTML生成
     */
    generateConsolidatedReportHTML(consolidatedData) {
        const totalIncome = consolidatedData.totalIncome || 0;
        const totalExpense = consolidatedData.totalExpense || 0;
        const balance = consolidatedData.balance || 0;
        const stores = consolidatedData.stores || [];
        const isDeficit = balance < 0;
        const profitMargin = totalIncome > 0 ? ((balance / totalIncome) * 100) : 0;
        
        // 現在の年月を取得（引数から取得できない場合は現在の日付を使用）
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1;
        
        let html = `
            <div class="consolidated-report">
                <div class="report-header">
                    <h3>${year}年${month}月の全店舗統合レポート（${stores.length}店舗）</h3>
                    <div class="report-summary ${isDeficit ? 'deficit' : 'profit'}">
                        <div class="summary-item">
                            <span class="label">統合売上:</span>
                            <span class="value income">${totalIncome.toLocaleString()}円</span>
                        </div>
                        <div class="summary-item">
                            <span class="label">統合支出:</span>
                            <span class="value expense">${totalExpense.toLocaleString()}円</span>
                        </div>
                        <div class="summary-item profit-item">
                            <span class="label">統合${isDeficit ? '赤字:' : '利益:'}</span>
                            <span class="value ${isDeficit ? 'deficit' : 'profit'}">${Math.abs(balance).toLocaleString()}円</span>
                        </div>
                        <div class="summary-item">
                            <span class="label">利益率:</span>
                            <span class="value">${profitMargin.toFixed(1)}%</span>
                        </div>
                    </div>
                </div>
                
                <div class="charts-section">
                    <h4>統合グラフ表示</h4>
                    <div class="charts-container">
                        <div class="chart-item">
                            <div class="chart-wrapper">
                                <canvas id="consolidatedExpenseChart" width="400" height="300"></canvas>
                            </div>
                        </div>
                        <div class="chart-item">
                            <div class="chart-wrapper">
                                <canvas id="consolidatedIncomeChart" width="400" height="300"></canvas>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        return html;
    }

    /**
     * 比較レポートHTML生成
     */
    generateComparisonReportHTML(comparisonData, year, month) {
        let html = `
            <div class="comparison-report">
                <div class="report-header">
                    <h3>${year}年${month}月の店舗別比較レポート</h3>
                </div>
                
                <div class="comparison-table-container">
                    <table class="comparison-table">
                        <thead>
                            <tr>
                                <th>順位</th>
                                <th>店舗名</th>
                                <th>売上</th>
                                <th>支出</th>
                                <th>利益</th>
                                <th>利益率</th>
                                <th>状況</th>
                            </tr>
                        </thead>
                        <tbody>
        `;

        if (comparisonData.length === 0) {
            html += `
                            <tr>
                                <td colspan="7" class="no-data">データがありません</td>
                            </tr>
            `;
        } else {
            comparisonData.forEach((storeData, index) => {
                const rank = index + 1;
                const rankClass = rank === 1 ? 'rank-first' : rank === 2 ? 'rank-second' : rank === 3 ? 'rank-third' : '';
                
                html += `
                            <tr class="comparison-row ${rankClass}">
                                <td class="rank">${rank}</td>
                                <td class="store-name">${storeData.store.name}</td>
                                <td class="amount income">${storeData.income.toLocaleString()}円</td>
                                <td class="amount expense">${storeData.expense.toLocaleString()}円</td>
                                <td class="amount ${storeData.balance < 0 ? 'deficit' : 'profit'}">${Math.abs(storeData.balance).toLocaleString()}円</td>
                                <td class="percentage">${storeData.profitMargin.toFixed(1)}%</td>
                                <td class="status">
                                    <span class="status-badge ${storeData.balance < 0 ? 'status-deficit' : 'status-profit'}">
                                        ${storeData.balance < 0 ? '赤字' : '黒字'}
                                    </span>
                                </td>
                            </tr>
                `;
            });
        }

        html += `
                        </tbody>
                    </table>
                </div>
            </div>
        `;
        
        return html;
    }

    /**
     * 店舗管理画面表示
     */
    showStoreManagement() {
        if (!window.storeManager) {
            this.contentArea.innerHTML = '<div class="error-message">店舗管理機能が利用できません。</div>';
            return;
        }

        const stores = window.storeManager.getStores();
        const activeStore = window.storeManager.getActiveStore();

        this.contentArea.innerHTML = `
            <div class="section-header">
                <h2>店舗管理</h2>
                <div class="section-controls">
                    <button class="btn btn-secondary" onclick="uiManager.showDataMoveHistory()">
                        📋 データ移動履歴
                    </button>
                    <div class="current-store-display">
                        <span class="store-label">アクティブ店舗:</span>
                        <span class="store-value">${activeStore ? activeStore.name : 'なし'}</span>
                        <span class="store-count">(${stores.length}店舗)</span>
                    </div>
                    <button class="btn" onclick="uiManager.showStoreForm()">新規店舗追加</button>
                </div>
            </div>
            <div id="store-display">
                ${this.renderStoreTable(stores)}
            </div>
            <div id="store-form-container" style="display: none;">
                <!-- 店舗フォームは動的に生成 -->
            </div>
        `;
    }

    /**
     * 店舗テーブル表示
     */
    renderStoreTable(stores) {
        if (stores.length === 0) {
            return '<p>店舗がありません。新規店舗追加ボタンから店舗を追加してください。</p>';
        }

        let tableHTML = '<table class="data-table"><thead><tr>';
        tableHTML += '<th>店舗名</th><th>住所</th><th>開店日</th><th>備考</th><th>状態</th><th>操作</th>';
        tableHTML += '</tr></thead><tbody>';

        const activeStoreId = window.storeManager.getActiveStoreId();

        stores.forEach(store => {
            const isActive = store.id === activeStoreId;
            tableHTML += `<tr ${isActive ? 'class="active-store"' : ''}>`;
            tableHTML += `<td><strong>${store.name}</strong></td>`;
            tableHTML += `<td>${store.address || '-'}</td>`;
            tableHTML += `<td>${store.openDate || '-'}</td>`;
            tableHTML += `<td>${store.note || '-'}</td>`;
            tableHTML += `<td>${isActive ? '<span class="status-active">アクティブ</span>' : '<span class="status-inactive">非アクティブ</span>'}</td>`;
            tableHTML += `<td>`;
            if (!isActive) {
                tableHTML += `<button class="btn btn-secondary" onclick="uiManager.setActiveStore('${store.id}')">アクティブにする</button> `;
            }
            tableHTML += `<button class="btn btn-secondary" onclick="uiManager.showStoreEditForm('${store.id}')">編集</button> `;
            if (stores.length > 1) {
                tableHTML += `<button class="btn btn-danger" onclick="uiManager.deleteStore('${store.id}')">削除</button>`;
            }
            tableHTML += `</td>`;
            tableHTML += '</tr>';
        });

        tableHTML += '</tbody></table>';
        return tableHTML;
    }

    /**
     * 店舗フォーム表示
     */
    showStoreForm(storeData = null) {
        const isEdit = storeData !== null;
        const formTitle = isEdit ? '店舗編集' : '新規店舗追加';
        
        const formContainer = document.getElementById('store-form-container');
        formContainer.innerHTML = `
            <div class="form-overlay">
                <div class="form-modal">
                    <div class="form-header">
                        <h3>${formTitle}</h3>
                        <button class="close-btn" onclick="uiManager.hideStoreForm()">&times;</button>
                    </div>
                    <form class="data-form" id="store-form">
                        <div class="form-group">
                            <label for="store-name">店舗名 <span class="required">*</span></label>
                            <input type="text" id="store-name" name="name" value="${storeData ? storeData.name : ''}" required>
                        </div>
                        <div class="form-group">
                            <label for="store-address">住所</label>
                            <input type="text" id="store-address" name="address" value="${storeData ? storeData.address : ''}">
                        </div>
                        <div class="form-group">
                            <label for="store-openDate">開店日</label>
                            <input type="date" id="store-openDate" name="openDate" value="${storeData ? storeData.openDate : ''}">
                        </div>
                        <div class="form-group">
                            <label for="store-note">備考</label>
                            <textarea id="store-note" name="note">${storeData ? storeData.note : ''}</textarea>
                        </div>
                        <div class="form-actions">
                            <button type="button" class="btn btn-secondary" onclick="uiManager.hideStoreForm()">キャンセル</button>
                            <button type="submit" class="btn btn-primary">${isEdit ? '更新' : '追加'}</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        
        formContainer.style.display = 'block';
        
        // フォーム送信イベント
        document.getElementById('store-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleStoreFormSubmit(isEdit ? storeData.id : null);
        });
    }

    /**
     * 店舗編集フォーム表示
     */
    showStoreEditForm(storeId) {
        try {
            const store = window.storeManager.getStoreById(storeId);
            this.showStoreForm(store);
        } catch (error) {
            this.showMessage('店舗情報の取得に失敗しました: ' + error.message, 'error');
        }
    }

    /**
     * 店舗フォーム非表示
     */
    hideStoreForm() {
        const formContainer = document.getElementById('store-form-container');
        formContainer.style.display = 'none';
        formContainer.innerHTML = '';
    }

    /**
     * 店舗フォーム送信処理
     */
    handleStoreFormSubmit(storeId = null) {
        try {
            const formData = new FormData(document.getElementById('store-form'));
            const storeData = {
                name: formData.get('name'),
                address: formData.get('address'),
                openDate: formData.get('openDate'),
                note: formData.get('note')
            };

            if (storeId) {
                // 更新
                window.storeManager.updateStore(storeId, storeData);
                this.showMessage('店舗情報を更新しました', 'success');
            } else {
                // 新規追加
                window.storeManager.addStore(storeData);
                this.showMessage('新しい店舗を追加しました', 'success');
            }

            this.hideStoreForm();
            this.showStoreManagement(); // 画面を再描画
            
            // グローバル店舗選択も更新
            if (window.app) {
                window.app.initGlobalStoreSelector();
            }

        } catch (error) {
            this.showMessage('店舗の保存に失敗しました: ' + error.message, 'error');
        }
    }

    /**
     * アクティブ店舗設定
     */
    setActiveStore(storeId) {
        try {
            window.storeManager.setActiveStore(storeId);
            this.showMessage('アクティブ店舗を変更しました', 'success');
            this.showStoreManagement(); // 画面を再描画
            
            // グローバル店舗選択も更新
            if (window.app) {
                window.app.initGlobalStoreSelector();
            }
        } catch (error) {
            this.showMessage('アクティブ店舗の変更に失敗しました: ' + error.message, 'error');
        }
    }

    /**
     * 店舗削除
     */
    deleteStore(storeId) {
        try {
            const store = window.storeManager.getStoreById(storeId);
            if (confirm(`店舗「${store.name}」を削除しますか？\n\n注意: この店舗に関連するデータも削除される可能性があります。`)) {
                window.storeManager.deleteStore(storeId);
                this.showMessage('店舗を削除しました', 'success');
                this.showStoreManagement(); // 画面を再描画
                
                // グローバル店舗選択も更新
                if (window.app) {
                    window.app.initGlobalStoreSelector();
                }
            }
        } catch (error) {
            this.showMessage('店舗の削除に失敗しました: ' + error.message, 'error');
        }
    }

    /**
     * ワンクリックエクスポート機能
     */
    oneClickExport() {
        try {
            const activeStore = window.storeManager ? window.storeManager.getActiveStore() : null;
            const storeName = activeStore ? activeStore.name : 'AllStores';
            const currentDate = new Date();
            const dateString = currentDate.toISOString().split('T')[0]; // YYYY-MM-DD形式
            
            // 自動ファイル名生成
            const filename = `kaikei-${dateString}-${storeName}`;
            
            const result = this.dataManager.exportToFile(filename);
            
            if (result.success) {
                this.showMessage(`データを「${result.filename}」としてエクスポートしました`, 'success');
            } else {
                throw new Error('エクスポートに失敗しました');
            }
            
        } catch (error) {
            console.error('ワンクリックエクスポートエラー:', error);
            this.showMessage('エクスポートに失敗しました: ' + error.message, 'error');
        }
    }

    /**
     * 現在の店舗のみエクスポート
     */
    exportCurrentStoreOnly() {
        try {
            const activeStore = window.storeManager ? window.storeManager.getActiveStore() : null;
            
            if (!activeStore) {
                this.showMessage('店舗が選択されていません', 'error');
                return;
            }
            
            const storeData = this.dataManager.getDataByStore(activeStore.id);
            const currentDate = new Date();
            const dateString = currentDate.toISOString().split('T')[0];
            
            // 店舗情報も含めてエクスポート
            const exportData = {
                store: activeStore,
                data: storeData,
                exportInfo: {
                    exportDate: new Date().toISOString(),
                    exportType: 'single-store',
                    storeName: activeStore.name,
                    version: '1.0'
                }
            };
            
            const jsonData = JSON.stringify(exportData, null, 2);
            const blob = new Blob([jsonData], { type: 'application/json' });
            
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `kaikei-${dateString}-${activeStore.name}-only.json`;
            
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            
            URL.revokeObjectURL(url);
            
            this.showMessage(`店舗「${activeStore.name}」のデータをエクスポートしました`, 'success');
            
        } catch (error) {
            console.error('店舗別エクスポートエラー:', error);
            this.showMessage('エクスポートに失敗しました: ' + error.message, 'error');
        }
    }

    /**
     * ファイル選択ダイアログを開く
     */
    selectImportFile() {
        const fileInput = document.getElementById('import-file-input');
        fileInput.click();
    }

    /**
     * ドラッグ&ドロップとファイル選択の初期化
     */
    initializeFileImport() {
        const dropZone = document.getElementById('file-drop-zone');
        const fileInput = document.getElementById('import-file-input');
        
        if (!dropZone || !fileInput) return;

        // ドラッグ&ドロップイベント
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('drag-over');
        });

        dropZone.addEventListener('dragleave', (e) => {
            e.preventDefault();
            dropZone.classList.remove('drag-over');
        });

        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('drag-over');
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.handleImportFile(files[0]);
            }
        });

        // ファイル選択イベント
        fileInput.addEventListener('change', (e) => {
            const files = e.target.files;
            if (files.length > 0) {
                this.handleImportFile(files[0]);
            }
        });
    }

    /**
     * インポートファイル処理
     */
    async handleImportFile(file) {
        try {
            if (!file.name.endsWith('.json')) {
                this.showMessage('JSONファイルを選択してください', 'error');
                return;
            }

            this.showMessage('ファイルを読み込み中...', 'info');

            const fileContent = await this.readFileAsText(file);
            const importData = JSON.parse(fileContent);

            // データ形式の判定
            if (importData.exportInfo && importData.exportInfo.exportType === 'single-store') {
                // 単一店舗データのインポート
                await this.importSingleStoreData(importData);
            } else {
                // 全データのインポート
                await this.importAllData(importData);
            }

        } catch (error) {
            console.error('ファイルインポートエラー:', error);
            this.showMessage('ファイルのインポートに失敗しました: ' + error.message, 'error');
        }
    }

    /**
     * ファイルをテキストとして読み込み
     */
    readFileAsText(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(new Error('ファイルの読み込みに失敗しました'));
            reader.readAsText(file);
        });
    }

    /**
     * 単一店舗データのインポート
     */
    async importSingleStoreData(importData) {
        try {
            const { store, data, exportInfo } = importData;
            
            if (!store || !data) {
                throw new Error('無効な店舗データファイルです');
            }

            const confirmMessage = `店舗「${store.name}」のデータをインポートしますか？\n\n` +
                                 `エクスポート日時: ${new Date(exportInfo.exportDate).toLocaleString()}\n` +
                                 `既存の同名店舗がある場合は上書きされます。`;

            if (!confirm(confirmMessage)) {
                return;
            }

            // 店舗が存在するかチェック
            let existingStore = null;
            try {
                const stores = window.storeManager.getStores();
                existingStore = stores.find(s => s.name === store.name);
            } catch (error) {
                // 店舗が見つからない場合は新規作成
            }

            let targetStoreId;
            if (existingStore) {
                // 既存店舗を更新
                window.storeManager.updateStore(existingStore.id, {
                    name: store.name,
                    address: store.address,
                    openDate: store.openDate,
                    note: store.note
                });
                targetStoreId = existingStore.id;
            } else {
                // 新規店舗を作成
                const newStore = window.storeManager.addStore({
                    name: store.name,
                    address: store.address || '',
                    openDate: store.openDate || '',
                    note: store.note || ''
                });
                targetStoreId = newStore.id;
            }

            // データをインポート
            let importedCount = 0;
            for (const category in data) {
                if (Array.isArray(data[category])) {
                    for (const record of data[category]) {
                        // storeIdを新しい店舗IDに更新
                        record.storeId = targetStoreId;
                        record.importedAt = new Date().toISOString();
                        
                        this.dataManager.addRecord(category, record, targetStoreId);
                        importedCount++;
                    }
                }
            }

            this.showMessage(`店舗「${store.name}」のデータを正常にインポートしました（${importedCount}件）`, 'success');
            
            // グローバル店舗選択を更新
            if (window.app) {
                window.app.initGlobalStoreSelector();
            }

        } catch (error) {
            console.error('単一店舗データインポートエラー:', error);
            throw error;
        }
    }

    /**
     * 全データのインポート
     */
    async importAllData(importData) {
        try {
            const confirmMessage = 'すべてのデータをインポートしますか？\n\n' +
                                 '既存のデータは上書きされる可能性があります。\n' +
                                 'バックアップを取ることをお勧めします。';

            if (!confirm(confirmMessage)) {
                return;
            }

            // DataManagerのインポート機能を使用
            const result = await this.dataManager.importFromFile(new Blob([JSON.stringify(importData)], { type: 'application/json' }));
            
            if (result.success) {
                this.showMessage(result.message + `（${result.recordCount}件）`, 'success');
                
                // 画面を再読み込みして最新データを表示
                if (window.app) {
                    window.location.reload();
                }
            } else {
                throw new Error('インポートに失敗しました');
            }

        } catch (error) {
            console.error('全データインポートエラー:', error);
            throw error;
        }
    }

    /**
     * 全選択機能
     */
    selectAllRecords(category) {
        const checkboxes = document.querySelectorAll(`#data-table-${category} .record-checkbox`);
        const selectAllCheckbox = document.getElementById('select-all-checkbox');
        
        checkboxes.forEach(checkbox => {
            checkbox.checked = true;
        });
        
        if (selectAllCheckbox) {
            selectAllCheckbox.checked = true;
        }
        
        this.updateSelectionCount(category);
    }

    /**
     * 選択解除機能
     */
    clearSelection(category) {
        const checkboxes = document.querySelectorAll(`#data-table-${category} .record-checkbox`);
        const selectAllCheckbox = document.getElementById('select-all-checkbox');
        
        checkboxes.forEach(checkbox => {
            checkbox.checked = false;
        });
        
        if (selectAllCheckbox) {
            selectAllCheckbox.checked = false;
        }
        
        this.updateSelectionCount(category);
    }

    /**
     * 全選択チェックボックスの切り替え
     */
    toggleSelectAll(selectAllCheckbox, category) {
        const checkboxes = document.querySelectorAll(`#data-table-${category} .record-checkbox`);
        
        checkboxes.forEach(checkbox => {
            checkbox.checked = selectAllCheckbox.checked;
        });
        
        this.updateSelectionCount(category);
    }

    /**
     * 選択数の更新
     */
    updateSelectionCount(category) {
        const checkboxes = document.querySelectorAll(`#data-table-${category} .record-checkbox:checked`);
        const count = checkboxes.length;
        
        const selectionCountElement = document.getElementById('selection-count');
        const moveButton = document.getElementById('move-selected-btn');
        
        if (selectionCountElement) {
            selectionCountElement.textContent = `${count}件選択中`;
        }
        
        if (moveButton) {
            moveButton.disabled = count === 0;
        }
        
        // 全選択チェックボックスの状態更新
        const selectAllCheckbox = document.getElementById('select-all-checkbox');
        const allCheckboxes = document.querySelectorAll(`#data-table-${category} .record-checkbox`);
        
        if (selectAllCheckbox && allCheckboxes.length > 0) {
            selectAllCheckbox.checked = checkboxes.length === allCheckboxes.length;
            selectAllCheckbox.indeterminate = checkboxes.length > 0 && checkboxes.length < allCheckboxes.length;
        }
    }

    /**
     * データ移動ダイアログ表示（複数選択）
     */
    showDataMoveDialog(category) {
        const selectedCheckboxes = document.querySelectorAll(`#data-table-${category} .record-checkbox:checked`);
        const selectedIds = Array.from(selectedCheckboxes).map(cb => cb.value);
        
        if (selectedIds.length === 0) {
            this.showMessage('移動するデータを選択してください', 'error');
            return;
        }
        
        this.showDataMoveDialogInternal(category, selectedIds);
    }

    /**
     * 単一データ移動ダイアログ表示
     */
    showSingleDataMoveDialog(category, recordId) {
        this.showDataMoveDialogInternal(category, [recordId]);
    }

    /**
     * データ移動ダイアログ表示（内部処理）
     */
    showDataMoveDialogInternal(category, recordIds) {
        if (!window.storeManager) {
            this.showMessage('店舗管理機能が利用できません', 'error');
            return;
        }

        const stores = window.storeManager.getStores();
        const currentStoreId = window.storeManager.getActiveStoreId();
        
        // 移動先店舗のオプション生成
        let storeOptions = '';
        stores.forEach(store => {
            if (store.id !== currentStoreId) {
                storeOptions += `<option value="${store.id}">${store.name}</option>`;
            }
        });
        
        if (!storeOptions) {
            this.showMessage('移動先の店舗がありません', 'error');
            return;
        }

        // ダイアログHTML生成
        const dialogHTML = `
            <div class="modal" id="data-move-modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>データ移動</h3>
                        <button type="button" class="close-btn" onclick="uiManager.hideDataMoveDialog()">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="move-info">
                            <p><strong>移動対象:</strong> ${recordIds.length}件のデータ</p>
                            <p><strong>現在の店舗:</strong> ${window.storeManager.getActiveStore()?.name || '不明'}</p>
                        </div>
                        <form id="data-move-form">
                            <div class="form-group">
                                <label for="target-store">移動先店舗:</label>
                                <select id="target-store" name="targetStore" required>
                                    <option value="">移動先を選択してください</option>
                                    ${storeOptions}
                                </select>
                            </div>
                            <div class="form-group">
                                <label for="move-reason">移動理由（任意）:</label>
                                <textarea id="move-reason" name="reason" placeholder="例: 誤って別店舗で入力したため" maxlength="200"></textarea>
                            </div>
                            <div class="form-actions">
                                <button type="button" class="btn btn-secondary" onclick="uiManager.hideDataMoveDialog()">キャンセル</button>
                                <button type="submit" class="btn btn-primary">移動実行</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;

        // ダイアログを表示
        document.body.insertAdjacentHTML('beforeend', dialogHTML);
        
        // フォーム送信イベント
        document.getElementById('data-move-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.executeDataMove(category, recordIds);
        });
    }

    /**
     * データ移動ダイアログを閉じる
     */
    hideDataMoveDialog() {
        const modal = document.getElementById('data-move-modal');
        if (modal) {
            modal.remove();
        }
    }

    /**
     * データ移動実行（重複チェック強化版）
     */
    async executeDataMove(category, recordIds) {
        try {
            const targetStoreId = document.getElementById('target-store').value;
            const reason = document.getElementById('move-reason').value;
            
            if (!targetStoreId) {
                this.showMessage('移動先店舗を選択してください', 'error');
                return;
            }

            const targetStore = window.storeManager.getStoreById(targetStoreId);
            
            // データ移動実行
            let movedCount = 0;
            let duplicateCount = 0;
            const errors = [];
            
            for (const recordId of recordIds) {
                try {
                    await this.dataManager.moveRecordToStore(category, recordId, targetStoreId);
                    movedCount++;
                } catch (error) {
                    if (error.message === 'DUPLICATE_CONFIRMATION_REQUIRED') {
                        // 重複確認が必要な場合は、この関数を一時停止して確認ダイアログを待つ
                        return;
                    } else {
                        console.error('データ移動エラー:', error);
                        errors.push(`レコード ${recordId}: ${error.message}`);
                    }
                }
            }

            // 移動履歴を記録
            this.recordDataMoveHistory(category, recordIds, targetStoreId, reason, movedCount, errors);

            // 結果表示
            if (movedCount > 0) {
                let successMessage = `${movedCount}件のデータを「${targetStore.name}」に移動しました`;
                if (duplicateCount > 0) {
                    successMessage += `\n\n注意: ${duplicateCount}件で重複データが検出されました。`;
                }
                this.showMessage(successMessage, 'success');
                
                // 画面を再描画
                this.showSection(this.currentSection);
            }
            
            if (errors.length > 0) {
                console.error('データ移動エラー:', errors);
                this.showMessage(`${errors.length}件の移動に失敗しました`, 'error');
            }

            this.hideDataMoveDialog();

        } catch (error) {
            console.error('データ移動実行エラー:', error);
            this.showMessage('データ移動に失敗しました: ' + error.message, 'error');
        }
    }

    /**
     * データ移動時の重複確認ダイアログ表示
     */
    showDataMoveDuplicateConfirmDialog(recordId, category, targetStoreId, duplicates, warnings, record) {
        const targetStore = window.storeManager.getStoreById(targetStoreId);
        
        const dialogHTML = `
            <div class="modal-overlay" id="duplicate-confirm-modal">
                <div class="modal-content duplicate-dialog">
                    <div class="modal-header">
                        <h3>⚠️ 重複データの確認</h3>
                    </div>
                    <div class="modal-body">
                        <div class="duplicate-warning">
                            <p><strong>移動先店舗「${targetStore.name}」に類似データが見つかりました。</strong></p>
                            <p>移動を続行しますか？</p>
                        </div>
                        
                        <div class="record-info">
                            <h4>移動対象データ:</h4>
                            <div class="record-details">
                                <p>年月: ${record.year}年${record.month}月</p>
                                <p>金額: ${record.amount.toLocaleString()}円</p>
                                ${record.category ? `<p>カテゴリー: ${record.category}</p>` : ''}
                                ${record.note ? `<p>備考: ${record.note}</p>` : ''}
                            </div>
                        </div>
                        
                        ${duplicates.length > 0 ? `
                        <div class="duplicates-section">
                            <h4>重複データ (${duplicates.length}件):</h4>
                            <div class="duplicates-list">
                                ${duplicates.map(dup => `
                                    <div class="duplicate-item ${dup.type}">
                                        <span class="duplicate-type">[${dup.type === 'exact' ? '完全一致' : '類似'}]</span>
                                        <span class="duplicate-details">
                                            ${dup.record.year}年${dup.record.month}月 - ${dup.record.amount.toLocaleString()}円
                                            ${dup.record.note ? ` (${dup.record.note})` : ''}
                                        </span>
                                        <span class="duplicate-message">${dup.message}</span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                        ` : ''}
                        
                        ${warnings.length > 0 ? `
                        <div class="warnings-section">
                            <h4>警告 (${warnings.length}件):</h4>
                            <div class="warnings-list">
                                ${warnings.map(warning => `
                                    <div class="warning-item">
                                        <span class="warning-message">${warning.message}</span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                        ` : ''}
                        
                        <div class="confirmation-options">
                            <label>
                                <input type="checkbox" id="skip-future-duplicates"> 
                                今後の重複チェックをスキップ（このセッション中のみ）
                            </label>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-primary" onclick="uiManager.confirmDataMoveWithDuplicates('${recordId}', '${category}', '${targetStoreId}')">
                            移動を続行
                        </button>
                        <button class="btn btn-secondary" onclick="uiManager.hideDuplicateConfirmDialog()">
                            キャンセル
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', dialogHTML);
    }

    /**
     * 重複確認後のデータ移動実行
     */
    async confirmDataMoveWithDuplicates(recordId, category, targetStoreId) {
        try {
            const skipFutureDuplicates = document.getElementById('skip-future-duplicates').checked;
            
            // 重複チェックをスキップしてデータ移動を実行
            await this.dataManager.moveRecordToStore(category, recordId, targetStoreId, true);
            
            this.hideDuplicateConfirmDialog();
            
            const targetStore = window.storeManager.getStoreById(targetStoreId);
            this.showMessage(`データを「${targetStore.name}」に移動しました`, 'success');
            
            // 画面を更新
            this.showSection(this.currentSection);
            
        } catch (error) {
            console.error('重複確認後のデータ移動エラー:', error);
            this.showMessage('データ移動に失敗しました: ' + error.message, 'error');
        }
    }

    /**
     * 重複確認ダイアログを閉じる
     */
    hideDuplicateConfirmDialog() {
        const modal = document.getElementById('duplicate-confirm-modal');
        if (modal) {
            modal.remove();
        }
    }

    /**
     * データ移動履歴の記録
     */
    recordDataMoveHistory(category, recordIds, targetStoreId, reason, movedCount, errors) {
        try {
            const currentStore = window.storeManager.getActiveStore();
            const targetStore = window.storeManager.getStoreById(targetStoreId);
            
            const historyRecord = {
                id: this.dataManager.generateUUID(),
                timestamp: new Date().toISOString(),
                category: category,
                recordIds: recordIds,
                fromStoreId: currentStore?.id,
                fromStoreName: currentStore?.name,
                toStoreId: targetStoreId,
                toStoreName: targetStore.name,
                reason: reason || '',
                movedCount: movedCount,
                totalCount: recordIds.length,
                errors: errors
            };

            // ローカルストレージに履歴を保存
            const historyKey = 'kaikei-data-move-history';
            const existingHistory = JSON.parse(localStorage.getItem(historyKey) || '[]');
            existingHistory.push(historyRecord);
            
            // 最新100件のみ保持
            if (existingHistory.length > 100) {
                existingHistory.splice(0, existingHistory.length - 100);
            }
            
            localStorage.setItem(historyKey, JSON.stringify(existingHistory));
            
            console.log('データ移動履歴を記録しました:', historyRecord);

        } catch (error) {
            console.error('移動履歴の記録に失敗しました:', error);
        }
    }

    /**
     * データ移動履歴表示
     */
    showDataMoveHistory() {
        try {
            const historyKey = 'kaikei-data-move-history';
            const history = JSON.parse(localStorage.getItem(historyKey) || '[]');
            
            if (history.length === 0) {
                this.showMessage('データ移動履歴がありません', 'info');
                return;
            }

            let historyHTML = `
                <div class="modal" id="move-history-modal">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h3>データ移動履歴</h3>
                            <button type="button" class="close-btn" onclick="uiManager.hideMoveHistoryDialog()">&times;</button>
                        </div>
                        <div class="modal-body">
                            <div class="history-list">
                                <table class="data-table">
                                    <thead>
                                        <tr>
                                            <th>日時</th>
                                            <th>カテゴリー</th>
                                            <th>移動元</th>
                                            <th>移動先</th>
                                            <th>件数</th>
                                            <th>理由</th>
                                        </tr>
                                    </thead>
                                    <tbody>
            `;

            history.reverse().forEach(record => {
                const timestamp = new Date(record.timestamp).toLocaleString('ja-JP');
                const categoryName = this.getCategoryDisplayName(record.category);
                const status = record.movedCount === record.totalCount ? '成功' : 
                              record.movedCount > 0 ? '部分成功' : '失敗';
                const statusClass = record.movedCount === record.totalCount ? 'success' : 
                                   record.movedCount > 0 ? 'warning' : 'error';

                historyHTML += `
                    <tr>
                        <td>${timestamp}</td>
                        <td>${categoryName}</td>
                        <td>${record.fromStoreName || '不明'}</td>
                        <td>${record.toStoreName}</td>
                        <td>
                            <span class="status-${statusClass}">
                                ${record.movedCount}/${record.totalCount}件 (${status})
                            </span>
                        </td>
                        <td>${record.reason || '-'}</td>
                    </tr>
                `;
            });

            historyHTML += `
                                    </tbody>
                                </table>
                            </div>
                            <div class="form-actions">
                                <button type="button" class="btn btn-secondary" onclick="uiManager.hideMoveHistoryDialog()">閉じる</button>
                                <button type="button" class="btn btn-danger" onclick="uiManager.clearMoveHistory()">履歴をクリア</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            document.body.insertAdjacentHTML('beforeend', historyHTML);

        } catch (error) {
            console.error('移動履歴表示エラー:', error);
            this.showMessage('履歴の表示に失敗しました', 'error');
        }
    }

    /**
     * データ移動履歴ダイアログを閉じる
     */
    hideMoveHistoryDialog() {
        const modal = document.getElementById('move-history-modal');
        if (modal) {
            modal.remove();
        }
    }

    /**
     * データ移動履歴をクリア
     */
    clearMoveHistory() {
        if (confirm('データ移動履歴をすべて削除しますか？')) {
            localStorage.removeItem('kaikei-data-move-history');
            this.hideMoveHistoryDialog();
            this.showMessage('移動履歴をクリアしました', 'success');
        }
    }

    /**
     * カテゴリー表示名取得
     */
    getCategoryDisplayName(category) {
        const categoryNames = {
            sales: '売上',
            purchases: '仕入れ',
            fixedCosts: '固定費',
            variableCosts: '変動費',
            laborCosts: '人件費',
            consumptionTax: '消費税',
            monthlyPayments: '月々の返済',
            manufacturerDeposits: 'メーカー保証金'
        };
        return categoryNames[category] || category;
    }
}