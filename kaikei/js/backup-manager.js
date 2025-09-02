/**
 * バックアップ・データ管理クラス
 * データのエクスポート、インポート、バックアップ機能を提供
 */
class BackupManager {
    constructor(dataManager, storeManager) {
        this.dataManager = dataManager;
        this.storeManager = storeManager;
        this.backupPrefix = 'kaikei-backup-';
        this.maxBackups = 10; // 最大バックアップ数
    }

    /**
     * 全データをエクスポート
     */
    exportAllData() {
        try {
            const exportData = {
                version: window.versionManager ? window.versionManager.getFullVersion() : '1.0.0',
                exportDate: new Date().toISOString(),
                data: {
                    // 会計データ
                    sales: this.dataManager.getDataByCategory('sales'),
                    purchases: this.dataManager.getDataByCategory('purchases'),
                    fixedCosts: this.dataManager.getDataByCategory('fixedCosts'),
                    variableCosts: this.dataManager.getDataByCategory('variableCosts'),
                    laborCosts: this.dataManager.getDataByCategory('laborCosts'),
                    consumptionTax: this.dataManager.getDataByCategory('consumptionTax'),
                    monthlyPayments: this.dataManager.getDataByCategory('monthlyPayments'),
                    manufacturerDeposits: this.dataManager.getDataByCategory('manufacturerDeposits')
                },
                stores: this.storeManager.getStores(),
                settings: {
                    activeStoreId: this.storeManager.getActiveStoreId()
                }
            };

            // データ統計を追加
            exportData.statistics = this.generateDataStatistics(exportData.data);

            const jsonString = JSON.stringify(exportData, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            
            // ファイル名生成（日時付き）
            const now = new Date();
            const dateStr = now.toISOString().slice(0, 19).replace(/[T:]/g, '-');
            const filename = `kaikei-backup-${dateStr}.json`;
            
            // ダウンロード実行
            this.downloadBlob(blob, filename);
            
            console.log('✓ データエクスポート完了:', filename);
            return { success: true, filename, recordCount: this.countTotalRecords(exportData.data) };
            
        } catch (error) {
            console.error('データエクスポートエラー:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * データをインポート
     */
    async importData(file) {
        try {
            const jsonText = await this.readFileAsText(file);
            const importData = JSON.parse(jsonText);
            
            // データ形式の検証
            const validation = this.validateImportData(importData);
            if (!validation.valid) {
                throw new Error(`無効なデータ形式: ${validation.errors.join(', ')}`);
            }
            
            // 現在のデータをバックアップ
            await this.createAutoBackup('import-before');
            
            // データのインポート実行
            const result = await this.performDataImport(importData);
            
            console.log('✓ データインポート完了');
            return result;
            
        } catch (error) {
            console.error('データインポートエラー:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * 自動バックアップ作成
     */
    async createAutoBackup(reason = 'auto') {
        try {
            const backupData = {
                version: window.versionManager ? window.versionManager.getFullVersion() : '1.0.0',
                backupDate: new Date().toISOString(),
                reason: reason,
                data: {
                    sales: this.dataManager.getDataByCategory('sales'),
                    purchases: this.dataManager.getDataByCategory('purchases'),
                    fixedCosts: this.dataManager.getDataByCategory('fixedCosts'),
                    variableCosts: this.dataManager.getDataByCategory('variableCosts'),
                    laborCosts: this.dataManager.getDataByCategory('laborCosts'),
                    consumptionTax: this.dataManager.getDataByCategory('consumptionTax'),
                    monthlyPayments: this.dataManager.getDataByCategory('monthlyPayments'),
                    manufacturerDeposits: this.dataManager.getDataByCategory('manufacturerDeposits')
                },
                stores: this.storeManager.getStores(),
                settings: {
                    activeStoreId: this.storeManager.getActiveStoreId()
                }
            };

            // バックアップをローカルストレージに保存
            const backupKey = this.backupPrefix + Date.now();
            localStorage.setItem(backupKey, JSON.stringify(backupData));
            
            // 古いバックアップを削除
            this.cleanupOldBackups();
            
            console.log('✓ 自動バックアップ作成完了:', backupKey);
            return { success: true, backupKey };
            
        } catch (error) {
            console.error('自動バックアップエラー:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * バックアップ一覧取得
     */
    getBackupList() {
        console.log('getBackupList called');
        console.log('localStorage length:', localStorage.length);
        console.log('backupPrefix:', this.backupPrefix);
        
        const backups = [];
        
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            console.log('Checking key:', key);
            
            if (key && key.startsWith(this.backupPrefix)) {
                console.log('Found backup key:', key);
                try {
                    const backupData = JSON.parse(localStorage.getItem(key));
                    console.log('Backup data:', backupData);
                    
                    backups.push({
                        key: key,
                        date: backupData.backupDate,
                        reason: backupData.reason || 'manual',
                        version: backupData.version || 'unknown',
                        recordCount: this.countTotalRecords(backupData.data)
                    });
                } catch (error) {
                    console.warn('無効なバックアップデータ:', key, error);
                }
            }
        }
        
        console.log('Found backups:', backups);
        
        // 日付順でソート（新しい順）
        backups.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        console.log('Sorted backups:', backups);
        return backups;
    }

    /**
     * デバッグ用：LocalStorageの内容を表示
     */
    debugLocalStorage() {
        console.log('=== LocalStorage Debug ===');
        console.log('Total items:', localStorage.length);
        
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            const value = localStorage.getItem(key);
            console.log(`${i}: ${key} = ${value.substring(0, 100)}...`);
        }
        
        console.log('=== Backup items only ===');
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(this.backupPrefix)) {
                console.log(`Backup: ${key}`);
            }
        }
    }

    /**
     * バックアップから復元
     */
    async restoreFromBackup(backupKey) {
        try {
            const backupData = localStorage.getItem(backupKey);
            if (!backupData) {
                throw new Error('バックアップデータが見つかりません');
            }
            
            const parsedData = JSON.parse(backupData);
            
            // 現在のデータをバックアップ
            await this.createAutoBackup('restore-before');
            
            // データの復元実行
            const result = await this.performDataImport(parsedData);
            
            console.log('✓ バックアップから復元完了');
            return result;
            
        } catch (error) {
            console.error('バックアップ復元エラー:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * データインポートの実行
     */
    async performDataImport(importData) {
        let importedRecords = 0;
        let errors = [];
        
        try {
            // 店舗データのインポート
            if (importData.stores && Array.isArray(importData.stores)) {
                for (const store of importData.stores) {
                    try {
                        await this.storeManager.addStore(store.name, store.description || '');
                        console.log('店舗インポート:', store.name);
                    } catch (error) {
                        if (!error.message.includes('既に存在')) {
                            errors.push(`店舗 ${store.name}: ${error.message}`);
                        }
                    }
                }
            }
            
            // 会計データのインポート
            const categories = ['sales', 'purchases', 'fixedCosts', 'variableCosts', 
                              'laborCosts', 'consumptionTax', 'monthlyPayments', 'manufacturerDeposits'];
            
            // データの場所を特定（新形式と旧形式の両方に対応）
            let dataSource = importData.data || importData;
            
            for (const category of categories) {
                if (dataSource[category] && Array.isArray(dataSource[category])) {
                    console.log(`${category}カテゴリーのインポート開始: ${dataSource[category].length}件`);
                    
                    // 既存データを取得
                    const existingRecords = this.dataManager.getDataByCategory(category);
                    let skippedCount = 0;
                    let updatedCount = 0;
                    
                    for (const record of dataSource[category]) {
                        try {
                            // 重複チェック（ID、年月、金額、店舗IDで判定）
                            const isDuplicate = existingRecords.some(existing => 
                                existing.id === record.id || 
                                (existing.year === record.year && 
                                 existing.month === record.month && 
                                 existing.amount === record.amount && 
                                 existing.storeId === record.storeId)
                            );
                            
                            if (isDuplicate) {
                                console.log(`重複データをスキップ: ${category} - ${record.year}年${record.month}月 ${record.amount}円`);
                                skippedCount++;
                            } else {
                                await this.dataManager.addRecord(category, record);
                                importedRecords++;
                            }
                        } catch (error) {
                            console.error(`${category}レコードインポートエラー:`, error);
                            errors.push(`${category} レコード: ${error.message}`);
                        }
                    }
                    
                    console.log(`${category}カテゴリーのインポート完了 - 追加: ${dataSource[category].length - skippedCount}件, スキップ: ${skippedCount}件`);
                }
            }
            
            // 設定の復元
            if (importData.settings && importData.settings.activeStoreId) {
                try {
                    this.storeManager.setActiveStore(importData.settings.activeStoreId);
                } catch (error) {
                    console.warn('アクティブ店舗設定の復元に失敗:', error);
                }
            }
            
            // 重複スキップ数を計算
            const totalRecords = categories.reduce((total, category) => {
                return total + (dataSource[category] ? dataSource[category].length : 0);
            }, 0);
            const skippedRecords = totalRecords - importedRecords - errors.length;
            
            return {
                success: true,
                importedRecords,
                skippedRecords,
                totalRecords,
                errors,
                hasErrors: errors.length > 0
            };
            
        } catch (error) {
            return {
                success: false,
                error: error.message,
                importedRecords,
                errors
            };
        }
    }

    /**
     * インポートデータの検証
     */
    validateImportData(data) {
        const errors = [];
        const warnings = [];
        
        console.log('検証中のデータ構造:', Object.keys(data));
        console.log('データの詳細:', data);
        
        if (!data || typeof data !== 'object') {
            errors.push('データが無効です');
            return { valid: false, errors, warnings };
        }
        
        // 会計データの確認（より柔軟に）
        let hasAccountingData = false;
        if (data.data && typeof data.data === 'object') {
            hasAccountingData = true;
            console.log('新形式の会計データが見つかりました:', Object.keys(data.data));
        } else {
            // 直接カテゴリーがある場合もチェック（旧形式）
            const categories = ['sales', 'purchases', 'fixedCosts', 'variableCosts', 
                              'laborCosts', 'consumptionTax', 'monthlyPayments', 'manufacturerDeposits'];
            const foundCategories = categories.filter(cat => data[cat] && Array.isArray(data[cat]));
            if (foundCategories.length > 0) {
                hasAccountingData = true;
                console.log(`旧形式の会計データが見つかりました。カテゴリー: ${foundCategories.join(', ')}`);
                warnings.push(`旧形式のデータファイルです。正常にインポートされます。`);
            }
        }
        
        if (!hasAccountingData) {
            errors.push('会計データが見つかりません');
        }
        
        // 店舗データの確認（より柔軟に）
        let hasStoreData = false;
        if (data.stores && Array.isArray(data.stores)) {
            hasStoreData = true;
            console.log('店舗データが見つかりました:', data.stores.length, '件');
        } else {
            warnings.push('店舗データが見つかりません。現在の店舗設定を使用します。');
        }
        
        return { 
            valid: errors.length === 0, 
            errors, 
            warnings,
            hasAccountingData,
            hasStoreData
        };
    }

    /**
     * データ統計生成
     */
    generateDataStatistics(data) {
        const stats = {};
        
        for (const [category, records] of Object.entries(data)) {
            if (Array.isArray(records)) {
                stats[category] = {
                    count: records.length,
                    totalAmount: records.reduce((sum, record) => sum + (Number(record.amount) || 0), 0)
                };
            }
        }
        
        return stats;
    }

    /**
     * 総レコード数カウント
     */
    countTotalRecords(data) {
        let total = 0;
        for (const records of Object.values(data)) {
            if (Array.isArray(records)) {
                total += records.length;
            }
        }
        return total;
    }

    /**
     * 古いバックアップの削除
     */
    cleanupOldBackups() {
        const backups = this.getBackupList();
        
        if (backups.length > this.maxBackups) {
            const toDelete = backups.slice(this.maxBackups);
            toDelete.forEach(backup => {
                localStorage.removeItem(backup.key);
                console.log('古いバックアップを削除:', backup.key);
            });
        }
    }

    /**
     * ファイルをテキストとして読み込み
     */
    readFileAsText(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(new Error('ファイル読み込みエラー'));
            reader.readAsText(file);
        });
    }

    /**
     * Blobをダウンロード
     */
    downloadBlob(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.style.display = 'none';
        
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        // メモリリークを防ぐためURLを解放
        setTimeout(() => URL.revokeObjectURL(url), 100);
    }
}

console.log('BackupManager が読み込まれました');