// 人件費・その他費用のバリデーションテスト

// テスト用のDataManagerインスタンス
const testDataManager = new DataManager();

// 人件費のバリデーションテスト
function testLaborCostsValidation() {
    console.log('=== 人件費バリデーションテスト開始 ===');
    
    // 正常なデータ
    const validData = {
        year: 2024,
        month: 3,
        amount: 150000,
        note: '正社員給与'
    };
    
    const validResult = testDataManager.validateRecord('laborCosts', validData);
    console.log('正常データ:', validResult.isValid ? '✓ 通過' : '✗ 失敗', validResult.errors);
    
    // 必須項目不足（年）
    const missingYear = {
        month: 3,
        amount: 150000,
        note: '正社員給与'
    };
    
    const missingYearResult = testDataManager.validateRecord('laborCosts', missingYear);
    console.log('年不足:', missingYearResult.isValid ? '✗ 失敗' : '✓ 通過', missingYearResult.errors);
    
    // 必須項目不足（月）
    const missingMonth = {
        year: 2024,
        amount: 150000,
        note: '正社員給与'
    };
    
    const missingMonthResult = testDataManager.validateRecord('laborCosts', missingMonth);
    console.log('月不足:', missingMonthResult.isValid ? '✗ 失敗' : '✓ 通過', missingMonthResult.errors);
    
    // 必須項目不足（金額）
    const missingAmount = {
        year: 2024,
        month: 3,
        note: '正社員給与'
    };
    
    const missingAmountResult = testDataManager.validateRecord('laborCosts', missingAmount);
    console.log('金額不足:', missingAmountResult.isValid ? '✗ 失敗' : '✓ 通過', missingAmountResult.errors);
    
    // 不正な年
    const invalidYear = {
        year: 1999,
        month: 3,
        amount: 150000,
        note: '正社員給与'
    };
    
    const invalidYearResult = testDataManager.validateRecord('laborCosts', invalidYear);
    console.log('不正な年:', invalidYearResult.isValid ? '✗ 失敗' : '✓ 通過', invalidYearResult.errors);
    
    // 不正な月
    const invalidMonth = {
        year: 2024,
        month: 13,
        amount: 150000,
        note: '正社員給与'
    };
    
    const invalidMonthResult = testDataManager.validateRecord('laborCosts', invalidMonth);
    console.log('不正な月:', invalidMonthResult.isValid ? '✗ 失敗' : '✓ 通過', invalidMonthResult.errors);
    
    // 負の金額
    const negativeAmount = {
        year: 2024,
        month: 3,
        amount: -1000,
        note: '正社員給与'
    };
    
    const negativeAmountResult = testDataManager.validateRecord('laborCosts', negativeAmount);
    console.log('負の金額:', negativeAmountResult.isValid ? '✗ 失敗' : '✓ 通過', negativeAmountResult.errors);
    
    // 長すぎる備考
    const longNote = {
        year: 2024,
        month: 3,
        amount: 150000,
        note: 'a'.repeat(201) // 201文字
    };
    
    const longNoteResult = testDataManager.validateRecord('laborCosts', longNote);
    console.log('長すぎる備考:', longNoteResult.isValid ? '✗ 失敗' : '✓ 通過', longNoteResult.errors);
    
    console.log('=== 人件費バリデーションテスト終了 ===\n');
}

// その他費用のバリデーションテスト
function testOtherExpensesValidation() {
    console.log('=== その他費用バリデーションテスト開始 ===');
    
    // 正常なデータ
    const validData = {
        year: 2024,
        month: 3,
        category: '広告費',
        amount: 50000,
        note: 'チラシ印刷費'
    };
    
    const validResult = testDataManager.validateRecord('otherExpenses', validData);
    console.log('正常データ:', validResult.isValid ? '✓ 通過' : '✗ 失敗', validResult.errors);
    
    // 必須項目不足（カテゴリー）
    const missingCategory = {
        year: 2024,
        month: 3,
        amount: 50000,
        note: 'チラシ印刷費'
    };
    
    const missingCategoryResult = testDataManager.validateRecord('otherExpenses', missingCategory);
    console.log('カテゴリー不足:', missingCategoryResult.isValid ? '✗ 失敗' : '✓ 通過', missingCategoryResult.errors);
    
    // 必須項目不足（年）
    const missingYear = {
        month: 3,
        category: '広告費',
        amount: 50000,
        note: 'チラシ印刷費'
    };
    
    const missingYearResult = testDataManager.validateRecord('otherExpenses', missingYear);
    console.log('年不足:', missingYearResult.isValid ? '✗ 失敗' : '✓ 通過', missingYearResult.errors);
    
    // 必須項目不足（月）
    const missingMonth = {
        year: 2024,
        category: '広告費',
        amount: 50000,
        note: 'チラシ印刷費'
    };
    
    const missingMonthResult = testDataManager.validateRecord('otherExpenses', missingMonth);
    console.log('月不足:', missingMonthResult.isValid ? '✗ 失敗' : '✓ 通過', missingMonthResult.errors);
    
    // 必須項目不足（金額）
    const missingAmount = {
        year: 2024,
        month: 3,
        category: '広告費',
        note: 'チラシ印刷費'
    };
    
    const missingAmountResult = testDataManager.validateRecord('otherExpenses', missingAmount);
    console.log('金額不足:', missingAmountResult.isValid ? '✗ 失敗' : '✓ 通過', missingAmountResult.errors);
    
    console.log('=== その他費用バリデーションテスト終了 ===\n');
}

// CRUD操作のテスト
function testCRUDOperations() {
    console.log('=== CRUD操作テスト開始 ===');
    
    try {
        // 人件費データの追加
        const laborCostData = {
            year: 2024,
            month: 3,
            amount: 200000,
            note: 'テスト人件費'
        };
        
        const addedLaborCost = testDataManager.addRecord('laborCosts', laborCostData);
        console.log('人件費追加:', addedLaborCost ? '✓ 成功' : '✗ 失敗');
        
        // その他費用データの追加
        const otherExpenseData = {
            year: 2024,
            month: 3,
            category: '交通費',
            amount: 30000,
            note: 'テストその他費用'
        };
        
        const addedOtherExpense = testDataManager.addRecord('otherExpenses', otherExpenseData);
        console.log('その他費用追加:', addedOtherExpense ? '✓ 成功' : '✗ 失敗');
        
        // データの取得
        const laborCosts = testDataManager.getDataByCategory('laborCosts');
        const otherExpenses = testDataManager.getDataByCategory('otherExpenses');
        
        console.log('人件費データ取得:', laborCosts.length > 0 ? '✓ 成功' : '✗ 失敗');
        console.log('その他費用データ取得:', otherExpenses.length > 0 ? '✓ 成功' : '✗ 失敗');
        
        // データの更新
        if (addedLaborCost) {
            const updatedLaborCost = testDataManager.updateRecord('laborCosts', addedLaborCost.id, {
                amount: 250000,
                note: '更新されたテスト人件費'
            });
            console.log('人件費更新:', updatedLaborCost ? '✓ 成功' : '✗ 失敗');
        }
        
        if (addedOtherExpense) {
            const updatedOtherExpense = testDataManager.updateRecord('otherExpenses', addedOtherExpense.id, {
                amount: 35000,
                note: '更新されたテストその他費用'
            });
            console.log('その他費用更新:', updatedOtherExpense ? '✓ 成功' : '✗ 失敗');
        }
        
        // データの削除
        if (addedLaborCost) {
            const deletedLaborCost = testDataManager.deleteRecord('laborCosts', addedLaborCost.id);
            console.log('人件費削除:', deletedLaborCost ? '✓ 成功' : '✗ 失敗');
        }
        
        if (addedOtherExpense) {
            const deletedOtherExpense = testDataManager.deleteRecord('otherExpenses', addedOtherExpense.id);
            console.log('その他費用削除:', deletedOtherExpense ? '✓ 成功' : '✗ 失敗');
        }
        
    } catch (error) {
        console.error('CRUD操作エラー:', error);
    }
    
    console.log('=== CRUD操作テスト終了 ===\n');
}

// 全テストの実行
function runAllTests() {
    console.log('人件費・その他費用の機能テストを開始します...\n');
    
    testLaborCostsValidation();
    testOtherExpensesValidation();
    testCRUDOperations();
    
    console.log('全テストが完了しました。');
}

// テスト実行
if (typeof module !== 'undefined' && module.exports) {
    // Node.js環境
    module.exports = {
        testLaborCostsValidation,
        testOtherExpensesValidation,
        testCRUDOperations,
        runAllTests
    };
} else {
    // ブラウザ環境
    window.testLaborCostsValidation = testLaborCostsValidation;
    window.testOtherExpensesValidation = testOtherExpensesValidation;
    window.testCRUDOperations = testCRUDOperations;
    window.runAllTests = runAllTests;
}