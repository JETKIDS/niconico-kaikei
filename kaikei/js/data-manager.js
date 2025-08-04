/**
 * データモデル定義とバリデーション機能
 */
class DataModels {
    /**
     * データ構造の定義
     */
    static getDataStructure() {
        return {
            sales: [],
            purchases: [],
            fixedCosts: [],
            variableCosts: [], // 変動費を追加
            laborCosts: [],
            consumptionTax: [],
            monthlyPayments: [],
            manufacturerDeposits: []
        };
    }

    /**
     * 各カテゴリーのフィールド定義
     */
    static getFieldDefinitions() {
        return {
            sales: {
                required: ['year', 'month', 'amount'],
                optional: ['note'],
                types: {
                    year: 'number',
                    month: 'number',
                    amount: 'number',
                    note: 'string'
                }
            },
            purchases: {
                required: ['year', 'month', 'amount'],
                optional: ['manufacturer', 'note'],
                types: {
                    year: 'number',
                    month: 'number',
                    amount: 'number',
                    manufacturer: 'string',
                    note: 'string'
                }
            },
            fixedCosts: {
                required: ['year', 'month', 'category', 'amount'],
                optional: ['note'],
                types: {
                    year: 'number',
                    month: 'number',
                    category: 'string',
                    amount: 'number',
                    note: 'string'
                }
            },
            variableCosts: { // 変動費の定義を追加
                required: ['year', 'month', 'category', 'amount'],
                optional: ['note'],
                types: {
                    year: 'number',
                    month: 'number',
                    category: 'string',
                    amount: 'number',
                    note: 'string'
                }
            },
            laborCosts: {
                required: ['year', 'month', 'amount'],
                optional: ['note'],
                types: {
                    year: 'number',
                    month: 'number',
                    amount: 'number',
                    note: 'string'
                }
            },
            consumptionTax: {
                required: ['year', 'month', 'amount'],
                optional: ['note'],
                types: {
                    year: 'number',
                    month: 'number',
                    amount: 'number',
                    note: 'string'
                }
            },
            monthlyPayments: {
                required: ['year', 'month', 'amount', 'payee'],
                optional: ['note'],
                types: {
                    year: 'number',
                    month: 'number',
                    amount: 'number',
                    payee: 'string',
                    note: 'string'
                }
            },
            manufacturerDeposits: {
                required: ['year', 'month', 'amount', 'manufacturer'],
                optional: ['note'],
                types: {
                    year: 'number',
                    month: 'number',
                    amount: 'number',
                    manufacturer: 'string',
                    note: 'string'
                }
            }
        };
    }
}

/**
 * バリデーション機能クラス
 */
class DataValidator {
    /**
     * データの妥当性チェック
     */
    static validateRecord(category, data) {
        const errors = [];
        const fieldDefs = DataModels.getFieldDefinitions()[category];
        
        if (!fieldDefs) {
            errors.push(`無効なカテゴリー: ${category}`);
            return { isValid: false, errors };
        }

        // 必須フィールドのチェック
        for (const field of fieldDefs.required) {
            if (data[field] === undefined || data[field] === null || data[field] === '') {
                errors.push(`${field}は必須項目です`);
            }
        }

        // データ型のチェック
        for (const field in data) {
            if (data[field] !== undefined && data[field] !== null && data[field] !== '') {
                const expectedType = fieldDefs.types[field];
                if (expectedType && !this.validateType(data[field], expectedType)) {
                    errors.push(`${field}の形式が正しくありません`);
                }
            }
        }

        // 年月の範囲チェック
        if (data.year !== undefined) {
            const yearError = this.validateYear(data.year);
            if (yearError) errors.push(yearError);
        }

        if (data.month !== undefined) {
            const monthError = this.validateMonth(data.month);
            if (monthError) errors.push(monthError);
        }

        // 金額の範囲チェック
        if (data.amount !== undefined) {
            const amountError = this.validateAmount(data.amount);
            if (amountError) errors.push(amountError);
        }

        // 備考の文字数チェック
        if (data.note !== undefined) {
            const noteError = this.validateNote(data.note);
            if (noteError) errors.push(noteError);
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * データ型チェック
     */
    static validateType(value, expectedType) {
        switch (expectedType) {
            case 'number':
                return !isNaN(value) && isFinite(value);
            case 'string':
                return typeof value === 'string';
            default:
                return true;
        }
    }

    /**
     * 年の妥当性チェック
     */
    static validateYear(year) {
        const numYear = Number(year);
        if (isNaN(numYear) || numYear < 2000 || numYear > 2100) {
            return '年は2000年から2100年の間で入力してください';
        }
        return null;
    }

    /**
     * 月の妥当性チェック
     */
    static validateMonth(month) {
        const numMonth = Number(month);
        if (isNaN(numMonth) || numMonth < 1 || numMonth > 12) {
            return '月は1から12の間で入力してください';
        }
        return null;
    }

    /**
     * 金額の妥当性チェック
     */
    static validateAmount(amount) {
        const numAmount = Number(amount);
        if (isNaN(numAmount) || numAmount < 0) {
            return '金額は0以上の数値で入力してください';
        }
        if (numAmount > 999999999) {
            return '金額は999,999,999円以下で入力してください';
        }
        return null;
    }

    /**
     * 備考の妥当性チェック
     */
    static validateNote(note) {
        if (typeof note !== 'string') {
            return '備考は文字列で入力してください';
        }
        if (note.length > 200) {
            return '備考は200文字以内で入力してください';
        }
        return null;
    }

    /**
     * データ整合性チェック
     */
    static validateDataIntegrity(data) {
        const errors = [];
        
        // データ構造の確認
        const expectedStructure = DataModels.getDataStructure();
        for (const category in expectedStructure) {
            if (!Array.isArray(data[category])) {
                errors.push(`${category}は配列である必要があります`);
            }
        }

        // 各レコードのIDの重複チェック
        const allIds = new Set();
        for (const category in data) {
            if (Array.isArray(data[category])) {
                for (const record of data[category]) {
                    if (record.id) {
                        if (allIds.has(record.id)) {
                            errors.push(`重複するID: ${record.id}`);
                        }
                        allIds.add(record.id);
                    }
                }
            }
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }
}

/**
 * UUID生成ユーティリティ
 */
class UUIDGenerator {
    /**
     * UUID v4 生成
     */
    static generate() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    /**
     * UUIDの妥当性チェック
     */
    static isValid(uuid) {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        return uuidRegex.test(uuid);
    }
}

/**
 * データ管理クラス
 * 全データのCRUD操作とファイル入出力を担当
 */
class DataManager {
    constructor() {
        this.data = DataModels.getDataStructure();
        this.fileName = 'kaikei-data.json';
        this.saveRetryCount = 0;
        this.maxRetryCount = 3;
        this.hasUnsavedChanges = false;
        this.lastSaveTime = null;
    }

    /**
     * データファイルの読み込み
     */
    async loadData() {
        return this.safeOperation(async () => {
            // ローカルストレージからデータを読み込み
            const savedData = localStorage.getItem(this.fileName);
            if (savedData) {
                const parsedData = JSON.parse(savedData);
                
                // データ整合性チェック
                const validation = DataValidator.validateDataIntegrity(parsedData);
                if (!validation.isValid) {
                    console.warn('データ整合性エラー:', validation.errors);
                    
                    // 自動バックアップを作成してから修復を試みる
                    await this.autoBackup();
                    this.data = this.repairData(parsedData);
                    
                    // 修復後のデータを保存
                    await this.saveData();
                } else {
                    this.data = parsedData;
                }
                
                console.log('データを読み込みました');
                return true;
            } else {
                console.log('保存されたデータが見つかりません。新規データで開始します。');
                this.initializeDefaultData();
                return false;
            }
        }, 'データの読み込みに失敗しました').catch(error => {
            // 致命的エラーの場合はデフォルトデータで初期化
            console.error('データ読み込みの致命的エラー:', error);
            this.initializeDefaultData();
            return false;
        });
    }

    /**
     * 破損データの修復
     */
    repairData(data) {
        const repairedData = DataModels.getDataStructure();
        
        for (const category in repairedData) {
            if (Array.isArray(data[category])) {
                repairedData[category] = data[category].filter(record => {
                    // 基本的なレコード構造をチェック
                    return record && typeof record === 'object' && record.id;
                });
            }
        }
        
        return repairedData;
    }

    /**
     * データファイルの保存
     */
    async saveData(isRetry = false) {
        return this.safeOperation(async () => {
            // 保存前にデータ整合性をチェック
            const validation = DataValidator.validateDataIntegrity(this.data);
            if (!validation.isValid) {
                throw new Error(`保存データの整合性エラー: ${validation.errors.join(', ')}`);
            }
            
            const jsonData = JSON.stringify(this.data, null, 2);
            
            // ストレージ容量チェック
            if (jsonData.length > 5 * 1024 * 1024) { // 5MB制限
                console.warn('データサイズが大きすぎます。古いデータの削除を検討してください。');
            }
            
            try {
                // ブラウザ環境ではlocalStorageを使用
                localStorage.setItem(this.fileName, jsonData);
                
                // 保存成功時の処理
                this.saveRetryCount = 0;
                this.hasUnsavedChanges = false;
                this.lastSaveTime = new Date();
                
                // 定期的な自動バックアップ
                if (Math.random() < 0.1) { // 10%の確率で自動バックアップ
                    await this.autoBackup();
                }
                
                // 自動保存の状態を通知
                this.notifySaveStatus(true);
                console.log('データを保存しました');
                return true;
                
            } catch (storageError) {
                // ストレージエラーの場合
                if (storageError.name === 'QuotaExceededError') {
                    throw new Error('ストレージ容量が不足しています。不要なデータを削除してください。');
                }
                throw storageError;
            }
            
        }, 'データの保存に失敗しました').catch(async (error) => {
            this.saveRetryCount++;
            this.hasUnsavedChanges = true;
            
            // エラー詳細を含めて通知
            this.notifySaveStatus(false, error.message);
            
            // 自動再試行（最大回数まで）
            if (!isRetry && this.saveRetryCount <= this.maxRetryCount) {
                console.log(`保存に失敗しました。自動再試行中... (${this.saveRetryCount}/${this.maxRetryCount})`);
                
                // 少し待ってから再試行
                await new Promise(resolve => setTimeout(resolve, 1000 * this.saveRetryCount));
                
                try {
                    return await this.saveData(true);
                } catch (retryError) {
                    // 再試行も失敗した場合は手動再試行を提案
                    if (this.saveRetryCount >= this.maxRetryCount) {
                        this.offerManualRetry(error.message);
                    }
                    throw retryError;
                }
            } else {
                // 手動再試行を提案
                this.offerManualRetry(error.message);
                throw error;
            }
        });
    }

    /**
     * 手動再試行の提案
     */
    offerManualRetry(errorMessage) {
        const event = new CustomEvent('saveRetryRequired', {
            detail: {
                error: errorMessage,
                retryCount: this.saveRetryCount,
                hasUnsavedChanges: this.hasUnsavedChanges
            }
        });
        document.dispatchEvent(event);
    }

    /**
     * 手動保存再試行
     */
    async retrySave() {
        this.saveRetryCount = 0; // リセット
        return await this.saveData();
    }

    /**
     * 保存状態の通知
     */
    notifySaveStatus(success, error = null) {
        // UI側で保存状態を表示するためのイベント発火
        const event = new CustomEvent('dataSaveStatus', {
            detail: { 
                success, 
                timestamp: new Date(),
                error: error,
                recordCount: this.getTotalRecordCount()
            }
        });
        document.dispatchEvent(event);
    }

    /**
     * データ変更状態の通知
     */
    notifyDataChanged() {
        const event = new CustomEvent('dataChanged', {
            detail: { 
                timestamp: new Date(),
                hasUnsavedChanges: true
            }
        });
        document.dispatchEvent(event);
    }



    /**
     * レコード追加
     */
    addRecord(category, data) {
        if (!this.data[category]) {
            throw new Error(`無効なカテゴリー: ${category}`);
        }
        
        // データバリデーション
        const validation = DataValidator.validateRecord(category, data);
        if (!validation.isValid) {
            throw new Error(`バリデーションエラー: ${validation.errors.join(', ')}`);
        }
        
        const record = {
            id: UUIDGenerator.generate(),
            ...data,
            createdAt: new Date().toISOString()
        };
        
        this.data[category].push(record);
        this.hasUnsavedChanges = true;
        this.notifyDataChanged();
        this.saveData();
        return record;
    }

    /**
     * レコード更新
     */
    updateRecord(category, id, data) {
        if (!this.data[category]) {
            throw new Error(`無効なカテゴリー: ${category}`);
        }
        
        const index = this.data[category].findIndex(record => record.id === id);
        if (index === -1) {
            throw new Error(`レコードが見つかりません: ${id}`);
        }
        
        // 更新データのバリデーション
        const mergedData = { ...this.data[category][index], ...data };
        const validation = DataValidator.validateRecord(category, mergedData);
        if (!validation.isValid) {
            throw new Error(`バリデーションエラー: ${validation.errors.join(', ')}`);
        }
        
        this.data[category][index] = {
            ...this.data[category][index],
            ...data,
            updatedAt: new Date().toISOString()
        };
        
        this.hasUnsavedChanges = true;
        this.notifyDataChanged();
        this.saveData();
        return this.data[category][index];
    }

    /**
     * レコード削除
     */
    deleteRecord(category, id) {
        if (!this.data[category]) {
            throw new Error(`無効なカテゴリー: ${category}`);
        }
        
        const index = this.data[category].findIndex(record => record.id === id);
        if (index === -1) {
            throw new Error(`レコードが見つかりません: ${id}`);
        }
        
        this.data[category].splice(index, 1);
        this.hasUnsavedChanges = true;
        this.notifyDataChanged();
        this.saveData();
        return true;
    }

    /**
     * 月別データ取得
     */
    getRecordsByMonth(year, month) {
        const result = {};
        
        for (const category in this.data) {
            result[category] = this.data[category].filter(record => 
                record.year === year && record.month === month
            );
        }
        
        return result;
    }

    /**
     * 全データ取得
     */
    getAllData() {
        return this.data;
    }

    /**
     * カテゴリー別データ取得
     */
    getDataByCategory(category) {
        if (!this.data[category]) {
            throw new Error(`無効なカテゴリー: ${category}`);
        }
        return this.data[category];
    }

    /**
     * 特定のレコードを取得
     */
    getRecordById(category, id) {
        if (!this.data[category]) {
            throw new Error(`無効なカテゴリー: ${category}`);
        }
        
        const record = this.data[category].find(record => record.id === id);
        if (!record) {
            throw new Error(`レコードが見つかりません: ${id}`);
        }
        
        return record;
    }

    /**
     * 年別データ取得
     */
    getRecordsByYear(year) {
        const result = {};
        
        for (const category in this.data) {
            result[category] = this.data[category].filter(record => 
                record.year === year
            );
        }
        
        return result;
    }

    /**
     * 期間別データ取得
     */
    getRecordsByDateRange(startYear, startMonth, endYear, endMonth) {
        const result = {};
        
        for (const category in this.data) {
            result[category] = this.data[category].filter(record => {
                const recordDate = record.year * 100 + record.month;
                const startDate = startYear * 100 + startMonth;
                const endDate = endYear * 100 + endMonth;
                
                return recordDate >= startDate && recordDate <= endDate;
            });
        }
        
        return result;
    }

    /**
     * 複数レコードの一括追加
     */
    addMultipleRecords(category, records) {
        if (!this.data[category]) {
            throw new Error(`無効なカテゴリー: ${category}`);
        }
        
        const addedRecords = [];
        const errors = [];
        
        for (let i = 0; i < records.length; i++) {
            try {
                const validation = DataValidator.validateRecord(category, records[i]);
                if (!validation.isValid) {
                    errors.push(`レコード${i + 1}: ${validation.errors.join(', ')}`);
                    continue;
                }
                
                const record = {
                    id: UUIDGenerator.generate(),
                    ...records[i],
                    createdAt: new Date().toISOString()
                };
                
                this.data[category].push(record);
                addedRecords.push(record);
            } catch (error) {
                errors.push(`レコード${i + 1}: ${error.message}`);
            }
        }
        
        if (addedRecords.length > 0) {
            this.saveData();
        }
        
        return {
            success: addedRecords,
            errors: errors
        };
    }

    /**
     * 複数レコードの一括削除
     */
    deleteMultipleRecords(category, ids) {
        if (!this.data[category]) {
            throw new Error(`無効なカテゴリー: ${category}`);
        }
        
        const deletedIds = [];
        const errors = [];
        
        for (const id of ids) {
            const index = this.data[category].findIndex(record => record.id === id);
            if (index === -1) {
                errors.push(`レコードが見つかりません: ${id}`);
            } else {
                this.data[category].splice(index, 1);
                deletedIds.push(id);
            }
        }
        
        if (deletedIds.length > 0) {
            this.saveData();
        }
        
        return {
            deleted: deletedIds,
            errors: errors
        };
    }

    /**
     * データの統計情報取得
     */
    getDataStatistics() {
        const stats = {};
        
        for (const category in this.data) {
            stats[category] = {
                count: this.data[category].length,
                totalAmount: this.data[category].reduce((sum, record) => {
                    return sum + (record.amount || 0);
                }, 0),
                latestRecord: this.data[category].length > 0 ? 
                    this.data[category].reduce((latest, record) => {
                        const latestDate = new Date(latest.createdAt || 0);
                        const recordDate = new Date(record.createdAt || 0);
                        return recordDate > latestDate ? record : latest;
                    }) : null
            };
        }
        
        return stats;
    }

    /**
     * データの検索
     */
    searchRecords(searchTerm, categories = null) {
        const results = {};
        const searchCategories = categories || Object.keys(this.data);
        
        for (const category of searchCategories) {
            if (!this.data[category]) continue;
            
            results[category] = this.data[category].filter(record => {
                const searchableFields = ['note', 'category', 'payee', 'manufacturer'];
                return searchableFields.some(field => {
                    if (record[field] && typeof record[field] === 'string') {
                        return record[field].toLowerCase().includes(searchTerm.toLowerCase());
                    }
                    return false;
                });
            });
        }
        
        return results;
    }

    /**
     * UUID生成（UUIDGeneratorクラスを使用）
     */
    generateUUID() {
        return UUIDGenerator.generate();
    }

    /**
     * データバリデーション（外部からアクセス可能）
     */
    validateRecord(category, data) {
        return DataValidator.validateRecord(category, data);
    }

    /**
     * データ整合性チェック（外部からアクセス可能）
     */
    validateDataIntegrity() {
        return DataValidator.validateDataIntegrity(this.data);
    }

    /**
     * JSONファイルのインポート
     */
    async importFromFile(file) {
        return new Promise((resolve, reject) => {
            if (!file) {
                reject(new Error('ファイルが選択されていません'));
                return;
            }

            if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
                reject(new Error('JSONファイルを選択してください'));
                return;
            }

            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const importedData = JSON.parse(e.target.result);
                    
                    // データ整合性チェック
                    const validation = DataValidator.validateDataIntegrity(importedData);
                    if (!validation.isValid) {
                        reject(new Error(`データ整合性エラー: ${validation.errors.join(', ')}`));
                        return;
                    }
                    
                    // データをマージまたは置換
                    this.data = importedData;
                    this.saveData();
                    
                    resolve({
                        success: true,
                        message: 'データのインポートが完了しました',
                        recordCount: this.getTotalRecordCount()
                    });
                    
                } catch (error) {
                    reject(new Error(`ファイル読み込みエラー: ${error.message}`));
                }
            };
            
            reader.onerror = () => {
                reject(new Error('ファイルの読み込みに失敗しました'));
            };
            
            reader.readAsText(file);
        });
    }

    /**
     * JSONファイルのエクスポート
     */
    exportToFile(filename = null) {
        try {
            const exportData = {
                ...this.data,
                exportInfo: {
                    exportDate: new Date().toISOString(),
                    version: '1.0',
                    recordCount: this.getTotalRecordCount()
                }
            };
            
            const jsonData = JSON.stringify(exportData, null, 2);
            const blob = new Blob([jsonData], { type: 'application/json' });
            
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename || `kaikei-backup-${new Date().toISOString().split('T')[0]}.json`;
            
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            
            URL.revokeObjectURL(url);
            
            return {
                success: true,
                message: 'データのエクスポートが完了しました',
                filename: a.download
            };
            
        } catch (error) {
            throw new Error(`エクスポートエラー: ${error.message}`);
        }
    }

    /**
     * デフォルトデータの初期化
     */
    initializeDefaultData() {
        this.data = DataModels.getDataStructure();
        
        // サンプルデータの追加（オプション）
        const currentYear = new Date().getFullYear();
        const currentMonth = new Date().getMonth() + 1;
        
        try {
            // サンプル売上データ
            this.addRecord('sales', {
                year: currentYear,
                month: currentMonth,
                amount: 0,
                note: 'サンプルデータ - 削除してください'
            });
        } catch (error) {
            console.warn('サンプルデータの作成に失敗しました:', error.message);
        }
        
        this.saveData();
        console.log('デフォルトデータで初期化しました');
    }

    /**
     * データリセット
     */
    resetAllData() {
        if (confirm('すべてのデータを削除してもよろしいですか？この操作は取り消せません。')) {
            this.data = DataModels.getDataStructure();
            this.saveData();
            return true;
        }
        return false;
    }

    /**
     * 総レコード数の取得
     */
    getTotalRecordCount() {
        let total = 0;
        for (const category in this.data) {
            if (Array.isArray(this.data[category])) {
                total += this.data[category].length;
            }
        }
        return total;
    }

    /**
     * エラーハンドリング付きの安全な操作実行
     */
    async safeOperation(operation, errorMessage = '操作に失敗しました') {
        try {
            return await operation();
        } catch (error) {
            console.error(errorMessage, error);
            
            // エラー通知イベントの発火
            const errorEvent = new CustomEvent('dataError', {
                detail: {
                    message: errorMessage,
                    error: error.message,
                    timestamp: new Date()
                }
            });
            document.dispatchEvent(errorEvent);
            
            throw error;
        }
    }

    /**
     * データの自動バックアップ
     */
    async autoBackup() {
        try {
            const backupKey = `${this.fileName}-backup-${Date.now()}`;
            const jsonData = JSON.stringify(this.data, null, 2);
            
            // 最大5つのバックアップを保持
            const backupKeys = Object.keys(localStorage)
                .filter(key => key.startsWith(`${this.fileName}-backup-`))
                .sort();
            
            if (backupKeys.length >= 5) {
                localStorage.removeItem(backupKeys[0]);
            }
            
            localStorage.setItem(backupKey, jsonData);
            console.log('自動バックアップを作成しました:', backupKey);
            
            return backupKey;
        } catch (error) {
            console.error('自動バックアップの作成に失敗しました:', error);
            return null;
        }
    }

    /**
     * バックアップからの復元
     */
    async restoreFromBackup(backupKey) {
        try {
            const backupData = localStorage.getItem(backupKey);
            if (!backupData) {
                throw new Error('バックアップデータが見つかりません');
            }
            
            const parsedData = JSON.parse(backupData);
            
            // データ整合性チェック
            const validation = DataValidator.validateDataIntegrity(parsedData);
            if (!validation.isValid) {
                throw new Error(`バックアップデータの整合性エラー: ${validation.errors.join(', ')}`);
            }
            
            this.data = parsedData;
            this.saveData();
            
            console.log('バックアップからの復元が完了しました');
            return true;
            
        } catch (error) {
            console.error('バックアップからの復元に失敗しました:', error);
            throw error;
        }
    }

    /**
     * 利用可能なバックアップの一覧取得
     */
    getAvailableBackups() {
        const backupKeys = Object.keys(localStorage)
            .filter(key => key.startsWith(`${this.fileName}-backup-`))
            .map(key => {
                const timestamp = key.split('-').pop();
                return {
                    key: key,
                    date: new Date(parseInt(timestamp)),
                    displayName: new Date(parseInt(timestamp)).toLocaleString('ja-JP')
                };
            })
            .sort((a, b) => b.date - a.date);
        
        return backupKeys;
    }

    /**
     * CSVエクスポート機能
     * 収支データをCSV形式で出力
     */
    exportToCSV(options = {}) {
        try {
            const {
                exportType = 'all', // 'monthly', 'yearly', 'all'
                year = null,
                month = null,
                startYear = null,
                startMonth = null,
                endYear = null,
                endMonth = null
            } = options;

            let exportData = {};
            let filename = 'kaikei-data';

            // エクスポート範囲に応じてデータを取得
            switch (exportType) {
                case 'monthly':
                    if (!year || !month) {
                        throw new Error('月別エクスポートには年月の指定が必要です');
                    }
                    exportData = this.getRecordsByMonth(year, month);
                    filename = `kaikei-${year}-${String(month).padStart(2, '0')}`;
                    break;
                
                case 'yearly':
                    if (!year) {
                        throw new Error('年別エクスポートには年の指定が必要です');
                    }
                    exportData = this.getRecordsByYear(year);
                    filename = `kaikei-${year}`;
                    break;
                
                case 'range':
                    if (!startYear || !startMonth || !endYear || !endMonth) {
                        throw new Error('期間指定エクスポートには開始・終了年月の指定が必要です');
                    }
                    exportData = this.getRecordsByDateRange(startYear, startMonth, endYear, endMonth);
                    filename = `kaikei-${startYear}${String(startMonth).padStart(2, '0')}-${endYear}${String(endMonth).padStart(2, '0')}`;
                    break;
                
                default: // 'all'
                    exportData = this.getAllData();
                    filename = 'kaikei-all-data';
                    break;
            }

            // CSVデータの生成
            const csvContent = this.generateCSVContent(exportData, exportType);
            
            // ファイルダウンロード
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            
            link.href = url;
            link.download = `${filename}-${new Date().toISOString().split('T')[0]}.csv`;
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            URL.revokeObjectURL(url);

            return {
                success: true,
                message: 'CSVエクスポートが完了しました',
                filename: link.download,
                recordCount: this.countRecordsInData(exportData)
            };

        } catch (error) {
            console.error('CSVエクスポートエラー:', error);
            throw new Error(`CSVエクスポートに失敗しました: ${error.message}`);
        }
    }

    /**
     * CSV形式のコンテンツ生成
     */
    generateCSVContent(data, exportType) {
        const csvRows = [];
        
        // ヘッダー行を追加
        csvRows.push('カテゴリー,年,月,金額,項目/返済先/メーカー,備考,作成日時,更新日時');

        // カテゴリー名の日本語マッピング
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

        // 各カテゴリーのデータを処理
        for (const [category, records] of Object.entries(data)) {
            if (!Array.isArray(records)) continue;

            const categoryName = categoryNames[category] || category;
            
            for (const record of records) {
                // 特別なフィールドの処理
                let specialField = '';
                if (record.category) {
                    specialField = record.category;
                } else if (record.payee) {
                    specialField = record.payee;
                } else if (record.manufacturer) {
                    specialField = record.manufacturer;
                }

                // CSVの行を作成（カンマやダブルクォートをエスケープ）
                const row = [
                    this.escapeCSVField(categoryName),
                    record.year || '',
                    record.month || '',
                    record.amount || 0,
                    this.escapeCSVField(specialField),
                    this.escapeCSVField(record.note || ''),
                    this.escapeCSVField(record.createdAt || ''),
                    this.escapeCSVField(record.updatedAt || '')
                ].join(',');
                
                csvRows.push(row);
            }
        }

        // 集計情報を追加（exportTypeが'all'以外の場合）
        if (exportType !== 'all') {
            csvRows.push(''); // 空行
            csvRows.push('=== 集計情報 ===');
            
            const summary = this.calculateSummaryForCSV(data);
            csvRows.push(`総売上,${summary.totalSales}`);
            csvRows.push(`総支出,${summary.totalExpenses}`);
            csvRows.push(`利益,${summary.profit}`);
            csvRows.push(`レコード数,${summary.recordCount}`);
        }

        // BOM付きUTF-8でエンコード（Excelでの文字化け防止）
        return '\uFEFF' + csvRows.join('\n');
    }

    /**
     * CSVフィールドのエスケープ処理
     */
    escapeCSVField(field) {
        if (field === null || field === undefined) {
            return '';
        }
        
        const stringField = String(field);
        
        // カンマ、ダブルクォート、改行が含まれている場合はダブルクォートで囲む
        if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
            // ダブルクォートを二重にエスケープ
            return `"${stringField.replace(/"/g, '""')}"`;
        }
        
        return stringField;
    }

    /**
     * CSV用の集計情報計算
     */
    calculateSummaryForCSV(data) {
        let totalSales = 0;
        let totalExpenses = 0;
        let recordCount = 0;

        // 売上の集計
        if (data.sales) {
            totalSales = data.sales.reduce((sum, record) => sum + (record.amount || 0), 0);
            recordCount += data.sales.length;
        }

        // 支出の集計
        const expenseCategories = ['purchases', 'fixedCosts', 'variableCosts', 'laborCosts', 
                                 'consumptionTax', 'monthlyPayments', 'manufacturerDeposits'];
        
        for (const category of expenseCategories) {
            if (data[category]) {
                totalExpenses += data[category].reduce((sum, record) => sum + (record.amount || 0), 0);
                recordCount += data[category].length;
            }
        }

        return {
            totalSales,
            totalExpenses,
            profit: totalSales - totalExpenses,
            recordCount
        };
    }

    /**
     * データ内のレコード数をカウント
     */
    countRecordsInData(data) {
        let count = 0;
        for (const category in data) {
            if (Array.isArray(data[category])) {
                count += data[category].length;
            }
        }
        return count;
    }

    /**
     * バックアップ作成（外部インターフェース）
     */
    createBackup() {
        return this.autoBackup();
    }

    /**
     * 手動バックアップ作成
     */
    async createManualBackup(description = '') {
        try {
            const timestamp = Date.now();
            const backupKey = `${this.fileName}-manual-backup-${timestamp}`;
            const backupData = {
                ...this.data,
                backupInfo: {
                    type: 'manual',
                    description: description || '手動バックアップ',
                    createdAt: new Date().toISOString(),
                    timestamp: timestamp,
                    recordCount: this.getTotalRecordCount(),
                    version: '1.0'
                }
            };
            
            const jsonData = JSON.stringify(backupData, null, 2);
            
            // 手動バックアップの最大保持数チェック（10個まで）
            const manualBackupKeys = Object.keys(localStorage)
                .filter(key => key.includes(`${this.fileName}-manual-backup-`))
                .sort();
            
            if (manualBackupKeys.length >= 10) {
                // 最も古いバックアップを削除
                localStorage.removeItem(manualBackupKeys[0]);
            }
            
            localStorage.setItem(backupKey, jsonData);
            console.log('手動バックアップを作成しました:', backupKey);
            
            // バックアップ作成イベントを発火
            const event = new CustomEvent('backupCreated', {
                detail: {
                    key: backupKey,
                    type: 'manual',
                    description: description,
                    timestamp: timestamp
                }
            });
            document.dispatchEvent(event);
            
            return {
                success: true,
                key: backupKey,
                message: 'バックアップを作成しました',
                timestamp: timestamp
            };
            
        } catch (error) {
            console.error('手動バックアップの作成に失敗しました:', error);
            throw new Error(`バックアップの作成に失敗しました: ${error.message}`);
        }
    }

    /**
     * 全バックアップの一覧取得（自動・手動両方）
     */
    getAllBackups() {
        const allBackupKeys = Object.keys(localStorage)
            .filter(key => key.startsWith(`${this.fileName}-`) && key.includes('-backup-'))
            .map(key => {
                const isManual = key.includes('-manual-backup-');
                const timestampMatch = key.match(/-(\d+)$/);
                const timestamp = timestampMatch ? parseInt(timestampMatch[1]) : 0;
                
                // バックアップデータから詳細情報を取得
                let backupInfo = null;
                try {
                    const backupData = JSON.parse(localStorage.getItem(key));
                    backupInfo = backupData.backupInfo || {};
                } catch (error) {
                    console.warn('バックアップデータの読み込みに失敗:', key);
                }
                
                return {
                    key: key,
                    type: isManual ? 'manual' : 'auto',
                    timestamp: timestamp,
                    date: new Date(timestamp),
                    displayName: new Date(timestamp).toLocaleString('ja-JP'),
                    description: backupInfo?.description || (isManual ? '手動バックアップ' : '自動バックアップ'),
                    recordCount: backupInfo?.recordCount || 0,
                    size: localStorage.getItem(key)?.length || 0
                };
            })
            .sort((a, b) => b.timestamp - a.timestamp); // 新しい順にソート
        
        return allBackupKeys;
    }

    /**
     * バックアップの削除
     */
    deleteBackup(backupKey) {
        try {
            if (!localStorage.getItem(backupKey)) {
                throw new Error('指定されたバックアップが見つかりません');
            }
            
            localStorage.removeItem(backupKey);
            console.log('バックアップを削除しました:', backupKey);
            
            // バックアップ削除イベントを発火
            const event = new CustomEvent('backupDeleted', {
                detail: { key: backupKey }
            });
            document.dispatchEvent(event);
            
            return {
                success: true,
                message: 'バックアップを削除しました'
            };
            
        } catch (error) {
            console.error('バックアップの削除に失敗しました:', error);
            throw error;
        }
    }

    /**
     * バックアップからの復元（改良版）
     */
    async restoreFromBackup(backupKey) {
        try {
            const backupData = localStorage.getItem(backupKey);
            if (!backupData) {
                throw new Error('バックアップデータが見つかりません');
            }
            
            const parsedData = JSON.parse(backupData);
            
            // バックアップ情報を除去してデータ部分のみを取得
            const { backupInfo, exportInfo, ...actualData } = parsedData;
            
            // データ整合性チェック
            const validation = DataValidator.validateDataIntegrity(actualData);
            if (!validation.isValid) {
                throw new Error(`バックアップデータの整合性エラー: ${validation.errors.join(', ')}`);
            }
            
            // 現在のデータをバックアップしてから復元
            await this.createManualBackup('復元前の自動バックアップ');
            
            this.data = actualData;
            await this.saveData();
            
            console.log('バックアップからの復元が完了しました');
            
            // 復元完了イベントを発火
            const event = new CustomEvent('backupRestored', {
                detail: {
                    backupKey: backupKey,
                    recordCount: this.getTotalRecordCount()
                }
            });
            document.dispatchEvent(event);
            
            return {
                success: true,
                message: 'バックアップからの復元が完了しました',
                recordCount: this.getTotalRecordCount()
            };
            
        } catch (error) {
            console.error('バックアップからの復元に失敗しました:', error);
            throw error;
        }
    }

    /**
     * バックアップファイルのエクスポート
     */
    exportBackupToFile(backupKey) {
        try {
            const backupData = localStorage.getItem(backupKey);
            if (!backupData) {
                throw new Error('バックアップデータが見つかりません');
            }
            
            const parsedData = JSON.parse(backupData);
            const backupInfo = parsedData.backupInfo || {};
            
            const blob = new Blob([backupData], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            
            // ファイル名を生成
            const date = new Date(backupInfo.timestamp || Date.now());
            const dateStr = date.toISOString().split('T')[0];
            const timeStr = date.toTimeString().split(' ')[0].replace(/:/g, '');
            a.download = `kaikei-backup-${dateStr}-${timeStr}.json`;
            
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            
            URL.revokeObjectURL(url);
            
            return {
                success: true,
                message: 'バックアップファイルをダウンロードしました',
                filename: a.download
            };
            
        } catch (error) {
            console.error('バックアップファイルのエクスポートに失敗しました:', error);
            throw error;
        }
    }

    /**
     * バックアップファイルからのインポート
     */
    async importBackupFromFile(file) {
        return new Promise((resolve, reject) => {
            if (!file) {
                reject(new Error('ファイルが選択されていません'));
                return;
            }

            if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
                reject(new Error('JSONファイルを選択してください'));
                return;
            }

            const reader = new FileReader();
            
            reader.onload = async (e) => {
                try {
                    const importedData = JSON.parse(e.target.result);
                    
                    // バックアップ情報を除去してデータ部分のみを取得
                    const { backupInfo, exportInfo, ...actualData } = importedData;
                    
                    // データ整合性チェック
                    const validation = DataValidator.validateDataIntegrity(actualData);
                    if (!validation.isValid) {
                        reject(new Error(`データ整合性エラー: ${validation.errors.join(', ')}`));
                        return;
                    }
                    
                    // インポートしたデータを新しいバックアップとして保存
                    const timestamp = Date.now();
                    const backupKey = `${this.fileName}-imported-backup-${timestamp}`;
                    const backupData = {
                        ...actualData,
                        backupInfo: {
                            type: 'imported',
                            description: `インポートされたバックアップ (${file.name})`,
                            createdAt: new Date().toISOString(),
                            timestamp: timestamp,
                            recordCount: this.calculateRecordCount(actualData),
                            originalFile: file.name,
                            version: '1.0'
                        }
                    };
                    
                    localStorage.setItem(backupKey, JSON.stringify(backupData, null, 2));
                    
                    resolve({
                        success: true,
                        message: 'バックアップファイルをインポートしました',
                        backupKey: backupKey,
                        recordCount: this.calculateRecordCount(actualData)
                    });
                    
                } catch (error) {
                    reject(new Error(`ファイル読み込みエラー: ${error.message}`));
                }
            };
            
            reader.onerror = () => {
                reject(new Error('ファイルの読み込みに失敗しました'));
            };
            
            reader.readAsText(file);
        });
    }

    /**
     * データのレコード数計算
     */
    calculateRecordCount(data) {
        let total = 0;
        for (const category in data) {
            if (Array.isArray(data[category])) {
                total += data[category].length;
            }
        }
        return total;
    }

    /**
     * 月次レコードの同期
     */
    syncMonthlyRecords(category, year, month, newRecords) {
        if (!this.data[category]) {
            throw new Error(`無効なカテゴリー: ${category}`);
        }

        // 対象月の既存レコードをすべて削除
        this.data[category] = this.data[category].filter(record => record.year !== year || record.month !== month);

        // 新しいレコードを追加
        newRecords.forEach(record => {
            const validation = DataValidator.validateRecord(category, record);
            if (!validation.isValid) {
                throw new Error(`バリデーションエラー: ${validation.errors.join(', ')}`);
            }
            const newRecord = {
                id: UUIDGenerator.generate(),
                ...record,
                createdAt: new Date().toISOString()
            };
            this.data[category].push(newRecord);
        });

        this.hasUnsavedChanges = true;
        this.notifyDataChanged();
        this.saveData();
        return true;
    }
}