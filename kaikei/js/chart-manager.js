/**
 * チャート管理クラス
 * グラフの描画と管理を担当
 */
class ChartManager {
    constructor(dataManager) {
        this.dataManager = dataManager;
        this.charts = new Map();
    }

    /**
     * 月別収支計算
     */
    calculateMonthlyBalance(year, month) {
        const activeStoreId = window.storeManager ? window.storeManager.getActiveStoreId() : null;

        // 売上データ取得
        const salesData = this.dataManager.getDataByCategory('sales')
            .filter(record => record.year === year && record.month === month)
            .filter(record => !activeStoreId || record.storeId === activeStoreId);

        // 仕入れデータ取得
        const purchasesData = this.dataManager.getDataByCategory('purchases')
            .filter(record => record.year === year && record.month === month)
            .filter(record => !activeStoreId || record.storeId === activeStoreId);

        // 固定費データ取得
        const fixedCostsData = this.dataManager.getDataByCategory('fixedCosts')
            .filter(record => record.year === year && record.month === month)
            .filter(record => !activeStoreId || record.storeId === activeStoreId);

        // 変動費データ取得
        const variableCostsData = this.dataManager.getDataByCategory('variableCosts')
            .filter(record => record.year === year && record.month === month)
            .filter(record => !activeStoreId || record.storeId === activeStoreId);

        // 人件費データ取得
        const laborCostsData = this.dataManager.getDataByCategory('laborCosts')
            .filter(record => record.year === year && record.month === month)
            .filter(record => !activeStoreId || record.storeId === activeStoreId);

        // 消費税データ取得
        const consumptionTaxData = this.dataManager.getDataByCategory('consumptionTax')
            .filter(record => record.year === year && record.month === month)
            .filter(record => !activeStoreId || record.storeId === activeStoreId);

        // 月々の返済データ取得
        const monthlyPaymentsData = this.dataManager.getDataByCategory('monthlyPayments')
            .filter(record => record.year === year && record.month === month)
            .filter(record => !activeStoreId || record.storeId === activeStoreId);

        // メーカー保証金データ取得
        const manufacturerDepositsData = this.dataManager.getDataByCategory('manufacturerDeposits')
            .filter(record => record.year === year && record.month === month)
            .filter(record => !activeStoreId || record.storeId === activeStoreId);

        // 合計計算（数値の安全性を確保）
        const safeAmount = (record) => {
            const amount = Number(record.amount);
            return isNaN(amount) ? 0 : amount;
        };

        const sales = salesData.reduce((sum, record) => sum + safeAmount(record), 0);
        const purchases = purchasesData.reduce((sum, record) => sum + safeAmount(record), 0);
        const fixedCosts = fixedCostsData.reduce((sum, record) => sum + safeAmount(record), 0);
        const variableCosts = variableCostsData.reduce((sum, record) => sum + safeAmount(record), 0);
        const laborCosts = laborCostsData.reduce((sum, record) => sum + safeAmount(record), 0);
        const consumptionTax = consumptionTaxData.reduce((sum, record) => sum + safeAmount(record), 0);
        const monthlyPayments = monthlyPaymentsData.reduce((sum, record) => sum + safeAmount(record), 0);
        const manufacturerDeposits = manufacturerDepositsData.reduce((sum, record) => sum + safeAmount(record), 0);

        const grossProfit = sales - purchases;
        const totalExpenses = fixedCosts + variableCosts + laborCosts + consumptionTax + monthlyPayments + manufacturerDeposits;
        const profit = grossProfit - totalExpenses;
        const isDeficit = profit < 0;

        // カテゴリー別内訳
        const categoryBreakdown = {
            income: {
                sales: { amount: sales, count: salesData.length }
            },
            expenses: {
                purchases: { amount: purchases, count: purchasesData.length },
                fixedCosts: { amount: fixedCosts, count: fixedCostsData.length },
                variableCosts: { amount: variableCosts, count: variableCostsData.length },
                laborCosts: { amount: laborCosts, count: laborCostsData.length },
                consumptionTax: { amount: consumptionTax, count: consumptionTaxData.length },
                monthlyPayments: { amount: monthlyPayments, count: monthlyPaymentsData.length },
                manufacturerDeposits: { amount: manufacturerDeposits, count: manufacturerDepositsData.length }
            }
        };

        return {
            year,
            month,
            sales,
            purchases,
            grossProfit,
            totalExpenses,
            profit,
            isDeficit,
            categoryBreakdown,
            recordCounts: {
                sales: salesData.length,
                purchases: purchasesData.length,
                fixedCosts: fixedCostsData.length,
                variableCosts: variableCostsData.length,
                laborCosts: laborCostsData.length,
                consumptionTax: consumptionTaxData.length,
                monthlyPayments: monthlyPaymentsData.length,
                manufacturerDeposits: manufacturerDepositsData.length
            }
        };
    }

    /**
     * 月別チャート描画
     */
    renderMonthlyChart(year, month) {
        const balanceData = this.calculateMonthlyBalance(year, month);

        // 収入・支出チャート
        this.renderIncomeExpenseChart(balanceData);

        // カテゴリー別支出チャート
        this.renderExpenseCategoryChart(balanceData);
    }

    /**
     * 収入・支出チャート描画
     */
    renderIncomeExpenseChart(balanceData) {
        const canvas = document.getElementById('income-expense-chart');
        if (!canvas) return;

        // 既存のチャートを破棄
        if (this.charts.has('income-expense')) {
            this.charts.get('income-expense').destroy();
        }

        const ctx = canvas.getContext('2d');
        const chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['売上', '仕入れ', '粗利', '支出', '利益'],
                datasets: [{
                    data: [
                        balanceData.sales,
                        balanceData.purchases,
                        balanceData.grossProfit,
                        balanceData.totalExpenses,
                        Math.abs(balanceData.profit)
                    ],
                    backgroundColor: [
                        '#4CAF50', // 売上 - 緑
                        '#FF9800', // 仕入れ - オレンジ
                        '#2196F3', // 粗利 - 青
                        '#F44336', // 支出 - 赤
                        balanceData.isDeficit ? '#F44336' : '#4CAF50' // 利益/赤字
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    title: {
                        display: true,
                        text: `${balanceData.year}年${balanceData.month}月 収支概要`
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function (value) {
                                return value.toLocaleString() + '円';
                            }
                        }
                    }
                }
            }
        });

        this.charts.set('income-expense', chart);
    }

    /**
     * カテゴリー別支出チャート描画
     */
    renderExpenseCategoryChart(balanceData) {
        const canvas = document.getElementById('expense-category-chart');
        if (!canvas) return;

        // 既存のチャートを破棄
        if (this.charts.has('expense-category')) {
            this.charts.get('expense-category').destroy();
        }

        const expenses = balanceData.categoryBreakdown.expenses;
        const labels = [];
        const data = [];
        const colors = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF'];

        let colorIndex = 0;
        for (const [category, info] of Object.entries(expenses)) {
            if (info.amount > 0) {
                labels.push(this.getCategoryDisplayName(category));
                data.push(info.amount);
            }
        }

        if (data.length === 0) {
            return; // データがない場合は描画しない
        }

        const ctx = canvas.getContext('2d');
        const chart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: colors.slice(0, data.length)
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'カテゴリー別支出内訳'
                    },
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                const value = context.parsed;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((value / total) * 100).toFixed(1);
                                return `${context.label}: ${value.toLocaleString()}円 (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });

        this.charts.set('expense-category', chart);
    }

    /**
     * カテゴリー表示名取得
     */
    getCategoryDisplayName(category) {
        const displayNames = {
            purchases: '仕入れ',
            fixedCosts: '固定費',
            variableCosts: '変動費',
            laborCosts: '人件費',
            consumptionTax: '消費税',
            monthlyPayments: '月々の返済',
            manufacturerDeposits: 'メーカー保証金'
        };
        return displayNames[category] || category;
    }

    /**
     * 全チャート破棄
     */
    destroyAllCharts() {
        for (const chart of this.charts.values()) {
            chart.destroy();
        }
        this.charts.clear();
    }

    /**
     * 統合レポート用の収支計算
     */
    calculateConsolidatedBalance(year, month) {
        try {
            if (!window.dataManager || !window.storeManager) {
                console.warn('DataManager または StoreManager が利用できません');
                return {
                    totalIncome: 0,
                    totalExpense: 0,
                    balance: 0,
                    stores: []
                };
            }

            const stores = window.storeManager.getStores();
            const storeBalances = [];
            let totalIncome = 0;
            let totalExpense = 0;

            stores.forEach(store => {
                const storeData = window.dataManager.getRecordsByMonth(year, month, store.id);

                // 収入計算（売上）
                const income = storeData.sales?.reduce((sum, record) => sum + (record.amount || 0), 0) || 0;

                // 支出計算（仕入、固定費、変動費、人件費、消費税、月次支払い）
                const purchases = storeData.purchases?.reduce((sum, record) => sum + (record.amount || 0), 0) || 0;
                const fixedCosts = storeData.fixedCosts?.reduce((sum, record) => sum + (record.amount || 0), 0) || 0;
                const variableCosts = storeData.variableCosts?.reduce((sum, record) => sum + (record.amount || 0), 0) || 0;
                const laborCosts = storeData.laborCosts?.reduce((sum, record) => sum + (record.amount || 0), 0) || 0;
                const consumptionTax = storeData.consumptionTax?.reduce((sum, record) => sum + (record.amount || 0), 0) || 0;
                const monthlyPayments = storeData.monthlyPayments?.reduce((sum, record) => sum + (record.amount || 0), 0) || 0;

                const expense = purchases + fixedCosts + variableCosts + laborCosts + consumptionTax + monthlyPayments;
                const balance = income - expense;

                storeBalances.push({
                    store: store,
                    income: income,
                    expense: expense,
                    balance: balance
                });

                totalIncome += income;
                totalExpense += expense;
            });

            return {
                totalIncome: totalIncome,
                totalExpense: totalExpense,
                balance: totalIncome - totalExpense,
                stores: storeBalances
            };
        } catch (error) {
            console.error('統合収支計算エラー:', error);
            return {
                totalIncome: 0,
                totalExpense: 0,
                balance: 0,
                stores: []
            };
        }
    }

    /**
     * 店舗比較レポート用の計算
     */
    calculateStoreComparison(year, month) {
        try {
            if (!window.dataManager || !window.storeManager) {
                console.warn('DataManager または StoreManager が利用できません');
                return [];
            }

            const stores = window.storeManager.getStores();
            const comparison = [];

            stores.forEach(store => {
                const storeData = window.dataManager.getRecordsByMonth(year, month, store.id);

                // 収入計算（売上）
                const income = storeData.sales?.reduce((sum, record) => sum + (record.amount || 0), 0) || 0;

                // 支出計算
                const purchases = storeData.purchases?.reduce((sum, record) => sum + (record.amount || 0), 0) || 0;
                const fixedCosts = storeData.fixedCosts?.reduce((sum, record) => sum + (record.amount || 0), 0) || 0;
                const variableCosts = storeData.variableCosts?.reduce((sum, record) => sum + (record.amount || 0), 0) || 0;
                const laborCosts = storeData.laborCosts?.reduce((sum, record) => sum + (record.amount || 0), 0) || 0;
                const consumptionTax = storeData.consumptionTax?.reduce((sum, record) => sum + (record.amount || 0), 0) || 0;
                const monthlyPayments = storeData.monthlyPayments?.reduce((sum, record) => sum + (record.amount || 0), 0) || 0;

                const expense = purchases + fixedCosts + variableCosts + laborCosts + consumptionTax + monthlyPayments;
                const balance = income - expense;

                comparison.push({
                    store: store,
                    income: income,
                    expense: expense,
                    balance: balance,
                    profitMargin: income > 0 ? ((balance / income) * 100) : 0
                });
            });

            // 収益順でソート
            comparison.sort((a, b) => b.balance - a.balance);

            return comparison;
        } catch (error) {
            console.error('店舗比較計算エラー:', error);
            return [];
        }
    }

    /**
     * 年間収支計算
     */
    calculateYearlyBalance(year) {
        try {
            if (!this.dataManager) {
                console.warn('DataManager が利用できません');
                return { income: 0, expense: 0, balance: 0, monthlyData: [] };
            }

            const activeStoreId = window.storeManager ? window.storeManager.getActiveStoreId() : null;
            const monthlyData = [];
            let totalIncome = 0;
            let totalExpense = 0;

            // 各月のデータを計算
            for (let month = 1; month <= 12; month++) {
                const monthlyBalance = this.calculateMonthlyBalance(year, month);

                monthlyData.push({
                    month: month,
                    income: monthlyBalance.income,
                    expense: monthlyBalance.expense,
                    balance: monthlyBalance.balance
                });

                totalIncome += monthlyBalance.income;
                totalExpense += monthlyBalance.expense;
            }

            // 赤字月と黒字月をカウント
            const deficitMonthsCount = monthlyData.filter(m => m.balance < 0).length;
            const profitableMonthsCount = monthlyData.filter(m => m.balance > 0).length;
            const totalProfit = totalIncome - totalExpense;
            const averageMonthlyProfit = totalProfit / 12;

            return {
                year: year,
                totalSales: totalIncome,
                totalExpenses: totalExpense,
                totalProfit: totalProfit,
                averageMonthlyProfit: averageMonthlyProfit,
                deficitMonthsCount: deficitMonthsCount,
                profitableMonthsCount: profitableMonthsCount,
                monthlyResults: monthlyData,
                yearlyProfitMargin: totalIncome > 0 ? ((totalProfit / totalIncome) * 100) : 0,
                // 後方互換性のため
                income: totalIncome,
                expense: totalExpense,
                balance: totalProfit,
                monthlyData: monthlyData,
                profitMargin: totalIncome > 0 ? ((totalProfit / totalIncome) * 100) : 0
            };
        } catch (error) {
            console.error('年間収支計算エラー:', error);
            return { 
                year: year,
                totalSales: 0,
                totalExpenses: 0,
                totalProfit: 0,
                averageMonthlyProfit: 0,
                deficitMonthsCount: 0,
                profitableMonthsCount: 0,
                monthlyResults: [],
                yearlyProfitMargin: 0,
                // 後方互換性のため
                income: 0, 
                expense: 0, 
                balance: 0, 
                monthlyData: [] 
            };
        }
    }
}

// ChartManagerファイル読み込み確認
console.log('chart-manager.js が読み込まれました');