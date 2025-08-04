/**
 * メインアプリケーションクラス
 * 全体の制御とコンポーネント間の連携を担当
 */
class App {
    constructor() {
        this.dataManager = null;
        this.uiManager = null;
        this.chartManager = null;
        this.globalYear = new Date().getFullYear();
        this.globalMonth = new Date().getMonth() + 1;
        this.currentSection = 'sales';
    }

    /**
     * アプリケーション初期化
     */
    async init() {
        try {
            console.log('アプリケーションを初期化しています...');
            
            // 保存状態管理の初期化（早期初期化）
            const saveStatusManager = new SaveStatusManager();
            saveStatusManager.showLoading('データ読み込み中...');
            
            // データマネージャー初期化
            this.dataManager = new DataManager();
            
            // グローバル変数として設定（保存状態管理で使用するため）
            window.dataManager = this.dataManager;
            
            // データ読み込み
            const dataLoaded = await this.dataManager.loadData();
            
            // UIマネージャー初期化
            this.uiManager = new UIManager(this.dataManager);
            
            // チャートマネージャー初期化
            this.chartManager = new ChartManager(this.dataManager);
            
            // グローバル変数として設定（他のスクリプトからアクセス可能にする）
            window.uiManager = this.uiManager;
            window.chartManager = this.chartManager;
            window.app = this;
            
            // UI初期化
            this.uiManager.init();
            
            // CSVエクスポートドロップダウンの外部クリック処理
            this.setupDropdownCloseHandler();
            
            // グローバル日付選択の初期化
            this.initGlobalDateSelector();
            
            // 初期化完了後の状態設定
            if (dataLoaded) {
                saveStatusManager.showStatus('ready', 'データ読み込み完了');
            } else {
                saveStatusManager.showStatus('ready', '新規データで開始');
            }
            
            console.log('アプリケーションの初期化が完了しました');
            
        } catch (error) {
            console.error('アプリケーション初期化エラー:', error);
            
            // エラー状態を表示
            if (window.SaveStatusManager) {
                const saveStatusManager = new SaveStatusManager();
                saveStatusManager.showStatus('error', '初期化エラー');
            }
            
            this.showErrorMessage('アプリケーションの初期化に失敗しました。ページを再読み込みしてください。');
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
     * グローバル日付選択の初期化
     */
    initGlobalDateSelector() {
        const yearSelect = document.getElementById('global-year');
        const monthSelect = document.getElementById('global-month');
        
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
        const yearSelect = document.getElementById('global-year');
        const monthSelect = document.getElementById('global-month');
        
        this.globalYear = parseInt(yearSelect.value);
        this.globalMonth = parseInt(monthSelect.value);
        
        // 現在のセクションを再表示して日付フィルターを適用
        this.refreshCurrentSection();
    }

    /**
     * 現在のセクションを再表示
     */
    refreshCurrentSection() {
        if (this.uiManager) {
            this.uiManager.showSection(this.currentSection, this.globalYear, this.globalMonth);
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