// シンプルなStoreManagerクラス（テスト用）
console.log('store-manager-simple.js 読み込み開始');

/**
 * 店舗管理クラス（シンプル版）
 */
class StoreManager {
    constructor() {
        this.stores = [
            { id: 'default-store', name: 'メイン店舗' }
        ];
        this.activeStoreId = 'default-store';
        console.log('StoreManager インスタンス作成完了');
    }

    async loadStoreData() {
        console.log('店舗データ読み込み完了');
        return true;
    }

    getStores() {
        return this.stores;
    }

    getActiveStoreId() {
        return this.activeStoreId;
    }

    getActiveStore() {
        return this.stores.find(store => store.id === this.activeStoreId);
    }

    getStoreById(storeId) {
        const store = this.stores.find(store => store.id === storeId);
        if (!store) {
            throw new Error(`店舗が見つかりません: ${storeId}`);
        }
        return store;
    }

    setActiveStore(storeId) {
        this.activeStoreId = storeId;
        return this.getStoreById(storeId);
    }

    getStoreCount() {
        return this.stores.length;
    }
}

console.log('store-manager-simple.js 読み込み完了');
console.log('StoreManager クラス定義:', typeof StoreManager);