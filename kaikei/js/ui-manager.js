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
 * UI管理クラス
 * ユーザーインターフェースの制御と表示を担当
 */
class UIManager {
    constructor(dataManager) {
        this.dataManager = dataManager;
        this.contentArea = document.getElementById('content-area');
        this.currentSection = 'sales';
        this.saveStatusManager = new SaveStatusManager();
    }

    /**
     * 初期化
     */
    init() {
        this.setupNavigation();
        this.saveStatusManager.init();
        this.showSection('sales');
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
     * セクション表示
     */
    showSection(section, globalYear = null, globalMonth = null) {
        this.currentSection = section;
        
        // 現在のセクションを記録
        if (window.app) {
            window.app.setCurrentSection(section);
        }
        
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
            case 'backup':
                this.showBackupManagement();
                break;
            default:
                this.showDataManagement('売上管理', 'sales');
        }
    }

    /**
     * データ管理画面表示
     */
    showDataManagement(title, category) {
        let data = this.dataManager.getDataByCategory(category);
        
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
     * データテーブル表示
     */
    renderDataTable(category, data) {
        if (data.length === 0) {
            return '<p>データがありません。新規追加ボタンからデータを追加してください。</p>';
        }

        let tableHTML = '<table class="data-table"><thead><tr>';
        
        // ヘッダー生成（カテゴリーに応じて）
        const headers = this.getTableHeaders(category);
        headers.forEach(header => {
            tableHTML += `<th>${header}</th>`;
        });
        tableHTML += '<th>操作</th></tr></thead><tbody>';

        // データ行生成
        data.forEach(record => {
            tableHTML += '<tr>';
            headers.forEach(header => {
                const value = this.getRecordValue(record, header);
                tableHTML += `<td>${value}</td>`;
            });
            tableHTML += `
                <td>
                    <button class="btn btn-secondary" onclick="uiManager.showEditForm('${category}', '${record.id}')">編集</button>
                    <button class="btn btn-danger" onclick="uiManager.deleteRecord('${category}', '${record.id}')">削除</button>
                </td>
            `;
            tableHTML += '</tr>';
        });

        tableHTML += '</tbody></table>';
        return tableHTML;
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
     * レコード値取得
     */
    getRecordValue(record, header) {
        switch(header) {
            case '年': return record.year;
            case '月': return record.month;
            case '金額': return record.amount ? record.amount.toLocaleString() + '円' : '';
            case '備考': return record.note || '';
            case 'カテゴリー': return record.category || '';
            case '返済先': return record.payee || '';
            case 'メーカー名': return record.manufacturer || '';
            default: return '';
        }
    }

    /**
     * 入力フォーム表示
     */
    showInputForm(category) {
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
        
        this.contentArea.innerHTML = `
            <div class="section-header">
                <h2>収支レポート</h2>
                <div class="report-controls">
                    <div class="current-date-display">
                        <span class="date-label">表示中:</span>
                        <span class="date-value">${globalDate.year}年${globalDate.month}月</span>
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
            </div>
        `;
        
        // グローバル日付でレポートを表示
        this.showMonthlyReport(globalDate.year, globalDate.month);
    }

    /**
     * レポート更新
     */
    updateReport() {
        const year = parseInt(document.getElementById('report-year').value);
        const month = parseInt(document.getElementById('report-month').value);
        
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
        
        let html = `
            <div class="monthly-report">
                <div class="report-header">
                    <h3>${year}年${month}月の収支レポート</h3>
                    <div class="report-summary ${isDeficit ? 'deficit' : 'profit'}">
                        <div class="summary-item">
                            <span class="label">売上:</span>
                            <span class="value income">${sales.toLocaleString()}円</span>
                        </div>
                        <div class="summary-item">
                            <span class="label">粗利:</span>
                            <span class="value income">${grossProfit.toLocaleString()}円</span>
                        </div>
                        <div class="summary-item">
                            <span class="label">支出:</span>
                            <span class="value expense">${totalExpenses.toLocaleString()}円</span>
                        </div>
                        <div class="summary-item profit-item">
                            <span class="label">${isDeficit ? '赤字:' : '利益:'}</span>
                            <span class="value ${isDeficit ? 'deficit' : 'profit'}">${Math.abs(profit).toLocaleString()}円</span>
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
                                <span class="category-amount expense">${category.amount.toLocaleString()}円</span>
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
        
        let html = `
            <div class="yearly-report">
                <div class="report-header">
                    <h3>${year}年の年間収支レポート</h3>
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
                } else if (isNaN(value) || value < 2000 || value > 2100) {
                    error = '年は2000年から2100年の間で入力してください';
                }
                break;
            case 'month':
                if (!value) {
                    error = '月は必須項目です';
                } else if (isNaN(value) || value < 1 || value > 12) {
                    error = '月は1から12の間で選択してください';
                }
                break;
            case 'amount':
                if (!value) {
                    error = '金額は必須項目です';
                } else if (isNaN(value) || Number(value) < 0) {
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
        this.contentArea.innerHTML = `
            <div class="section-header">
                <h2>データ管理・バックアップ</h2>
                <div class="section-controls">
                    <button class="btn btn-primary" onclick="uiManager.showCreateBackupDialog()">手動バックアップ作成</button>
                    <button class="btn btn-secondary" onclick="uiManager.showImportBackupDialog()">バックアップインポート</button>
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
            const year = parseInt(document.getElementById('report-year').value);
            const month = parseInt(document.getElementById('report-month').value);
            
            const result = this.dataManager.exportToCSV({
                exportType: 'monthly',
                year: year,
                month: month
            });
            
            this.showMessage(`${year}年${month}月のデータをCSVエクスポートしました（${result.recordCount}件）`, 'success');
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
            const year = parseInt(document.getElementById('report-year').value);
            
            const result = this.dataManager.exportToCSV({
                exportType: 'yearly',
                year: year
            });
            
            this.showMessage(`${year}年のデータをCSVエクスポートしました（${result.recordCount}件）`, 'success');
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
            if (!confirm('全データをCSVエクスポートしますか？データ量が多い場合、時間がかかる場合があります。')) {
                return;
            }
            
            const result = this.dataManager.exportToCSV({
                exportType: 'all'
            });
            
            this.showMessage(`全データをCSVエクスポートしました（${result.recordCount}件）`, 'success');
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
            const startYear = parseInt(document.getElementById('start-year').value);
            const startMonth = parseInt(document.getElementById('start-month').value);
            const endYear = parseInt(document.getElementById('end-year').value);
            const endMonth = parseInt(document.getElementById('end-month').value);
            
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

        const startYear = parseInt(data.startYear);
        const startMonth = parseInt(data.startMonth);
        const endYear = parseInt(data.endYear);
        const endMonth = parseInt(data.endMonth);
        const amount = parseInt(data.amount);

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
                    amount: parseInt(amount),
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
}