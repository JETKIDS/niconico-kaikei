// シンプルなDataManagerクラス（テスト用）
console.log('data-manager-simple.js 読み込み開始');

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
}

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

/**
 * データ管理クラス（シンプル版）
 */
class DataManager {
    constructor() {
        this.data = DataModels.getDataStructure();
        this.storageKey = 'kaikei-data';
        console.log('DataManager インスタンス作成完了');
    }

    async loadData() {
        try {
            const savedData = localStorage.getItem(this.storageKey);
            if (savedData) {
                this.data = JSON.parse(savedData);
                console.log('データ読み込み完了');
                return true;
            }
            return false;
        } catch (error) {
            console.error('データ読み込みエラー:', error);
            return false;
        }
    }

    async saveData() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.data));
            console.log('データ保存完了');
            return true;
        } catch (error) {
            console.error('データ保存エラー:', error);
            return false;
        }
    }

    getDataByCategory(category) {
        return this.data[category] || [];
    }

    addRecord(category, recordData) {
        if (!this.data[category]) {
            this.data[category] = [];
        }
        
        const record = {
            id: UUIDGenerator.generate(),
            ...recordData,
            createdAt: new Date().toISOString()
        };
        
        this.data[category].push(record);
        return record;
    }

    migrateDataForStoreSupport() {
        console.log('データ移行処理（スキップ）');
        return 0;
    }

    getTotalRecordCount() {
        let count = 0;
        for (const category in this.data) {
            count += this.data[category].length;
        }
        return count;
    }
}

console.log('data-manager-simple.js 読み込み完了');
console.log('DataManager クラス定義:', typeof DataManager);