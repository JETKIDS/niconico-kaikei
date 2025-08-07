# 設計文書

## 概要

既存の「もうかりまっか」会計管理システムに複数店舗管理機能を追加する設計です。現在の単一店舗データ構造を拡張し、店舗情報の管理とデータの店舗別分離を実現します。

## アーキテクチャ

### システム構成
```
┌─────────────────────────────────────┐
│           UI Layer                  │
├─────────────────────────────────────┤
│  Store Selector │ Store Management  │
│  Header Component │ Modal Component │
├─────────────────────────────────────┤
│         Business Logic Layer        │
├─────────────────────────────────────┤
│ StoreManager │ Enhanced DataManager │
├─────────────────────────────────────┤
│          Data Layer                 │
├─────────────────────────────────────┤
│    LocalStorage (Enhanced)          │
└─────────────────────────────────────┘
```

### データフロー
1. ユーザーが店舗を選択
2. StoreManagerがアクティブ店舗を設定
3. DataManagerが店舗IDでデータをフィルタリング
4. UIが店舗別データを表示

## コンポーネントと インターフェース

### 新規コンポーネント

#### ReportModeSelector コンポーネント
```javascript
class ReportModeSelector {
    // レポートモード選択
    render()
    setMode(mode) // 'single', 'consolidated', 'comparison'
    
    // イベント処理
    handleModeChange(mode)
}
```

#### StoreManager クラス
```javascript
class StoreManager {
    // 店舗の CRUD 操作
    addStore(storeData)
    updateStore(storeId, storeData)
    deleteStore(storeId)
    getStores()
    getStoreById(storeId)
    
    // アクティブ店舗管理
    setActiveStore(storeId)
    getActiveStore()
    getActiveStoreId()
    
    // データ移動
    moveDataBetweenStores(dataIds, fromStoreId, toStoreId)
}
```

#### StoreSelector コンポーネント
```javascript
class StoreSelector {
    // UI 表示・更新
    render()
    updateStoreList()
    
    // イベント処理
    handleStoreChange(storeId)
    showStoreManagement()
}
```

#### StoreManagementModal コンポーネント
```javascript
class StoreManagementModal {
    // モーダル表示
    show()
    hide()
    
    // フォーム処理
    showAddForm()
    showEditForm(storeId)
    handleSubmit(formData)
    handleDelete(storeId)
}
```

### 既存コンポーネントの拡張

#### DataManager クラス拡張
```javascript
class DataManager {
    // 既存メソッドに storeId パラメータ追加
    addRecord(category, data, storeId = null)
    getDataByCategory(category, storeId = null)
    getRecordsByMonth(year, month, storeId = null)
    
    // 新規メソッド
    getDataByStore(storeId)
    getAllStoresData()
    moveRecordToStore(category, recordId, targetStoreId)
    
    // 統合レポート用
    getConsolidatedData(category)
    getConsolidatedReportData(year, month)
    getConsolidatedYearlyData(year)
    
    // 店舗別合算計算
    calculateConsolidatedBalance(year, month)
    calculateStoreComparison(year, month)
    getStorePerformanceRanking(year, month)
}
```

#### UIManager クラス拡張
```javascript
class UIManager {
    // 店舗管理画面
    showStoreManagement()
    showStoreForm(storeData = null)
    
    // 統合レポート
    showConsolidatedReports()
    showStoreComparisonReport()
    showConsolidatedMonthlyReport(year, month)
    showConsolidatedYearlyReport(year)
    
    // データ移動
    showDataMoveDialog(recordIds)
    
    // 店舗選択モード
    setReportMode(mode) // 'single', 'consolidated', 'comparison'
}
```

## データモデル

### Store データモデル
```javascript
{
    id: "store-uuid",
    name: "店舗名",
    address: "住所",
    openDate: "2024-01-01",
    note: "備考",
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z"
}
```

### 拡張された収支データモデル
```javascript
{
    id: "record-uuid",
    storeId: "store-uuid",  // 新規追加
    year: 2024,
    month: 1,
    amount: 100000,
    category: "固定費",
    note: "備考",
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z"
}
```

### LocalStorage データ構造
```javascript
{
    // 店舗情報
    stores: [
        { id: "store-1", name: "本店", ... },
        { id: "store-2", name: "支店", ... }
    ],
    
    // アクティブ店舗ID
    activeStoreId: "store-1",
    
    // 既存の収支データ（storeId追加）
    sales: [
        { id: "record-1", storeId: "store-1", ... },
        { id: "record-2", storeId: "store-2", ... }
    ],
    purchases: [...],
    fixedCosts: [...],
    // ... 他のカテゴリー
    
    // データ移動履歴
    dataMoveHistory: [
        {
            id: "move-1",
            recordIds: ["record-1"],
            fromStoreId: "store-1",
            toStoreId: "store-2",
            movedAt: "2024-01-01T00:00:00.000Z"
        }
    ]
}
```

## エラーハンドリング

### エラーケースと対応

1. **店舗が選択されていない場合**
   - データ入力フォームを無効化
   - 「店舗を選択してください」メッセージ表示

2. **存在しない店舗IDが指定された場合**
   - デフォルト店舗に自動切り替え
   - エラーログ記録

3. **店舗削除時に関連データが存在する場合**
   - 削除確認ダイアログ表示
   - データ移動オプション提供

4. **データ移動時の重複エラー**
   - 重複確認ダイアログ表示
   - マージまたはスキップオプション提供

### バリデーション

#### 店舗データバリデーション
```javascript
validateStoreData(storeData) {
    const errors = [];
    
    if (!storeData.name || storeData.name.trim() === '') {
        errors.push('店舗名は必須です');
    }
    
    if (storeData.name && storeData.name.length > 50) {
        errors.push('店舗名は50文字以内で入力してください');
    }
    
    if (storeData.address && storeData.address.length > 200) {
        errors.push('住所は200文字以内で入力してください');
    }
    
    if (storeData.openDate && !isValidDate(storeData.openDate)) {
        errors.push('開店日の形式が正しくありません');
    }
    
    return {
        isValid: errors.length === 0,
        errors
    };
}
```

## テスト戦略

### 単体テスト
- StoreManager クラスの各メソッド
- データバリデーション機能
- データ移動機能

### 統合テスト
- 店舗切り替え時のデータ表示
- 統合レポート生成
- バックアップ・復元機能

### UIテスト
- 店舗選択ドロップダウンの動作
- 店舗管理モーダルの表示・操作
- レスポンシブデザインの確認

### データ整合性テスト
- 既存データの移行
- 店舗削除時のデータ処理
- 同時アクセス時の動作

## 実装フェーズ

### フェーズ1: 基盤機能
1. StoreManager クラス実装
2. データモデル拡張
3. 基本的な店舗CRUD操作

### フェーズ2: UI統合
1. 店舗選択ドロップダウン
2. 店舗管理画面
3. 既存画面の店舗対応

### フェーズ3: 高度な機能
1. 統合レポート機能
   - 全店舗合算レポート
   - 店舗別比較レポート
   - 店舗パフォーマンスランキング
2. データ移動機能
3. バックアップ・復元拡張

### フェーズ4: 最適化・テスト
1. パフォーマンス最適化
2. エラーハンドリング強化
3. 総合テスト

## パフォーマンス考慮事項

### データフィルタリング最適化
- 店舗IDによるインデックス作成
- メモリキャッシュの活用
- 遅延読み込みの実装

### UI応答性
- 店舗切り替え時の非同期処理
- プログレスインジケーター表示
- 大量データ時の仮想スクロール

## データ保存方式

### ローカルストレージ方式（現在の実装）
- **保存場所**: 各PCのブラウザローカルストレージ
- **データ範囲**: 全店舗のデータが各PCに保存
- **同期**: 手動でのバックアップ・復元による同期

### データ共有の考慮事項
```javascript
// 各PCで以下のデータ構造が保存される
localStorage: {
    stores: [全店舗情報],
    sales: [全店舗の売上データ],
    purchases: [全店舗の仕入れデータ],
    // ... 他のカテゴリーも全店舗分
}
```

### 簡単なデータ共有方法
1. **ワンクリック全データエクスポート**
   - 「全データをエクスポート」ボタンで即座にファイル生成
   - ファイル名に日付を自動付与

2. **ドラッグ&ドロップインポート**
   - エクスポートファイルをブラウザにドラッグするだけでインポート
   - 確認ダイアログで安全にデータ更新

3. **店舗別簡単エクスポート**
   - 店舗選択→「この店舗をエクスポート」で個別データ出力
   - 店舗名付きファイル名で自動保存

## セキュリティ考慮事項

### データ分離
- 店舗IDによる厳密なデータ分離
- クロス店舗アクセスの防止

### データ整合性
- トランザクション的なデータ操作
- 楽観的ロックによる競合回避

### ローカルデータの管理
- ブラウザのローカルストレージに全データ保存
- PCごとに独立したデータ管理
- バックアップファイルによるデータ共有

## 移行戦略

### 既存データの移行
1. 既存データにデフォルト店舗IDを付与
2. 「メイン店舗」として自動登録
3. ユーザーによる店舗情報更新

### 段階的ロールアウト
1. 店舗管理機能のみ先行リリース
2. 既存機能の店舗対応
3. 統合機能の追加

### 簡単データ共有の運用方法
1. **管理者PC**: 
   - 「全データエクスポート」ボタンでワンクリック出力
   - USBメモリやメールでファイル共有
2. **店舗PC**: 
   - ファイルをブラウザにドラッグ&ドロップでインポート
   - 必要に応じて店舗別データのみ受信
3. **定期同期**: 
   - 週次/月次での簡単ファイル共有
   - 自動バックアップ機能で安全性確保