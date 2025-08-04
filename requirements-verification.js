// 要件4.1, 4.2, 4.4の検証テスト

function verifyRequirement41() {
    console.log('=== 要件4.1検証: 月別人件費を入力する ===');
    
    try {
        const dataManager = new DataManager();
        
        // 人件費データの入力テスト
        const laborCostData = {
            year: 2024,
            month: 3,
            amount: 180000,
            note: '正社員給与 - 3月分'
        };
        
        const result = dataManager.addRecord('laborCosts', laborCostData);
        
        // 記録されたデータの確認
        const savedData = dataManager.getRecordById('laborCosts', result.id);
        
        const isValid = (
            savedData.year === 2024 &&
            savedData.month === 3 &&
            savedData.amount === 180000 &&
            savedData.note === '正社員給与 - 3月分'
        );
        
        console.log('要件4.1:', isValid ? '✓ 満たしている' : '✗ 満たしていない');
        console.log('記録されたデータ:', savedData);
        
        return isValid;
        
    } catch (error) {
        console.error('要件4.1検証エラー:', error);
        return false;
    }
}

function verifyRequirement42() {
    console.log('=== 要件4.2検証: 月別その他費用を入力する ===');
    
    try {
        const dataManager = new DataManager();
        
        // その他費用データの入力テスト
        const otherExpenseData = {
            year: 2024,
            month: 3,
            category: '広告費',
            amount: 45000,
            note: 'チラシ印刷・配布費用'
        };
        
        const result = dataManager.addRecord('otherExpenses', otherExpenseData);
        
        // 記録されたデータの確認
        const savedData = dataManager.getRecordById('otherExpenses', result.id);
        
        const isValid = (
            savedData.year === 2024 &&
            savedData.month === 3 &&
            savedData.category === '広告費' &&
            savedData.amount === 45000 &&
            savedData.note === 'チラシ印刷・配布費用'
        );
        
        console.log('要件4.2:', isValid ? '✓ 満たしている' : '✗ 満たしていない');
        console.log('記録されたデータ:', savedData);
        
        return isValid;
        
    } catch (error) {
        console.error('要件4.2検証エラー:', error);
        return false;
    }
}

function verifyRequirement44() {
    console.log('=== 要件4.4検証: 費用データに不備がある場合のエラーメッセージ表示 ===');
    
    try {
        const dataManager = new DataManager();
        let errorCount = 0;
        
        // 人件費の不正データテスト
        const invalidLaborCostData = [
            { month: 3, amount: 180000, note: '年が不足' },
            { year: 2024, amount: 180000, note: '月が不足' },
            { year: 2024, month: 3, note: '金額が不足' },
            { year: 1999, month: 3, amount: 180000, note: '不正な年' },
            { year: 2024, month: 13, amount: 180000, note: '不正な月' },
            { year: 2024, month: 3, amount: -1000, note: '負の金額' }
        ];
        
        for (const data of invalidLaborCostData) {
            try {
                dataManager.addRecord('laborCosts', data);
                console.log('✗ エラーが検出されませんでした:', data);
            } catch (error) {
                console.log('✓ 適切にエラーが検出されました:', error.message);
                errorCount++;
            }
        }
        
        // その他費用の不正データテスト
        const invalidOtherExpenseData = [
            { year: 2024, month: 3, amount: 45000, note: 'カテゴリーが不足' },
            { month: 3, category: '広告費', amount: 45000, note: '年が不足' },
            { year: 2024, category: '広告費', amount: 45000, note: '月が不足' },
            { year: 2024, month: 3, category: '広告費', note: '金額が不足' }
        ];
        
        for (const data of invalidOtherExpenseData) {
            try {
                dataManager.addRecord('otherExpenses', data);
                console.log('✗ エラーが検出されませんでした:', data);
            } catch (error) {
                console.log('✓ 適切にエラーが検出されました:', error.message);
                errorCount++;
            }
        }
        
        const expectedErrors = invalidLaborCostData.length + invalidOtherExpenseData.length;
        const isValid = errorCount === expectedErrors;
        
        console.log('要件4.4:', isValid ? '✓ 満たしている' : '✗ 満たしていない');
        console.log(`検出されたエラー数: ${errorCount}/${expectedErrors}`);
        
        return isValid;
        
    } catch (error) {
        console.error('要件4.4検証エラー:', error);
        return false;
    }
}

function verifyUIForms() {
    console.log('=== UI フォーム機能検証 ===');
    
    try {
        // UIManagerの初期化をシミュレート
        const dataManager = new DataManager();
        const uiManager = new UIManager(dataManager);
        
        // 人件費フォームの生成テスト
        const laborCostForm = uiManager.generateInputForm('laborCosts');
        const hasLaborCostFields = (
            laborCostForm.includes('id="year"') &&
            laborCostForm.includes('id="month"') &&
            laborCostForm.includes('id="amount"') &&
            laborCostForm.includes('id="note"') &&
            !laborCostForm.includes('id="category"') // 人件費にはカテゴリーフィールドがない
        );
        
        console.log('人件費フォーム:', hasLaborCostFields ? '✓ 正常' : '✗ 異常');
        
        // その他費用フォームの生成テスト
        const otherExpenseForm = uiManager.generateInputForm('otherExpenses');
        const hasOtherExpenseFields = (
            otherExpenseForm.includes('id="year"') &&
            otherExpenseForm.includes('id="month"') &&
            otherExpenseForm.includes('id="amount"') &&
            otherExpenseForm.includes('id="note"') &&
            otherExpenseForm.includes('id="category"') // その他費用にはカテゴリーフィールドがある
        );
        
        console.log('その他費用フォーム:', hasOtherExpenseFields ? '✓ 正常' : '✗ 異常');
        
        return hasLaborCostFields && hasOtherExpenseFields;
        
    } catch (error) {
        console.error('UIフォーム検証エラー:', error);
        return false;
    }
}

function runRequirementsVerification() {
    console.log('人件費・その他費用管理の要件検証を開始します...\n');
    
    const results = {
        requirement41: verifyRequirement41(),
        requirement42: verifyRequirement42(),
        requirement44: verifyRequirement44(),
        uiForms: verifyUIForms()
    };
    
    console.log('\n=== 検証結果サマリー ===');
    console.log('要件4.1 (人件費入力):', results.requirement41 ? '✓ 合格' : '✗ 不合格');
    console.log('要件4.2 (その他費用入力):', results.requirement42 ? '✓ 合格' : '✗ 不合格');
    console.log('要件4.4 (エラーハンドリング):', results.requirement44 ? '✓ 合格' : '✗ 不合格');
    console.log('UIフォーム機能:', results.uiForms ? '✓ 合格' : '✗ 不合格');
    
    const allPassed = Object.values(results).every(result => result === true);
    console.log('\n総合結果:', allPassed ? '✓ 全要件を満たしています' : '✗ 一部要件を満たしていません');
    
    return results;
}

// ブラウザ環境での実行
if (typeof window !== 'undefined') {
    window.verifyRequirement41 = verifyRequirement41;
    window.verifyRequirement42 = verifyRequirement42;
    window.verifyRequirement44 = verifyRequirement44;
    window.verifyUIForms = verifyUIForms;
    window.runRequirementsVerification = runRequirementsVerification;
}