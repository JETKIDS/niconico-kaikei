# 設計文書

## 概要

小規模自営業者向けの月次収支管理ソフトウェアの設計文書です。HTML/CSS/JavaScriptを使用したシンプルなWebアプリケーションとして実装し、ローカルファイルシステムでデータを管理します。

## アーキテクチャ

### 技術スタック
- **フロントエンド**: HTML5, CSS3, Vanilla JavaScript
- **データ保存**: ローカルファイル（JSON形式）
- **チャート表示**: Chart.js ライブラリ
- **ファイル操作**: File API（ブラウザ標準）

### アプリケーション構成
```
kaikei/
├── index.html          # メインページ
├── css/
│   └── style.css       # スタイルシート
├── js/
│   ├── app.js          # メインアプリケーション
│   ├── data-manager.js # データ管理
│   ├── ui-manager.js   # UI管理
│   └── chart-manager.js # グラフ管理
└── lib/
    └── chart.min.js    # Chart.js ライブラリ
```

## コンポーネントと インターフェース

### 1. データ管理コンポーネント (DataManager)

**責務**: 全データの CRUD 操作とファイル入出力

**主要メソッド**:
- `loadData()`: データファイルの読み込み
- `saveData()`: データファイルの保存
- `addRecord(category, data)`: レコード追加
- `updateRecord(category, id, data)`: レコード更新
- `deleteRecord(category, id)`: レコード削除
- `getRecordsByMonth(year, month)`: 月別データ取得
- `exportToCSV()`: CSV エクスポート

### 2. UI管理コンポーネント (UIManager)

**責務**: ユーザーインターフェースの制御と表示

**主要メソッド**:
- `renderDataTable(category, data)`: データテーブル表示
- `showInputForm(category)`: 入力フォーム表示
- `showEditForm(category, record)`: 編集フォーム表示
- `showMonthlyReport(year, month)`: 月次レポート表示
- `showValidationError(message)`: エラーメッセージ表示

### 3. グラフ管理コンポーネント (ChartManager)

**責務**: 収支グラフの生成と表示

**主要メソッド**:
- `renderMonthlyChart(data)`: 月次収支グラフ
- `renderYearlyChart(data)`: 年間推移グラフ
- `updateChart(chartId, data)`: グラフ更新

### 4. メインアプリケーション (App)

**責務**: 全体の制御とコンポーネント間の連携

**主要メソッド**:
- `init()`: アプリケーション初期化
- `handleNavigation(section)`: ナビゲーション制御
- `handleFormSubmit(category, data)`: フォーム送信処理

## データモデル

### データ構造
```javascript
{
  "sales": [
    {
      "id": "uuid",
      "year": 2024,
      "month": 1,
      "amount": 500000,
      "note": "1月売上"
    }
  ],
  "purchases": [
    {
      "id": "uuid",
      "year": 2024,
      "month": 1,
      "amount": 200000,
      "note": "商品仕入れ"
    }
  ],
  "fixedCosts": [
    {
      "id": "uuid",
      "year": 2024,
      "month": 1,
      "category": "家賃",
      "amount": 100000,
      "note": "店舗家賃"
    }
  ],
  "laborCosts": [
    {
      "id": "uuid",
      "year": 2024,
      "month": 1,
      "amount": 150000,
      "note": "アルバイト代"
    }
  ],
  "otherExpenses": [
    {
      "id": "uuid",
      "year": 2024,
      "month": 1,
      "category": "広告費",
      "amount": 30000,
      "note": "チラシ印刷"
    }
  ],
  "consumptionTax": [
    {
      "id": "uuid",
      "year": 2024,
      "month": 1,
      "amount": 25000,
      "note": "消費税"
    }
  ],
  "monthlyPayments": [
    {
      "id": "uuid",
      "year": 2024,
      "month": 1,
      "amount": 50000,
      "payee": "銀行",
      "note": "設備ローン"
    }
  ],
  "manufacturerDeposits": [
    {
      "id": "uuid",
      "year": 2024,
      "month": 1,
      "amount": 20000,
      "manufacturer": "メーカーA",
      "note": "保証金"
    }
  ]
}
```

### バリデーションルール
- 年月: 必須、数値
- 金額: 必須、正の数値
- 備考: 任意、文字列（最大200文字）
- カテゴリー: 固定費・その他費用で必須
- 返済先: 月々の返済で必須
- メーカー名: メーカー保証金で必須

## エラーハンドリング

### エラー種別と対応
1. **入力エラー**: フォームバリデーション、エラーメッセージ表示
2. **ファイル読み込みエラー**: デフォルトデータで初期化
3. **ファイル保存エラー**: 再試行プロンプト表示
4. **データ破損エラー**: バックアップからの復元提案

### エラー表示方式
- インライン表示: フォーム項目の下にエラーメッセージ
- モーダル表示: システムエラーや重要な警告
- ステータス表示: 保存成功・失敗の通知

## テスト戦略

### 単体テスト
- データ管理機能のテスト
- バリデーション機能のテスト
- 計算ロジックのテスト

### 統合テスト
- ファイル入出力のテスト
- UI操作とデータ連携のテスト
- CSV エクスポート機能のテスト

### ユーザビリティテスト
- フォーム入力の使いやすさ
- レポート表示の見やすさ
- エラーメッセージの分かりやすさ

## セキュリティ考慮事項

### データ保護
- ローカルファイルのみでデータ保存
- ネットワーク通信なし
- ブラウザのセキュリティ機能に依存

### 入力検証
- XSS対策: HTML エスケープ処理
- 数値検証: 型チェックと範囲チェック
- ファイル検証: JSON 形式の妥当性チェック

## パフォーマンス考慮事項

### データ処理
- 月別データの効率的な検索
- 大量データ時の表示制限（ページネーション）
- グラフ描画の最適化

### ファイル操作
- 差分保存による高速化
- 自動保存機能の実装
- バックアップファイルの世代管理