/**
 * グラフ管理クラス
 * 収支グラフの生成と表示を担当
 */
class ChartManager {
    constructor(dataManager) {
        this.dataManager = dataManager;
        this.charts = {};
    }

    /**
     * 月次収支グラフ表示
     * 円グラフで支出内訳を表示し、棒グラフで収支比較を表示
     */
    renderMonthlyChart(year, month) {
        const balanceData = this.calculateMonthlyBalance(year, month);
        
        // 既存のグラフを削除
        this.destroyChart('expenseBreakdownChart');
        this.destroyChart('incomeExpenseChart');
        
        // 支出内訳円グラフを描画
        this.renderExpenseBreakdownChart(balanceData);
        
        // 収支比較棒グラフを描画
        this.renderIncomeExpenseChart(balanceData);
    }

    /**
     * 支出内訳円グラフの描画
     */
    renderExpenseBreakdownChart(balanceData) {
        const canvas = document.getElementById('expenseBreakdownChart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        
        // 支出データの準備
        const expenseData = [
            { label: '仕入れ', amount: balanceData.purchases, color: '#FF6384' },
            { label: '固定費', amount: balanceData.fixedCosts, color: '#36A2EB' },
            { label: '変動費', amount: balanceData.variableCosts, color: '#FFCE56' },
            { label: '人件費', amount: balanceData.laborCosts, color: '#9966FF' },
            { label: '消費税', amount: balanceData.consumptionTax, color: '#FF9F40' },
            { label: '月々の返済', amount: balanceData.monthlyPayments, color: '#FF6384' },
            { label: 'メーカー保証金', amount: balanceData.manufacturerDeposits, color: '#4BC0C0' }
        ];

        // 金額が0より大きいデータのみフィルタリング
        const filteredData = expenseData.filter(item => item.amount > 0);
        
        const noDataMessageElement = document.getElementById('expenseNoDataMessage');
        if (filteredData.length === 0) {
            // データがない場合の表示
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.font = '16px Arial';
            ctx.fillStyle = '#666';
            ctx.textAlign = 'center';
            ctx.fillText('支出データがありません', canvas.width / 2, canvas.height / 2);
            return;
        } else {
            canvas.style.display = 'block';
            if (noDataMessageElement) {
                noDataMessageElement.style.display = 'none';
            }
        }

        const chartData = {
            labels: filteredData.map(item => item.label),
            datasets: [{
                data: filteredData.map(item => item.amount),
                backgroundColor: filteredData.map(item => item.color),
                borderWidth: 2,
                borderColor: '#fff'
            }]
        };

        const config = {
            type: 'pie',
            data: chartData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: `${balanceData.year}年${balanceData.month}月 支出内訳`,
                        font: {
                            size: 16,
                            weight: 'bold'
                        }
                    },
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            usePointStyle: true
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.parsed;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((value / total) * 100).toFixed(1);
                                return `${label}: ${value.toLocaleString()}円 (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        };

        this.charts['expenseBreakdownChart'] = new Chart(ctx, config);
    }

    /**
     * 収支比較棒グラフの描画
     */
    renderIncomeExpenseChart(balanceData) {
        const canvas = document.getElementById('incomeExpenseChart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');

        if (balanceData.sales === 0 && balanceData.totalExpenses === 0) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.font = '16px Arial';
            ctx.fillStyle = '#666';
            ctx.textAlign = 'center';
            ctx.fillText('収支データがありません', canvas.width / 2, canvas.height / 2);
            return;
        }

        const chartData = {
            labels: ['収支比較'],
            datasets: [
                {
                    label: '売上',
                    data: [balanceData.sales],
                    backgroundColor: '#4CAF50',
                    borderColor: '#45a049',
                    borderWidth: 1
                },
                {
                    label: '支出',
                    data: [balanceData.totalExpenses],
                    backgroundColor: '#f44336',
                    borderColor: '#da190b',
                    borderWidth: 1
                },
                {
                    label: balanceData.isDeficit ? '赤字' : '利益',
                    data: [Math.abs(balanceData.profit)],
                    backgroundColor: balanceData.isDeficit ? '#FF5722' : '#2196F3',
                    borderColor: balanceData.isDeficit ? '#E64A19' : '#1976D2',
                    borderWidth: 1
                }
            ]
        };

        const config = {
            type: 'bar',
            data: chartData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: `${balanceData.year}年${balanceData.month}月 収支比較`,
                        font: {
                            size: 16,
                            weight: 'bold'
                        }
                    },
                    legend: {
                        position: 'top'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.dataset.label || '';
                                const value = context.parsed.y;
                                return `${label}: ${value.toLocaleString()}円`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return value.toLocaleString() + '円';
                            }
                        }
                    }
                }
            }
        };

        this.charts['incomeExpenseChart'] = new Chart(ctx, config);
    }

    /**
     * 年間推移グラフ表示
     * 月別データを使用した年間推移線グラフを作成し、インタラクティブなグラフ機能を実装
     */
    renderYearlyChart(year) {
        const yearlyData = this.calculateYearlyBalance(year);
        
        // 既存のグラフを削除
        this.destroyChart('yearlyTrendChart');
        this.destroyChart('yearlyComparisonChart');
        
        // 年間推移線グラフを描画
        this.renderYearlyTrendChart(yearlyData);
        
        // 年間比較棒グラフを描画
        this.renderYearlyComparisonChart(yearlyData);
    }

    /**
     * 年間推移線グラフの描画
     */
    renderYearlyTrendChart(yearlyData) {
        const canvas = document.getElementById('yearlyTrendChart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const monthlyResults = yearlyData.monthlyResults;

        // 月ラベルの生成
        const monthLabels = monthlyResults.map(month => `${month.month}月`);
        
        // データセットの準備
        const salesData = monthlyResults.map(month => month.sales);
        const expensesData = monthlyResults.map(month => month.totalExpenses);
        const profitData = monthlyResults.map(month => month.profit);

        const chartData = {
            labels: monthLabels,
            datasets: [
                {
                    label: '売上',
                    data: salesData,
                    borderColor: '#4CAF50',
                    backgroundColor: 'rgba(76, 175, 80, 0.1)',
                    borderWidth: 3,
                    fill: false,
                    tension: 0.4,
                    pointBackgroundColor: '#4CAF50',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 6,
                    pointHoverRadius: 8
                },
                {
                    label: '支出',
                    data: expensesData,
                    borderColor: '#f44336',
                    backgroundColor: 'rgba(244, 67, 54, 0.1)',
                    borderWidth: 3,
                    fill: false,
                    tension: 0.4,
                    pointBackgroundColor: '#f44336',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 6,
                    pointHoverRadius: 8
                },
                {
                    label: '利益/赤字',
                    data: profitData,
                    borderColor: '#2196F3',
                    backgroundColor: 'rgba(33, 150, 243, 0.1)',
                    borderWidth: 3,
                    fill: false,
                    tension: 0.4,
                    pointBackgroundColor: profitData.map(profit => profit >= 0 ? '#2196F3' : '#FF5722'),
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 6,
                    pointHoverRadius: 8
                }
            ]
        };

        const config = {
            type: 'line',
            data: chartData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false,
                },
                plugins: {
                    title: {
                        display: true,
                        text: `${yearlyData.year}年 月別収支推移`,
                        font: {
                            size: 16,
                            weight: 'bold'
                        }
                    },
                    legend: {
                        position: 'top',
                        labels: {
                            usePointStyle: true,
                            padding: 20
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#fff',
                        bodyColor: '#fff',
                        borderColor: '#fff',
                        borderWidth: 1,
                        callbacks: {
                            title: function(context) {
                                return `${yearlyData.year}年${context[0].label}`;
                            },
                            label: function(context) {
                                const label = context.dataset.label || '';
                                const value = context.parsed.y;
                                return `${label}: ${value.toLocaleString()}円`;
                            },
                            afterBody: function(context) {
                                const monthIndex = context[0].dataIndex;
                                const monthData = monthlyResults[monthIndex];
                                const profitMargin = monthData.profitMargin.toFixed(1);
                                return [`利益率: ${profitMargin}%`];
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        display: true,
                        title: {
                            display: true,
                            text: '月'
                        },
                        grid: {
                            display: true,
                            color: 'rgba(0, 0, 0, 0.1)'
                        }
                    },
                    y: {
                        display: true,
                        title: {
                            display: true,
                            text: '金額（円）'
                        },
                        beginAtZero: true,
                        grid: {
                            display: true,
                            color: 'rgba(0, 0, 0, 0.1)'
                        },
                        ticks: {
                            callback: function(value) {
                                return value.toLocaleString() + '円';
                            }
                        }
                    }
                },
                elements: {
                    point: {
                        hoverBorderWidth: 3
                    }
                }
            }
        };

        this.charts['yearlyTrendChart'] = new Chart(ctx, config);
    }

    /**
     * 年間比較棒グラフの描画
     */
    renderYearlyComparisonChart(yearlyData) {
        const canvas = document.getElementById('yearlyComparisonChart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const monthlyResults = yearlyData.monthlyResults;

        // 月ラベルの生成
        const monthLabels = monthlyResults.map(month => `${month.month}月`);
        
        // 利益/赤字データの準備（正の値は利益、負の値は赤字として表示）
        const profitData = monthlyResults.map(month => month.profit >= 0 ? month.profit : 0);
        const deficitData = monthlyResults.map(month => month.profit < 0 ? Math.abs(month.profit) : 0);

        const chartData = {
            labels: monthLabels,
            datasets: [
                {
                    label: '利益',
                    data: profitData,
                    backgroundColor: '#4CAF50',
                    borderColor: '#45a049',
                    borderWidth: 1
                },
                {
                    label: '赤字',
                    data: deficitData,
                    backgroundColor: '#f44336',
                    borderColor: '#da190b',
                    borderWidth: 1
                }
            ]
        };

        const config = {
            type: 'bar',
            data: chartData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false,
                },
                plugins: {
                    title: {
                        display: true,
                        text: `${yearlyData.year}年 月別利益・赤字比較`,
                        font: {
                            size: 16,
                            weight: 'bold'
                        }
                    },
                    legend: {
                        position: 'top',
                        labels: {
                            usePointStyle: true,
                            padding: 20
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#fff',
                        bodyColor: '#fff',
                        borderColor: '#fff',
                        borderWidth: 1,
                        callbacks: {
                            title: function(context) {
                                return `${yearlyData.year}年${context[0].label}`;
                            },
                            label: function(context) {
                                const label = context.dataset.label || '';
                                const value = context.parsed.y;
                                if (value === 0) return null;
                                return `${label}: ${value.toLocaleString()}円`;
                            },
                            afterBody: function(context) {
                                const monthIndex = context[0].dataIndex;
                                const monthData = monthlyResults[monthIndex];
                                const profitMargin = monthData.profitMargin.toFixed(1);
                                const status = monthData.isDeficit ? '赤字' : '黒字';
                                return [`利益率: ${profitMargin}%`, `状況: ${status}`];
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        display: true,
                        title: {
                            display: true,
                            text: '月'
                        },
                        grid: {
                            display: true,
                            color: 'rgba(0, 0, 0, 0.1)'
                        }
                    },
                    y: {
                        display: true,
                        title: {
                            display: true,
                            text: '金額（円）'
                        },
                        beginAtZero: true,
                        grid: {
                            display: true,
                            color: 'rgba(0, 0, 0, 0.1)'
                        },
                        ticks: {
                            callback: function(value) {
                                return value.toLocaleString() + '円';
                            }
                        }
                    }
                },
                onHover: (event, activeElements) => {
                    event.native.target.style.cursor = activeElements.length > 0 ? 'pointer' : 'default';
                },
                onClick: (event, activeElements) => {
                    if (activeElements.length > 0) {
                        const monthIndex = activeElements[0].index;
                        const monthData = monthlyResults[monthIndex];
                        // 月別詳細表示（オプション機能）
                        console.log(`${monthData.year}年${monthData.month}月の詳細:`, monthData);
                    }
                }
            }
        };

        this.charts['yearlyComparisonChart'] = new Chart(ctx, config);
    }

    /**
     * グラフ更新
     */
    updateChart(chartId, data) {
        // 実装は後のタスクで行う
        console.log(`グラフ ${chartId} を更新します`);
    }

    /**
     * グラフ削除
     */
    destroyChart(chartId) {
        if (this.charts[chartId]) {
            this.charts[chartId].destroy();
            delete this.charts[chartId];
        }
    }

    /**
     * 全グラフ削除
     */
    destroyAllCharts() {
        for (const chartId in this.charts) {
            this.destroyChart(chartId);
        }
    }

    /**
     * 月別収支計算ロジック（拡張版）
     * 全カテゴリーのデータを集計して月別収支を計算し、利益計算と赤字警告表示機能を提供
     */
    calculateMonthlyBalance(year, month) {
        const monthlyData = this.dataManager.getRecordsByMonth(year, month);
        
        // 収入計算
        const totalSales = monthlyData.sales.reduce((sum, record) => sum + (record.amount || 0), 0);
        
        // 支出計算
        const totalPurchases = monthlyData.purchases.reduce((sum, record) => sum + (record.amount || 0), 0);
        const totalFixedCosts = monthlyData.fixedCosts.reduce((sum, record) => sum + (record.amount || 0), 0);
        const totalVariableCosts = monthlyData.variableCosts.reduce((sum, record) => sum + (record.amount || 0), 0);
        const totalLaborCosts = monthlyData.laborCosts.reduce((sum, record) => sum + (record.amount || 0), 0);
        const totalConsumptionTax = monthlyData.consumptionTax.reduce((sum, record) => sum + (record.amount || 0), 0);
        const totalMonthlyPayments = monthlyData.monthlyPayments.reduce((sum, record) => sum + (record.amount || 0), 0);
        const totalManufacturerDeposits = monthlyData.manufacturerDeposits.reduce((sum, record) => sum + (record.amount || 0), 0);
        
        const totalExpenses = totalPurchases + totalFixedCosts + totalVariableCosts + totalLaborCosts + 
                             totalConsumptionTax + totalMonthlyPayments + totalManufacturerDeposits;
        
        const grossProfit = totalSales - totalPurchases;

        // 利益計算
        const profit = grossProfit - (totalExpenses - totalPurchases);
        const profitMargin = totalSales > 0 ? (profit / totalSales) * 100 : 0;
        
        // 赤字警告判定
        const isDeficit = profit < 0;
        const deficitWarning = this.generateDeficitWarning(profit, totalSales, totalExpenses);
        
        // カテゴリー別内訳（パーセンテージ計算）
        const categoryBreakdown = this.calculateCategoryBreakdown({
            purchases: totalPurchases,
            fixedCosts: totalFixedCosts,
            variableCosts: totalVariableCosts,
            laborCosts: totalLaborCosts,
            consumptionTax: totalConsumptionTax,
            monthlyPayments: totalMonthlyPayments,
            manufacturerDeposits: totalManufacturerDeposits
        }, grossProfit); // 粗利を基準に変更
        
        return {
            year: year,
            month: month,
            // 収入
            sales: totalSales,
            grossProfit: grossProfit, // 粗利を追加
            // 支出詳細
            purchases: totalPurchases,
            fixedCosts: totalFixedCosts,
            variableCosts: totalVariableCosts,
            laborCosts: totalLaborCosts,
            consumptionTax: totalConsumptionTax,
            monthlyPayments: totalMonthlyPayments,
            manufacturerDeposits: totalManufacturerDeposits,
            totalExpenses: totalExpenses,
            // 利益関連
            profit: profit,
            profitMargin: profitMargin,
            isDeficit: isDeficit,
            deficitWarning: deficitWarning,
            // 内訳
            categoryBreakdown: categoryBreakdown,
            // レコード数
            recordCounts: this.getRecordCounts(monthlyData)
        };
    }

    /**
     * 赤字警告メッセージ生成
     */
    generateDeficitWarning(profit, totalSales, totalExpenses) {
        if (profit >= 0) {
            return null;
        }
        
        const deficitAmount = Math.abs(profit);
        const deficitPercentage = totalSales > 0 ? (deficitAmount / totalSales) * 100 : 100;
        
        let severity = 'low';
        let message = '';
        
        if (deficitPercentage > 50) {
            severity = 'high';
            message = `深刻な赤字状況です。支出が売上を大幅に上回っています（赤字額: ${deficitAmount.toLocaleString()}円）`;
        } else if (deficitPercentage > 20) {
            severity = 'medium';
            message = `注意が必要な赤字状況です（赤字額: ${deficitAmount.toLocaleString()}円）`;
        } else {
            severity = 'low';
            message = `軽微な赤字です（赤字額: ${deficitAmount.toLocaleString()}円）`;
        }
        
        return {
            severity: severity,
            message: message,
            deficitAmount: deficitAmount,
            deficitPercentage: deficitPercentage,
            recommendations: this.generateDeficitRecommendations(totalSales, totalExpenses)
        };
    }

    /**
     * 赤字改善の推奨事項生成
     */
    generateDeficitRecommendations(totalSales, totalExpenses) {
        const recommendations = [];
        
        if (totalSales === 0) {
            recommendations.push('売上の向上が最優先です');
        } else if (totalSales < totalExpenses * 0.8) {
            recommendations.push('売上の大幅な向上が必要です');
            recommendations.push('支出の見直しも併せて検討してください');
        } else {
            recommendations.push('支出の削減を検討してください');
            recommendations.push('売上向上の施策も併せて実施することをお勧めします');
        }
        
        return recommendations;
    }

    /**
     * カテゴリー別支出内訳計算
     */
    calculateCategoryBreakdown(expenses, grossProfit) {
        if (grossProfit <= 0) { // 粗利が0以下の場合は0を返す
            const breakdown = {};
            for (const category in expenses) {
                breakdown[category] = { amount: expenses[category], percentage: 0 };
            }
            return breakdown;
        }
        
        const breakdown = {};
        for (const [category, amount] of Object.entries(expenses)) {
            breakdown[category] = {
                amount: amount,
                percentage: (amount / grossProfit) * 100
            };
        }
        
        return breakdown;
    }

    /**
     * 各カテゴリーのレコード数取得
     */
    getRecordCounts(monthlyData) {
        const counts = {};
        for (const [category, records] of Object.entries(monthlyData)) {
            counts[category] = records.length;
        }
        return counts;
    }

    /**
     * 複数月の収支計算（年間推移用）
     */
    calculateMultipleMonthsBalance(startYear, startMonth, endYear, endMonth) {
        const results = [];
        
        let currentYear = startYear;
        let currentMonth = startMonth;
        
        while (currentYear < endYear || (currentYear === endYear && currentMonth <= endMonth)) {
            const monthlyBalance = this.calculateMonthlyBalance(currentYear, currentMonth);
            results.push(monthlyBalance);
            
            currentMonth++;
            if (currentMonth > 12) {
                currentMonth = 1;
                currentYear++;
            }
        }
        
        return results;
    }

    /**
     * 年間収支サマリー計算
     */
    calculateYearlyBalance(year) {
        const yearlyResults = this.calculateMultipleMonthsBalance(year, 1, year, 12);
        
        const totalSales = yearlyResults.reduce((sum, month) => sum + month.sales, 0);
        const totalExpenses = yearlyResults.reduce((sum, month) => sum + month.totalExpenses, 0);
        const totalProfit = totalSales - totalExpenses;
        
        const deficitMonths = yearlyResults.filter(month => month.isDeficit);
        const profitableMonths = yearlyResults.filter(month => !month.isDeficit);
        
        return {
            year: year,
            totalSales: totalSales,
            totalExpenses: totalExpenses,
            totalProfit: totalProfit,
            averageMonthlyProfit: totalProfit / 12,
            deficitMonthsCount: deficitMonths.length,
            profitableMonthsCount: profitableMonths.length,
            monthlyResults: yearlyResults,
            yearlyProfitMargin: totalSales > 0 ? (totalProfit / totalSales) * 100 : 0
        };
    }
}