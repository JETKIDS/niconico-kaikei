# 設計書

## 概要

本システムは、顧客2000件と商品300点を効率的に管理する高速データ管理システムです。安定性とシンプルさを重視し、バグに強い堅牢なアーキテクチャを採用します。

## アーキテクチャ

### 技術スタック選択理由

**安定性とシンプルさを重視した技術選択:**

- **フロントエンド**: HTML + CSS + Vanilla JavaScript
  - フレームワークの複雑さを避け、ブラウザ標準技術で安定動作
  - デバッグが容易で、長期メンテナンスが可能
  
- **バックエンド**: Python + Flask
  - シンプルで理解しやすいコード
  - 豊富なライブラリと安定したエコシステム
  - エラーハンドリングが明確
  
- **データベース**: SQLite
  - ファイルベースで設定不要
  - 2000件程度のデータには十分な性能
  - バックアップが簡単（ファイルコピーのみ）
  
- **キャッシュ**: Python辞書型（メモリ内）
  - 外部依存なし
  - シンプルで確実な動作

### システム構成

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Webブラウザ    │    │  Flaskサーバー   │    │   SQLiteDB      │
│                 │◄──►│                 │◄──►│                 │
│ - 検索UI        │    │ - REST API      │    │ - 顧客テーブル   │
│ - データ表示     │    │ - データキャッシュ│    │ - 商品テーブル   │
│ - 登録フォーム   │    │ - ファイル出力   │    │ - メーカーテーブル│
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## コンポーネントと インターフェース

### 1. データベース設計

#### 顧客テーブル (customers)
```sql
CREATE TABLE customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    name_kana TEXT,
    postal_code TEXT,
    address TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    delivery_course_id INTEGER,
    contract_status TEXT DEFAULT 'active',
    emergency_contact TEXT,
    delivery_notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    version INTEGER DEFAULT 1, -- 楽観的ロック用バージョン管理
    FOREIGN KEY (delivery_course_id) REFERENCES delivery_courses(id)
);
```

#### 商品テーブル (products)
```sql
CREATE TABLE products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT,
    maker_id INTEGER,
    price DECIMAL(10,2) NOT NULL,
    jan_code TEXT UNIQUE,
    tax_category TEXT DEFAULT 'standard',
    image_path TEXT,
    description TEXT,
    is_active BOOLEAN DEFAULT 1,
    stock_status TEXT DEFAULT 'available', -- 在庫状況
    price_history TEXT, -- JSON形式で価格変更履歴を保存
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    version INTEGER DEFAULT 1, -- 楽観的ロック用バージョン管理
    FOREIGN KEY (maker_id) REFERENCES makers(id)
);
```

#### メーカーテーブル (makers)
```sql
CREATE TABLE makers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    abbreviation TEXT,
    contact_info TEXT,
    default_values TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### 配達コーステーブル (delivery_courses)
```sql
CREATE TABLE delivery_courses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    staff_name TEXT,
    area_description TEXT,
    route_order TEXT, -- JSON形式で顧客IDの順序を保存
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 2. REST API設計

#### 顧客管理API
```
GET    /api/customers              # 顧客一覧取得
GET    /api/customers/search       # 顧客検索
POST   /api/customers              # 顧客登録
PUT    /api/customers/{id}         # 顧客更新
DELETE /api/customers/{id}         # 顧客削除
POST   /api/customers/import       # CSV一括インポート
GET    /api/customers/export       # データ出力
```

#### 商品管理API
```
GET    /api/products               # 商品一覧取得
GET    /api/products/search        # 商品検索
POST   /api/products               # 商品登録
PUT    /api/products/{id}          # 商品更新
DELETE /api/products/{id}          # 商品削除
POST   /api/products/import        # Excel一括インポート
GET    /api/products/export        # データ出力
```

#### メーカー管理API
```
GET    /api/makers                 # メーカー一覧取得
POST   /api/makers                 # メーカー登録
PUT    /api/makers/{id}            # メーカー更新
DELETE /api/makers/{id}            # メーカー削除
```

#### 配達コース管理API
```
GET    /api/delivery-courses       # コース一覧取得
POST   /api/delivery-courses       # コース登録
PUT    /api/delivery-courses/{id}  # コース更新
DELETE /api/delivery-courses/{id}  # コース削除
PUT    /api/delivery-courses/{id}/route-order  # 配達順序更新
```

#### 画像管理API
```
POST   /api/products/{id}/image    # 商品画像アップロード
DELETE /api/products/{id}/image    # 商品画像削除
GET    /api/products/{id}/image    # 商品画像取得
```

### 3. フロントエンド設計

#### ページ構成
```
index.html                 # メインダッシュボード
├── customers.html         # 顧客管理ページ
├── products.html          # 商品管理ページ
├── makers.html            # メーカー管理ページ
└── delivery-courses.html  # 配達コース管理ページ
```

#### JavaScript モジュール構成
```
js/
├── app.js                 # メインアプリケーション
├── api.js                 # API通信モジュール
├── search.js              # 検索機能モジュール
├── export.js              # データ出力モジュール
├── validation.js          # バリデーションモジュール
├── virtual-scroll.js      # 仮想スクロール機能
├── image-handler.js       # 画像処理モジュール
├── drag-drop.js           # ドラッグ&ドロップ機能
└── utils.js               # ユーティリティ関数
```

#### 仮想スクロール設計

**設計理由:** 2000件の顧客データと300件の商品データを滑らかに表示するため、DOM要素を最小限に抑える仮想スクロールを実装

```javascript
class VirtualScroll {
    constructor(container, itemHeight, totalItems) {
        this.container = container;
        this.itemHeight = itemHeight;
        this.totalItems = totalItems;
        this.visibleItems = Math.ceil(container.clientHeight / itemHeight) + 2;
        this.scrollTop = 0;
        this.startIndex = 0;
        this.endIndex = this.visibleItems;
    }
    
    render(data) {
        // 表示範囲のアイテムのみDOMに追加
        const visibleData = data.slice(this.startIndex, this.endIndex);
        this.updateDOM(visibleData);
    }
}
```

## データモデル

### キャッシュ戦略

```python
# メモリキャッシュの実装
class DataCache:
    def __init__(self):
        self.customers_cache = {}
        self.products_cache = {}
        self.makers_cache = {}
        self.search_cache = {}
        self.cache_timestamp = {}
    
    def get_customers(self):
        if self._is_cache_valid('customers'):
            return self.customers_cache
        return self._refresh_customers_cache()
    
    def _is_cache_valid(self, cache_type, ttl=300):  # 5分間有効
        timestamp = self.cache_timestamp.get(cache_type)
        if not timestamp:
            return False
        return (time.time() - timestamp) < ttl
```

### 検索インデックス

```python
# 高速検索のためのインデックス作成
def create_search_indexes():
    indexes = [
        "CREATE INDEX idx_customers_name ON customers(name)",
        "CREATE INDEX idx_customers_address ON customers(address)",
        "CREATE INDEX idx_customers_phone ON customers(phone)",
        "CREATE INDEX idx_products_name ON products(name)",
        "CREATE INDEX idx_products_jan ON products(jan_code)",
        "CREATE INDEX idx_products_category ON products(category)"
    ]
    return indexes
```

## データ整合性とトランザクション管理

### 1. 楽観的ロック制御

**設計理由:** 複数ユーザーの同時アクセスでもデータ整合性を保つため、バージョン管理による楽観的ロックを実装

```python
def update_customer_with_optimistic_lock(customer_id, data, version):
    try:
        cursor.execute("""
            UPDATE customers 
            SET name=?, address=?, phone=?, version=version+1, updated_at=CURRENT_TIMESTAMP
            WHERE id=? AND version=?
        """, (data['name'], data['address'], data['phone'], customer_id, version))
        
        if cursor.rowcount == 0:
            raise ConflictError("データが他のユーザーによって更新されています")
        
        return {"success": True, "new_version": version + 1}
    except Exception as e:
        return {"success": False, "error": str(e)}
```

### 2. トランザクション管理

```python
def safe_transaction(operations):
    conn = get_db_connection()
    try:
        conn.execute("BEGIN TRANSACTION")
        for operation in operations:
            operation(conn)
        conn.commit()
        return {"success": True}
    except Exception as e:
        conn.rollback()
        return {"success": False, "error": str(e)}
    finally:
        conn.close()
```

### 3. データ整合性チェック

```python
def check_data_integrity():
    checks = [
        "SELECT COUNT(*) FROM customers WHERE delivery_course_id NOT IN (SELECT id FROM delivery_courses)",
        "SELECT COUNT(*) FROM products WHERE maker_id NOT IN (SELECT id FROM makers)",
    ]
    
    issues = []
    for check in checks:
        result = execute_query(check)
        if result[0] > 0:
            issues.append(f"整合性エラー: {check}")
    
    return issues
```

## エラーハンドリング

### 1. データベースエラー処理

```python
def safe_db_operation(operation):
    try:
        return operation()
    except sqlite3.IntegrityError as e:
        return {"error": "データの整合性エラー", "details": str(e)}
    except sqlite3.OperationalError as e:
        return {"error": "データベース操作エラー", "details": str(e)}
    except Exception as e:
        return {"error": "予期しないエラー", "details": str(e)}
```

### 2. API エラーレスポンス

```python
# 統一されたエラーレスポンス形式
{
    "success": false,
    "error": {
        "code": "VALIDATION_ERROR",
        "message": "入力データに問題があります",
        "details": {
            "field": "name",
            "reason": "必須項目です"
        }
    }
}
```

### 3. フロントエンドエラー表示

```javascript
// エラー表示の統一処理
function showError(message, details = null) {
    const errorDiv = document.getElementById('error-message');
    errorDiv.innerHTML = `
        <div class="alert alert-error">
            <strong>エラー:</strong> ${message}
            ${details ? `<br><small>${details}</small>` : ''}
        </div>
    `;
    errorDiv.style.display = 'block';
    setTimeout(() => {
        errorDiv.style.display = 'none';
    }, 5000);
}
```

## テスト戦略

### 1. 単体テスト

```python
# pytest を使用したテスト例
def test_customer_creation():
    customer_data = {
        "name": "テスト顧客",
        "address": "東京都渋谷区",
        "phone": "03-1234-5678"
    }
    result = create_customer(customer_data)
    assert result["success"] == True
    assert "id" in result["data"]
```

### 2. 統合テスト

```python
# API エンドポイントのテスト
def test_customer_search_api():
    response = client.get('/api/customers/search?q=テスト')
    assert response.status_code == 200
    assert response.json()["success"] == True
```

### 3. パフォーマンステスト

```python
# 検索速度のテスト
def test_search_performance():
    start_time = time.time()
    result = search_customers("テスト")
    end_time = time.time()
    
    assert (end_time - start_time) < 0.5  # 0.5秒以内
    assert len(result) > 0
```

### 4. フロントエンドテスト

```javascript
// 検索機能のテスト
function testSearchFunction() {
    const searchInput = document.getElementById('search-input');
    const resultsDiv = document.getElementById('search-results');
    
    searchInput.value = 'テスト';
    searchInput.dispatchEvent(new Event('input'));
    
    setTimeout(() => {
        assert(resultsDiv.children.length > 0, '検索結果が表示されること');
    }, 100);
}
```

## セキュリティ考慮事項

### 1. SQLインジェクション対策
- パラメータ化クエリの使用
- 入力値の検証とサニタイズ

### 2. XSS対策
- HTMLエスケープ処理
- CSP（Content Security Policy）の設定

### 3. ファイルアップロード対策
- ファイル形式の検証
- ファイルサイズ制限
- 安全なディレクトリへの保存

## デプロイメント

### 1. 本番環境構成
```
production/
├── app.py              # Flaskアプリケーション
├── database.db         # SQLiteデータベース
├── static/             # 静的ファイル
├── templates/          # HTMLテンプレート
├── uploads/            # アップロードファイル
└── backups/            # バックアップファイル
```

### 2. バックアップ戦略
- 日次自動バックアップ
- 週次フルバックアップ
- 外部ストレージへの保存

この設計により、安定性とシンプルさを保ちながら、要件で定義された高速データ管理機能を実現します。