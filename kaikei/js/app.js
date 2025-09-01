/**
 * メインアプリケーションクラス
 * 全体の制御とコンポーネント間の連携を担当
 */
class App {
    constructor() {
        this.dataManager = null;
        this.storeManager = null;
        this.uiManager = null;
        this.chartManager = null;
        this.globalYear = new Date().getFullYear();
        this.globalMonth = new Date().getMonth() + 1;
        this.currentSection = 'sales';
        
        // DOM要素キャッシュ
        this.domElements = {
            yearSelect: null,
            monthSelect: null,
            storeSelect: null,
            contentArea: null
        };
    }

    /**
     * アプリケーション初期化（パフォーマンス監視対応版）
     */
    async init() {
        const initStartTime = performance.now();
        
        try {
            console.log('アプリケーションを初期化しています...');
            
            // 必要なクラスの存在確認
            console.log('必要なクラスの存在確認中...');
            const requiredClasses = {
                'DataManager': typeof DataManager !== 'undefined' ? DataManager : null,
                'StoreManager': typeof StoreManager !== 'undefined' ? StoreManager : null,
                'UIManager': typeof UIManager !== 'undefined' ? UIManager : null,
                'ChartManager': typeof ChartManager !== 'undefined' ? ChartManager : null
            };
            
            const missingClasses = [];
            for (const [className, classRef] of Object.entries(requiredClasses)) {
                if (classRef === null || typeof classRef !== 'function') {
                    console.error(`❌ ${className}クラスが定義されていません`);
                    missingClasses.push(className);
                } else {
                    console.log(`✓ ${className}クラスは正常に定義されています`);
                }
            }
            
            if (missingClasses.length > 0) {
                throw new Error(`必要なクラスが見つかりません: ${missingClasses.join(', ')}`);
            }
            
            // 保存状態管理の初期化（早期初期化）
            let saveStatusManager = null;
            try {
                if (typeof SaveStatusManager !== 'undefined' && typeof SaveStatusManager === 'function') {
                    saveStatusManager = new SaveStatusManager();
                    if (saveStatusManager && typeof saveStatusManager.showLoading === 'function') {
                        saveStatusManager.showLoading('アプリケーションを初期化中...');
                    }
                }
            } catch (error) {
                console.warn('SaveStatusManagerの初期化に失敗しました:', error);
                saveStatusManager = null;
            }
            
            // 店舗マネージャー初期化
            console.log('店舗マネージャーを初期化中...');
            if (saveStatusManager) {
                saveStatusManager.showLoading('店舗データを読み込み中...');
            }
            
            this.storeManager = new StoreManager();
            await this.storeManager.loadStoreData();
            console.log('店舗マネージャー初期化完了');
            
            // データマネージャー初期化
            console.log('データマネージャーを初期化中...');
            if (saveStatusManager) {
                saveStatusManager.showLoading('収支データを読み込み中...');
            }
            this.dataManager = new DataManager();
            console.log('データマネージャー初期化完了');
            
            // グローバル変数として設定（保存状態管理で使用するため）
            window.dataManager = this.dataManager;
            window.storeManager = this.storeManager;
            
            // データ読み込み
            console.log('データを読み込み中...');
            const dataLoaded = await this.dataManager.loadData();
            console.log('データ読み込み完了');
            
            // 既存データの店舗対応移行
            console.log('データ移行を実行中...');
            if (saveStatusManager) {
                saveStatusManager.showLoading('データを最新形式に移行中...');
            }
            this.dataManager.migrateDataForStoreSupport();
            console.log('データ移行完了');
            
            // UIマネージャー初期化
            console.log('UIマネージャーを初期化中...');
            if (saveStatusManager) {
                saveStatusManager.showLoading('ユーザーインターフェースを準備中...');
            }
            this.uiManager = new UIManager(this.dataManager);
            
            // チャートマネージャー初期化
            console.log('チャートマネージャーを初期化中...');
            this.chartManager = new ChartManager(this.dataManager);
            
            // グローバル変数として設定（他のスクリプトからアクセス可能にする）
            window.uiManager = this.uiManager;
            window.chartManager = this.chartManager;
            window.app = this;
            
            // パフォーマンス監視開始（開発環境のみ）
            if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
                this.uiManager.performanceMonitor.startMonitoring();
                console.log('パフォーマンス監視を開始しました');
            }
            
            // UI初期化
            console.log('UIを初期化中...');
            if (saveStatusManager) {
                saveStatusManager.showLoading('画面を準備中...');
            }
            this.uiManager.init();
            
            // CSVエクスポートドロップダウンの外部クリック処理
            this.setupDropdownCloseHandler();
            
            // DOM要素をキャッシュ
            this.cacheDOMElements();
            
            // グローバル日付選択の初期化
            this.initGlobalDateSelector();
            
            // グローバル店舗選択の初期化
            this.initGlobalStoreSelector();

            // 初期化時間を計算
            const initEndTime = performance.now();
            const initTime = initEndTime - initStartTime;
            console.log(`アプリケーション初期化時間: ${initTime.toFixed(2)}ms`);

            // 初期化完了後の状態設定
            if (saveStatusManager) {
                if (dataLoaded) {
                    saveStatusManager.showStatus('ready', `データ読み込み完了 (${initTime.toFixed(0)}ms)`);
                } else {
                    saveStatusManager.showStatus('ready', `新規データで開始 (${initTime.toFixed(0)}ms)`);
                }
            }
            
            // 初期化完了通知
            if (this.uiManager && this.uiManager.toastManager) {
                this.uiManager.toastManager.show(
                    'アプリケーションの準備が完了しました',
                    'success',
                    3000,
                    '初期化完了'
                );
            }
            
            console.log('アプリケーションの初期化が完了しました');
            
            // バージョンマネージャーを初期化
            if (window.versionManager) {
                window.versionManager.init();
                console.log(`アプリケーションバージョン: ${window.versionManager.getFullVersion()}`);
            }
            
            // メモリ使用量をログ出力
            if (performance.memory) {
                const memoryMB = Math.round(performance.memory.usedJSHeapSize / 1024 / 1024);
                console.log(`初期化後のメモリ使用量: ${memoryMB}MB`);
            }
            
        } catch (error) {
            console.error('アプリケーション初期化エラー:', error);
            console.error('エラースタック:', error.stack);
            
            // エラー状態を表示
            if (window.SaveStatusManager) {
                const saveStatusManager = new SaveStatusManager();
                saveStatusManager.showStatus('error', '初期化エラー');
            }
            
            // 詳細なエラー情報を表示
            if (this.uiManager && this.uiManager.showEnhancedErrorMessage) {
                this.uiManager.showEnhancedErrorMessage(
                    'アプリケーション初期化エラー',
                    `アプリケーションの初期化に失敗しました: ${error.message}`,
                    {
                        showDetails: true,
                        details: error.stack,
                        showRetry: true,
                        retryAction: () => location.reload()
                    }
                );
            } else {
                this.showErrorMessage(`アプリケーションの初期化に失敗しました: ${error.message}\nページを再読み込みしてください。`);
            }
        }
    }

    /**
     * ナビゲーション処理
     */
    handleNavigation(section) {
        if (this.uiManager) {
            this.uiManager.showSection(section);
        }
    }

    /**
     * フォーム送信処理
     */
    handleFormSubmit(category, formData) {
        try {
            // バリデーション
            const validationResult = this.validateFormData(category, formData);
            if (!validationResult.isValid) {
                this.uiManager.showValidationError(validationResult.message);
                return false;
            }
            
            // データ保存
            this.dataManager.addRecord(category, formData);
            
            // UI更新
            this.uiManager.showSection(this.uiManager.currentSection);
            this.uiManager.showMessage('データを保存しました', 'success');
            
            return true;
            
        } catch (error) {
            console.error('フォーム送信エラー:', error);
            this.uiManager.showValidationError('データの保存に失敗しました: ' + error.message);
            return false;
        }
    }

    /**
     * フォームデータバリデーション
     */
    validateFormData(category, formData) {
        // 共通バリデーション
        if (!formData.year || !formData.month || !formData.amount) {
            return {
                isValid: false,
                message: '年、月、金額は必須項目です'
            };
        }
        
        if (formData.year < 2000 || formData.year > 2100) {
            return {
                isValid: false,
                message: '年は2000年から2100年の間で入力してください'
            };
        }
        
        if (formData.month < 1 || formData.month > 12) {
            return {
                isValid: false,
                message: '月は1から12の間で入力してください'
            };
        }
        
        if (formData.amount <= 0) {
            return {
                isValid: false,
                message: '金額は正の数値で入力してください'
            };
        }
        
        // カテゴリー固有のバリデーション
        switch(category) {
            case 'fixedCosts':
            case 'otherExpenses':
                if (!formData.category) {
                    return {
                        isValid: false,
                        message: 'カテゴリーは必須項目です'
                    };
                }
                break;
                
            case 'monthlyPayments':
                if (!formData.payee) {
                    return {
                        isValid: false,
                        message: '返済先は必須項目です'
                    };
                }
                break;
                
            case 'manufacturerDeposits':
                if (!formData.manufacturer) {
                    return {
                        isValid: false,
                        message: 'メーカー名は必須項目です'
                    };
                }
                break;
        }
        
        // 備考の文字数チェック
        if (formData.note && formData.note.length > 200) {
            return {
                isValid: false,
                message: '備考は200文字以内で入力してください'
            };
        }
        
        return {
            isValid: true,
            message: ''
        };
    }

    /**
     * CSVエクスポートドロップダウンの外部クリック処理設定
     */
    setupDropdownCloseHandler() {
        document.addEventListener('click', (event) => {
            const dropdown = document.getElementById('export-dropdown-menu');
            const dropdownToggle = event.target.closest('.dropdown-toggle');
            
            // ドロップダウンが存在し、表示されている場合
            if (dropdown && dropdown.style.display === 'block') {
                // ドロップダウンボタンまたはドロップダウンメニュー内のクリックでない場合は閉じる
                if (!dropdownToggle && !dropdown.contains(event.target)) {
                    dropdown.style.display = 'none';
                }
            }
        });
    }

    /**
     * DOM要素キャッシュ
     */
    cacheDOMElements() {
        this.domElements.yearSelect = document.getElementById('global-year');
        this.domElements.monthSelect = document.getElementById('global-month');
        this.domElements.storeSelect = document.getElementById('global-store');
        this.domElements.contentArea = document.getElementById('content-area');
    }

    /**
     * グローバル日付選択の初期化
     */
    initGlobalDateSelector() {
        const yearSelect = this.domElements.yearSelect || document.getElementById('global-year');
        const monthSelect = this.domElements.monthSelect || document.getElementById('global-month');
        
        // 年のオプション生成（過去5年から未来2年まで）
        const currentYear = new Date().getFullYear();
        for (let year = currentYear - 5; year <= currentYear + 2; year++) {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = `${year}年`;
            if (year === this.globalYear) {
                option.selected = true;
            }
            yearSelect.appendChild(option);
        }
        
        // 月のオプション生成
        for (let month = 1; month <= 12; month++) {
            const option = document.createElement('option');
            option.value = month;
            option.textContent = `${month}月`;
            if (month === this.globalMonth) {
                option.selected = true;
            }
            monthSelect.appendChild(option);
        }
    }

    /**
     * グローバル日付変更処理
     */
    changeGlobalDate() {
        const yearSelect = this.domElements.yearSelect || document.getElementById('global-year');
        const monthSelect = this.domElements.monthSelect || document.getElementById('global-month');
        
        if (!yearSelect || !monthSelect) {
            console.error('日付選択要素が見つかりません');
            return;
        }
        
        this.globalYear = parseInt(yearSelect.value, 10);
        this.globalMonth = parseInt(monthSelect.value, 10);
        
        if (isNaN(this.globalYear) || isNaN(this.globalMonth)) {
            console.error('無効な日付が選択されました');
            return;
        }
        
        // 現在のセクションを再表示して日付フィルターを適用
        this.refreshCurrentSection();
    }

    /**
     * グローバル店舗選択の初期化
     */
    initGlobalStoreSelector() {
        const storeSelectorDiv = document.getElementById('global-store-selector');
        if (!storeSelectorDiv) return;

        let selectHTML = '<label for="global-store">店舗:</label><select id="global-store" onchange="app.changeGlobalStore()">';
        const stores = this.storeManager.getStores();
        const activeStoreId = this.storeManager.getActiveStoreId();

        if (stores.length === 0) {
            selectHTML += '<option value="">店舗がありません</option>';
        } else {
            stores.forEach(store => {
                const selected = store.id === activeStoreId ? 'selected' : '';
                selectHTML += `<option value="${store.id}" ${selected}>${store.name}</option>`;
            });
        }
        selectHTML += '</select>';
        storeSelectorDiv.innerHTML = selectHTML;
    }

    /**
     * グローバル店舗変更処理（ローディング対応版）
     */
    changeGlobalStore() {
        const storeSelect = this.domElements.storeSelect || document.getElementById('global-store');
        
        if (!storeSelect) {
            console.error('店舗選択要素が見つかりません');
            return;
        }
        
        const newStoreId = storeSelect.value;
        
        if (!newStoreId) return;
        
        // 現在の店舗と同じ場合は何もしない
        const currentStoreId = this.storeManager.getActiveStoreId();
        if (newStoreId === currentStoreId) return;
        
        // ローディング表示
        const loaderId = window.loadingManager ? 
            window.loadingManager.show('店舗を切り替え中...', '新しい店舗のデータを読み込んでいます') : null;
        
        // コンテンツエリアにローディング状態を適用
        const contentArea = this.domElements.contentArea || document.getElementById('content-area');
        if (contentArea && window.loadingManager) {
            window.loadingManager.showStoreSwitching(contentArea);
        }
        
        try {
            // 店舗切り替え実行
            this.storeManager.setActiveStore(newStoreId);
            
            // 非同期で画面更新
            setTimeout(() => {
                try {
                    // 現在のセクションを再表示
                    this.refreshCurrentSection();
                    
                    // 店舗情報取得
                    const newStore = this.storeManager.getStoreById(newStoreId);
                    const storeName = newStore ? newStore.name : '不明な店舗';
                    
                    // ローディング終了
                    if (loaderId && window.loadingManager) {
                        window.loadingManager.hide(loaderId);
                    }
                    if (contentArea && window.loadingManager) {
                        window.loadingManager.hideStoreSwitching(contentArea);
                    }
                    
                    // 成功通知
                    if (window.toastManager) {
                        window.toastManager.show(
                            `店舗を「${storeName}」に切り替えました`,
                            'success',
                            3000
                        );
                    } else if (this.uiManager) {
                        this.uiManager.showMessage(`店舗を「${storeName}」に切り替えました`, 'success');
                    }
                    
                    // パフォーマンス監視
                    if (window.performanceMonitor) {
                        window.performanceMonitor.measureRenderTime('store-switch', () => {
                            console.log(`店舗切り替え完了: ${storeName}`);
                        });
                    }
                    
                } catch (error) {
                    console.error('店舗切り替えエラー:', error);
                    
                    // ローディング終了
                    if (loaderId && window.loadingManager) {
                        window.loadingManager.hide(loaderId);
                    }
                    if (contentArea && window.loadingManager) {
                        window.loadingManager.hideStoreSwitching(contentArea);
                    }
                    
                    // エラー通知
                    if (window.toastManager) {
                        window.toastManager.show(
                            `店舗切り替えに失敗しました: ${error.message}`,
                            'error',
                            5000
                        );
                    }
                    
                    // 元の店舗に戻す
                    if (currentStoreId) {
                        storeSelect.value = currentStoreId;
                    }
                }
            }, 100); // UIの応答性を保つための短い遅延
            
        } catch (error) {
            console.error('店舗切り替え初期化エラー:', error);
            
            // ローディング終了
            if (loaderId && window.loadingManager) {
                window.loadingManager.hide(loaderId);
            }
            if (contentArea && window.loadingManager) {
                window.loadingManager.hideStoreSwitching(contentArea);
            }
            
            // エラー通知
            if (window.toastManager) {
                window.toastManager.show(
                    `店舗切り替えに失敗しました: ${error.message}`,
                    'error',
                    5000
                );
            }
            
            // 元の店舗に戻す
            if (currentStoreId) {
                storeSelect.value = currentStoreId;
            }
        }
    }

    /**
     * 現在のセクションを再表示
     */
    refreshCurrentSection() {
        if (this.uiManager) {
            this.uiManager.showSection(this.currentSection, this.globalYear, this.globalMonth);
            // 店舗管理画面の場合は、店舗リストも更新
            if (this.currentSection === 'stores') {
                this.uiManager.showStoreManagement();
            }
        }
    }

    /**
     * 現在のセクションを記録
     */
    setCurrentSection(section) {
        this.currentSection = section;
    }

    /**
     * グローバル年月取得
     */
    getGlobalDate() {
        return {
            year: this.globalYear,
            month: this.globalMonth
        };
    }

    /**
     * エラーメッセージ表示
     */
    showErrorMessage(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background-color: #e74c3c;
            color: white;
            padding: 1rem 2rem;
            border-radius: 4px;
            z-index: 1000;
            box-shadow: 0 2px 10px rgba(0,0,0,0.3);
        `;
        errorDiv.textContent = message;
        
        document.body.appendChild(errorDiv);
        
        // 5秒後に自動削除
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.parentNode.removeChild(errorDiv);
            }
        }, 5000);
    }
}

// アプリケーション開始
document.addEventListener('DOMContentLoaded', async () => {
    const app = new App();
    await app.init();
    
    // グローバル変数として設定
    window.app = app;
});