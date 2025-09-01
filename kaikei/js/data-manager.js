// データ管理システム
console.log('=== data-manager.js 読み込み開始 ===');
console.log('現在のスクリプトURL:', document.currentScript ? document.currentScript.src : 'unknown');

/**
 * データモデル定義
 */
class DataModels {
    static getDataStructure() {
        return {
            sales: [],
            purchases: [],
            fixedCosts: [],
            variableCosts: [],
            laborCosts: [],
            consumptionTax: [],
            monthlyPayments: [],
            manufacturerDeposits: []
        };
    }

    static getFieldDefinitions() {
        return {
            sales: {
                required: ['year', 'month', 'amount'],
                optional: ['note'],
                types: { year: 'number', month: 'number', amount: 'number', note: 'string' }
            },
            purchases: {
                required: ['year', 'month', 'amount'],
                optional: ['manufacturer', 'note'],
                types: { year: 'number', month: 'number', amount: 'number', manufacturer: 'string', note: 'string' }
            },
            fixedCosts: {
                required: ['year', 'month', 'category', 'amount'],
                optional: ['note'],
                types: { year: 'number', month: 'number', category: 'string', amount: 'number', note: 'string' }
            },
            variableCosts: {
                required: ['year', 'month', 'category', 'amount'],
                optional: ['note'],
                types: { year: 'number', month: 'number', category: 'string', amount: 'number', note: 'string' }
            },
            laborCosts: {
                required: ['year', 'month', 'amount'],
                optional: ['note'],
                types: { year: 'number', month: 'number', amount: 'number', note: 'string' }
            },
            consumptionTax: {
                required: ['year', 'month', 'amount'],
                optional: ['note'],
                types: { year: 'number', month: 'number', amount: 'number', note: 'string' }
            },
            monthlyPayments: {
                required: ['year', 'month', 'amount', 'payee'],
                optional: ['note'],
                types: { year: 'number', month: 'number', amount: 'number', payee: 'string', note: 'string' }
            },
            manufacturerDeposits: {
                required: ['year', 'month', 'amount', 'manufacturer'],
                optional: ['note'],
                types: { year: 'number', month: 'number', amount: 'number', manufacturer: 'string', note: 'string' }
            }
        };
    }
}
console.log('DataModels クラス定義完了:', typeof DataModels);

/**
 * バリデーション機能
 */
class DataValidator {
    static validateRecord(category, data) {
        const errors = [];
        
        if (!category || typeof category !== 'string') {
            errors.push('カテゴリーが指定されていません');
            return { isValid: false, errors };
        }
        
        if (!data || typeof data !== 'object') {
            errors.push('データが正しく入力されていません');
            return { isValid: false, errors };
        }
        
        const fieldDefs = DataModels.getFieldDefinitions()[category];
        
        if (!fieldDefs) {
            errors.push(`無効なカテゴリー: ${category}`);
            return { isValid: false, errors };
        }

        for (const field of fieldDefs.required) {
            const value = data[field];
            if (value === undefined || value === null || 
                (typeof value === 'string' && value.trim() === '') ||
                (typeof value === 'number' && isNaN(value))) {
                errors.push(`${field}は必須項目です`);
            }
        }

        return { isValid: errors.length === 0, errors };
    }
}
console.log('DataValidator クラス定義完了:', typeof DataValidator);

/**
 * UUID生成ユーティリティ
 */
class UUIDGenerator {
    static generate() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
}
console.log('UUIDGenerator クラス定義完了:', typeof UUIDGenerator);

/**
 * データ管理クラス
 */
class DataManager {
    constructor() {
        this.data = DataModels.getDataStructure();
        this.storageKey = 'kaikei-data';
        this.hasUnsavedChanges = false;
        console.log('DataManager インスタンス作成完了');
    }

    async loadData() {
        try {
            const savedData = localStorage.getItem(this.storageKey);
            if (savedData) {
                const parsedData = JSON.parse(savedData);
                this.data = { ...DataModels.getDataStructure(), ...parsedData };
                
                const defaultStructure = DataModels.getDataStructure();
                for (const category in defaultStructure) {
                    if (!this.data[category]) {
                        this.data[category] = [];
                    }
                }
                
                console.log('データ読み込み完了');
                return true;
            }
            console.log('新規データで開始');
            return false;
        } catch (error) {
            console.error('データ読み込みエラー:', error);
            this.data = DataModels.getDataStructure();
            return false;
        }
    }

    async saveData() {
        try {
            const dataToSave = JSON.stringify(this.data);
            localStorage.setItem(this.storageKey, dataToSave);
            this.hasUnsavedChanges = false;
            
            document.dispatchEvent(new CustomEvent('dataSaveStatus', {
                detail: { success: true, timestamp: new Date(), recordCount: this.getTotalRecordCount() }
            }));
            
            console.log('データ保存完了');
            return true;
        } catch (error) {
            console.error('データ保存エラー:', error);
            document.dispatchEvent(new CustomEvent('dataSaveStatus', {
                detail: { success: false, error: error.message }
            }));
            return false;
        }
    }

    addRecord(category, recordData) {
        const validation = DataValidator.validateRecord(category, recordData);
        if (!validation.isValid) {
            throw new Error(`バリデーションエラー: ${validation.errors.join(', ')}`);
        }

        if (!recordData.storeId && window.storeManager) {
            recordData.storeId = window.storeManager.getActiveStoreId();
        }

        const record = {
            id: UUIDGenerator.generate(),
            ...recordData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        if (!this.data[category]) {
            this.data[category] = [];
        }

        this.data[category].push(record);
        this.hasUnsavedChanges = true;
        
        document.dispatchEvent(new CustomEvent('dataChanged', {
            detail: { category, action: 'add', record }
        }));

        this.saveData();
        return record;
    }

    updateRecord(category, recordId, updateData) {
        const recordIndex = this.data[category].findIndex(record => record.id === recordId);
        if (recordIndex === -1) {
            throw new Error(`レコードが見つかりません: ${recordId}`);
        }

        const mergedData = { ...this.data[category][recordIndex], ...updateData };
        const validation = DataValidator.validateRecord(category, mergedData);
        if (!validation.isValid) {
            throw new Error(`バリデーションエラー: ${validation.errors.join(', ')}`);
        }

        this.data[category][recordIndex] = {
            ...this.data[category][recordIndex],
            ...updateData,
            updatedAt: new Date().toISOString()
        };

        this.hasUnsavedChanges = true;
        
        document.dispatchEvent(new CustomEvent('dataChanged', {
            detail: { category, action: 'update', record: this.data[category][recordIndex] }
        }));

        this.saveData();
        return this.data[category][recordIndex];
    }

    deleteRecord(category, recordId) {
        const recordIndex = this.data[category].findIndex(record => record.id === recordId);
        if (recordIndex === -1) {
            throw new Error(`レコードが見つかりません: ${recordId}`);
        }

        const deletedRecord = this.data[category][recordIndex];
        this.data[category].splice(recordIndex, 1);
        this.hasUnsavedChanges = true;
        
        document.dispatchEvent(new CustomEvent('dataChanged', {
            detail: { category, action: 'delete', record: deletedRecord }
        }));

        this.saveData();
        return deletedRecord;
    }

    getDataByCategory(category) {
        if (!this.data[category]) {
            return [];
        }
        // パフォーマンス向上のため、読み取り専用の場合は直接参照
        return this.data[category].slice();
    }

    getDataByStore(storeId, category = null) {
        if (category) {
            return this.data[category] ? 
                this.data[category].filter(record => record.storeId === storeId) : [];
        }
        
        const result = {};
        for (const cat in this.data) {
            result[cat] = this.data[cat].filter(record => record.storeId === storeId);
        }
        return result;
    }

    getRecordById(category, recordId) {
        const record = this.data[category]?.find(record => record.id === recordId);
        if (!record) {
            throw new Error(`レコードが見つかりません: ${recordId}`);
        }
        return { ...record };
    }

    getAllData() {
        return JSON.parse(JSON.stringify(this.data));
    }

    getTotalRecordCount() {
        let count = 0;
        for (const category in this.data) {
            count += this.data[category].length;
        }
        return count;
    }

    migrateDataForStoreSupport() {
        let migrationCount = 0;
        const defaultStoreId = 'default-store';
        
        for (const category in this.data) {
            if (Array.isArray(this.data[category])) {
                this.data[category].forEach(record => {
                    if (!record.storeId) {
                        record.storeId = defaultStoreId;
                        migrationCount++;
                    }
                });
            }
        }
        
        if (migrationCount > 0) {
            this.hasUnsavedChanges = true;
            console.log(`${migrationCount}件のレコードを店舗対応形式に移行しました`);
            this.saveData();
        }
        
        return migrationCount;
    }

    moveRecordsToStore(recordIds, category, targetStoreId) {
        const movedRecords = [];
        
        recordIds.forEach(recordId => {
            const recordIndex = this.data[category].findIndex(record => record.id === recordId);
            if (recordIndex !== -1) {
                const oldStoreId = this.data[category][recordIndex].storeId;
                this.data[category][recordIndex].storeId = targetStoreId;
                this.data[category][recordIndex].updatedAt = new Date().toISOString();
                
                movedRecords.push({
                    record: this.data[category][recordIndex],
                    oldStoreId: oldStoreId,
                    newStoreId: targetStoreId
                });
            }
        });
        
        if (movedRecords.length > 0) {
            this.hasUnsavedChanges = true;
            
            document.dispatchEvent(new CustomEvent('dataChanged', {
                detail: { category, action: 'move', records: movedRecords }
            }));
            
            this.saveData();
        }
        
        return movedRecords;
    }

    async retrySave() {
        return await this.saveData();
    }

    /**
     * 月別データ取得
     */
    getRecordsByMonth(year, month, storeId = null) {
        const result = {};
        
        // storeIdが指定されていない場合は、アクティブ店舗IDを使用
        const finalStoreId = storeId || (window.storeManager ? window.storeManager.getActiveStoreId() : null);
        
        for (const category in this.data) {
            let filteredData = this.data[category].filter(record => 
                record.year === year && record.month === month
            );
            
            // storeIdが指定されている場合はさらにフィルタリング
            if (finalStoreId) {
                filteredData = filteredData.filter(record => record.storeId === finalStoreId);
            }
            
            result[category] = filteredData;
        }
        
        return result;
    }

    /**
     * 年別データ取得
     */
    getRecordsByYear(year, storeId = null) {
        const result = {};
        
        // storeIdが指定されていない場合は、アクティブ店舗IDを使用
        const finalStoreId = storeId || (window.storeManager ? window.storeManager.getActiveStoreId() : null);
        
        for (const category in this.data) {
            let filteredData = this.data[category].filter(record => 
                record.year === year
            );
            
            // storeIdが指定されている場合はさらにフィルタリング
            if (finalStoreId) {
                filteredData = filteredData.filter(record => record.storeId === finalStoreId);
            }
            
            result[category] = filteredData;
        }
        
        return result;
    }

    /**
     * 期間別データ取得
     */
    getRecordsByDateRange(startYear, startMonth, endYear, endMonth, storeId = null) {
        const result = {};
        
        // storeIdが指定されていない場合は、アクティブ店舗IDを使用
        const finalStoreId = storeId || (window.storeManager ? window.storeManager.getActiveStoreId() : null);
        
        for (const category in this.data) {
            let filteredData = this.data[category].filter(record => {
                const recordDate = record.year * 100 + record.month;
                const startDate = startYear * 100 + startMonth;
                const endDate = endYear * 100 + endMonth;
                
                return recordDate >= startDate && recordDate <= endDate;
            });
            
            // storeIdが指定されている場合はさらにフィルタリング
            if (finalStoreId) {
                filteredData = filteredData.filter(record => record.storeId === finalStoreId);
            }
            
            result[category] = filteredData;
        }
        
        return result;
    }

    /**
     * レコードのバリデーション（外部からアクセス可能）
     */
    validateRecord(category, data) {
        return DataValidator.validateRecord(category, data);
    }

    /**
     * UUID生成（外部からアクセス可能）
     */
    generateUUID() {
        return UUIDGenerator.generate();
    }

    /**
     * 複数レコードの一括追加
     */
    addMultipleRecords(category, records) {
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
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };
                
                if (!record.storeId && window.storeManager) {
                    record.storeId = window.storeManager.getActiveStoreId();
                }
                
                this.data[category].push(record);
                addedRecords.push(record);
            } catch (error) {
                errors.push(`レコード${i + 1}: ${error.message}`);
            }
        }
        
        if (addedRecords.length > 0) {
            this.hasUnsavedChanges = true;
            this.saveData();
        }
        
        return {
            success: addedRecords,
            errors: errors
        };
    }

    /**
     * 月別レコードの同期（変動費用）
     */
    syncMonthlyRecords(category, year, month, records) {
        // 既存の同月データを削除
        this.data[category] = this.data[category].filter(record => 
            !(record.year === year && record.month === month)
        );
        
        // 新しいレコードを追加
        records.forEach(recordData => {
            const record = {
                id: UUIDGenerator.generate(),
                ...recordData,
                year: year,
                month: month,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            
            if (!record.storeId && window.storeManager) {
                record.storeId = window.storeManager.getActiveStoreId();
            }
            
            this.data[category].push(record);
        });
        
        this.hasUnsavedChanges = true;
        this.saveData();
    }

    /**
     * 単一レコードの店舗移動
     */
    async moveRecordToStore(category, recordId, targetStoreId, skipDuplicateCheck = false) {
        const recordIndex = this.data[category].findIndex(record => record.id === recordId);
        if (recordIndex === -1) {
            throw new Error(`レコードが見つかりません: ${recordId}`);
        }

        const oldStoreId = this.data[category][recordIndex].storeId;
        this.data[category][recordIndex].storeId = targetStoreId;
        this.data[category][recordIndex].updatedAt = new Date().toISOString();
        
        this.hasUnsavedChanges = true;
        
        document.dispatchEvent(new CustomEvent('dataChanged', {
            detail: { 
                category, 
                action: 'move', 
                record: this.data[category][recordIndex],
                oldStoreId: oldStoreId,
                newStoreId: targetStoreId
            }
        }));
        
        this.saveData();
        return this.data[category][recordIndex];
    }

    /**
     * ファイルエクスポート（簡易版）
     */
    exportToFile(filename) {
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
            a.download = `${filename}.json`;
            
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            
            URL.revokeObjectURL(url);
            
            return { success: true, message: 'エクスポートが完了しました' };
        } catch (error) {
            console.error('エクスポートエラー:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * ファイルインポート（簡易版）
     */
    async importFromFile(file) {
        return new Promise((resolve, reject) => {
            if (!file) {
                reject(new Error('ファイルが選択されていません'));
                return;
            }

            const reader = new FileReader();
            
            reader.onload = async (e) => {
                try {
                    const importedData = JSON.parse(e.target.result);
                    
                    // データの整合性チェック（簡易版）
                    const dataToValidate = { ...importedData };
                    delete dataToValidate.exportInfo;
                    
                    this.data = { ...DataModels.getDataStructure(), ...dataToValidate };
                    this.hasUnsavedChanges = true;
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
     * バックアップ関連メソッド（簡易版）
     */
    getAllBackups() {
        // 簡易版では空の配列を返す
        return [];
    }

    async createManualBackup(description) {
        try {
            const backupData = {
                ...this.data,
                backupInfo: {
                    description: description || 'Manual backup',
                    createdAt: new Date().toISOString(),
                    type: 'manual',
                    recordCount: this.getTotalRecordCount()
                }
            };
            
            const filename = `backup-${new Date().toISOString().split('T')[0]}-manual`;
            const jsonData = JSON.stringify(backupData, null, 2);
            const blob = new Blob([jsonData], { type: 'application/json' });
            
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${filename}.json`;
            
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            
            URL.revokeObjectURL(url);
            
            return { success: true, message: 'バックアップを作成しました' };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async importBackupFromFile(file) {
        return await this.importFromFile(file);
    }

    async restoreFromBackup(backupKey) {
        return { success: false, error: '簡易版では復元機能は利用できません' };
    }

    exportBackupToFile(backupKey) {
        return { success: false, error: '簡易版では個別バックアップエクスポートは利用できません' };
    }

    deleteBackup(backupKey) {
        return { success: false, error: '簡易版では個別バックアップ削除は利用できません' };
    }

    /**
     * CSV エクスポート機能（簡易版）
     */
    exportToCSV(options) {
        try {
            const { exportType, year, month, startYear, startMonth, endYear, endMonth, storeName } = options;
            
            let data = [];
            let filename = 'kaikei-export';
            
            // データ取得
            switch (exportType) {
                case 'monthly':
                    data = this.getRecordsByMonth(year, month);
                    filename = `kaikei-${year}-${month.toString().padStart(2, '0')}-${storeName || 'all'}`;
                    break;
                case 'yearly':
                    data = this.getRecordsByYear(year);
                    filename = `kaikei-${year}-${storeName || 'all'}`;
                    break;
                case 'range':
                    data = this.getRecordsByDateRange(startYear, startMonth, endYear, endMonth);
                    filename = `kaikei-${startYear}${startMonth.toString().padStart(2, '0')}-${endYear}${endMonth.toString().padStart(2, '0')}-${storeName || 'all'}`;
                    break;
                case 'all':
                default:
                    data = this.getAllData();
                    filename = `kaikei-all-${storeName || 'all'}`;
                    break;
            }
            
            // CSV形式に変換（簡易版）
            let csvContent = 'カテゴリー,年,月,金額,備考,店舗ID,作成日\n';
            
            for (const [category, records] of Object.entries(data)) {
                if (Array.isArray(records)) {
                    records.forEach(record => {
                        const row = [
                            category,
                            record.year || '',
                            record.month || '',
                            record.amount || 0,
                            (record.note || '').replace(/,/g, '，'), // カンマをエスケープ
                            record.storeId || '',
                            record.createdAt || ''
                        ].join(',');
                        csvContent += row + '\n';
                    });
                }
            }
            
            // ファイルダウンロード
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${filename}.csv`;
            
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            
            URL.revokeObjectURL(url);
            
            return { success: true, message: 'CSVエクスポートが完了しました' };
        } catch (error) {
            console.error('CSVエクスポートエラー:', error);
            return { success: false, error: error.message };
        }
    }
}

console.log('DataManager クラス定義完了:', typeof DataManager);

console.log('=== data-manager.js 読み込み完了 ===');
console.log('DataManager クラス定義:', typeof DataManager);

// グローバルスコープに明示的に設定（デバッグ用）
window.DataManager = DataManager;
window.DataModels = DataModels;
window.DataValidator = DataValidator;
window.UUIDGenerator = UUIDGenerator;