// 店舗管理システム
console.log('store-manager.js 読み込み開始');

/**
 * 店舗用UUID生成ユーティリティ
 */
class StoreUUIDGenerator {
    static generate() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
}

/**
 * 店舗データモデル定義
 */
class StoreModels {
    static getStoreStructure() {
        return {
            stores: [],
            activeStoreId: null
        };
    }

    static getStoreFieldDefinitions() {
        return {
            required: ['name'],
            optional: ['address', 'openDate', 'note'],
            types: {
                name: 'string',
                address: 'string',
                openDate: 'string',
                note: 'string'
            }
        };
    }
}

/**
 * 店舗データバリデーション機能
 */
class StoreValidator {
    static validateStoreData(storeData) {
        const errors = [];
        const warnings = [];
        const fieldDefs = StoreModels.getStoreFieldDefinitions();

        if (!storeData || typeof storeData !== 'object') {
            errors.push('店舗データが正しく入力されていません');
            return { isValid: false, errors, warnings };
        }

        for (const field of fieldDefs.required) {
            if (!storeData[field] || storeData[field].toString().trim() === '') {
                errors.push(`${this.getFieldDisplayName(field)}は必須項目です`);
            }
        }

        return { isValid: errors.length === 0, errors, warnings };
    }

    static getFieldDisplayName(field) {
        const displayNames = {
            name: '店舗名',
            address: '住所',
            openDate: '開店日',
            note: '備考'
        };
        return displayNames[field] || field;
    }
}

/**
 * 店舗管理クラス
 */
class StoreManager {
    constructor() {
        this.storeData = StoreModels.getStoreStructure();
        this.storageKey = 'kaikei-stores';
        this.autoSaveEnabled = true;
        this.hasUnsavedChanges = false;
        console.log('StoreManager インスタンス作成完了');
    }

    async loadStoreData() {
        try {
            const savedData = localStorage.getItem(this.storageKey);
            if (savedData) {
                const parsedData = JSON.parse(savedData);
                this.storeData = { ...StoreModels.getStoreStructure(), ...parsedData };
                
                if (this.storeData.stores.length === 0) {
                    this.createDefaultStore();
                }
                
                if (!this.storeData.activeStoreId && this.storeData.stores.length > 0) {
                    this.storeData.activeStoreId = this.storeData.stores[0].id;
                }
                
                console.log('店舗データ読み込み完了');
                return true;
            } else {
                this.createDefaultStore();
                await this.saveStoreData();
                console.log('デフォルト店舗を作成しました');
                return false;
            }
        } catch (error) {
            console.error('店舗データ読み込みエラー:', error);
            this.storeData = StoreModels.getStoreStructure();
            this.createDefaultStore();
            return false;
        }
    }

    async saveStoreData() {
        try {
            const dataToSave = JSON.stringify(this.storeData);
            localStorage.setItem(this.storageKey, dataToSave);
            this.hasUnsavedChanges = false;
            console.log('店舗データ保存完了');
            return true;
        } catch (error) {
            console.error('店舗データ保存エラー:', error);
            return false;
        }
    }

    createDefaultStore() {
        const defaultStore = {
            id: 'default-store',
            name: 'メイン店舗',
            address: '',
            openDate: '',
            note: 'システム作成のデフォルト店舗',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        this.storeData.stores = [defaultStore];
        this.storeData.activeStoreId = defaultStore.id;
        this.hasUnsavedChanges = true;
    }

    addStore(storeData) {
        const validation = StoreValidator.validateStoreData(storeData);
        if (!validation.isValid) {
            throw new Error(`バリデーションエラー: ${validation.errors.join(', ')}`);
        }

        const existingStore = this.storeData.stores.find(store => 
            store.name.trim().toLowerCase() === storeData.name.trim().toLowerCase()
        );
        if (existingStore) {
            throw new Error('同じ名前の店舗が既に存在します');
        }

        const newStore = {
            id: StoreUUIDGenerator.generate(),
            name: storeData.name.trim(),
            address: storeData.address ? storeData.address.trim() : '',
            openDate: storeData.openDate ? storeData.openDate.trim() : '',
            note: storeData.note ? storeData.note.trim() : '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        this.storeData.stores.push(newStore);
        this.hasUnsavedChanges = true;

        if (this.autoSaveEnabled) {
            this.saveStoreData();
        }

        return newStore;
    }

    updateStore(storeId, updateData) {
        const storeIndex = this.storeData.stores.findIndex(store => store.id === storeId);
        if (storeIndex === -1) {
            throw new Error(`店舗が見つかりません: ${storeId}`);
        }

        const mergedData = { ...this.storeData.stores[storeIndex], ...updateData };
        const validation = StoreValidator.validateStoreData(mergedData);
        if (!validation.isValid) {
            throw new Error(`バリデーションエラー: ${validation.errors.join(', ')}`);
        }

        if (updateData.name) {
            const existingStore = this.storeData.stores.find(store => 
                store.id !== storeId && 
                store.name.trim().toLowerCase() === updateData.name.trim().toLowerCase()
            );
            if (existingStore) {
                throw new Error('同じ名前の店舗が既に存在します');
            }
        }

        this.storeData.stores[storeIndex] = {
            ...this.storeData.stores[storeIndex],
            ...updateData,
            updatedAt: new Date().toISOString()
        };

        this.hasUnsavedChanges = true;

        if (this.autoSaveEnabled) {
            this.saveStoreData();
        }

        return this.storeData.stores[storeIndex];
    }

    deleteStore(storeId) {
        const storeIndex = this.storeData.stores.findIndex(store => store.id === storeId);
        if (storeIndex === -1) {
            throw new Error(`店舗が見つかりません: ${storeId}`);
        }

        if (storeId === 'default-store') {
            throw new Error('デフォルト店舗は削除できません');
        }

        if (this.storeData.stores.length <= 1) {
            throw new Error('最後の店舗は削除できません');
        }

        const deletedStore = this.storeData.stores[storeIndex];
        this.storeData.stores.splice(storeIndex, 1);

        if (this.storeData.activeStoreId === storeId) {
            this.storeData.activeStoreId = this.storeData.stores[0].id;
        }

        this.hasUnsavedChanges = true;

        if (this.autoSaveEnabled) {
            this.saveStoreData();
        }

        return deletedStore;
    }

    getStores() {
        return [...this.storeData.stores];
    }

    getStoreById(storeId) {
        const store = this.storeData.stores.find(store => store.id === storeId);
        if (!store) {
            throw new Error(`店舗が見つかりません: ${storeId}`);
        }
        return { ...store };
    }

    getActiveStore() {
        if (!this.storeData.activeStoreId) {
            return null;
        }
        return this.getStoreById(this.storeData.activeStoreId);
    }

    getActiveStoreId() {
        return this.storeData.activeStoreId;
    }

    setActiveStore(storeId) {
        const store = this.getStoreById(storeId);
        this.storeData.activeStoreId = storeId;
        this.hasUnsavedChanges = true;

        if (this.autoSaveEnabled) {
            this.saveStoreData();
        }

        return store;
    }

    getStoreCount() {
        return this.storeData.stores.length;
    }

    exportStoreData() {
        return JSON.parse(JSON.stringify(this.storeData));
    }

    importStoreData(importData) {
        try {
            if (!importData.stores || !Array.isArray(importData.stores)) {
                throw new Error('無効な店舗データ形式です');
            }

            for (const store of importData.stores) {
                const validation = StoreValidator.validateStoreData(store);
                if (!validation.isValid) {
                    throw new Error(`店舗データエラー (${store.name || '不明'}): ${validation.errors.join(', ')}`);
                }
            }

            this.storeData = { ...StoreModels.getStoreStructure(), ...importData };
            this.hasUnsavedChanges = true;

            if (this.autoSaveEnabled) {
                this.saveStoreData();
            }

            return true;
        } catch (error) {
            console.error('店舗データインポートエラー:', error);
            throw error;
        }
    }
}

console.log('store-manager.js 読み込み完了');
console.log('StoreManager クラス定義:', typeof StoreManager);