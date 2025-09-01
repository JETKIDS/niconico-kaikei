# コミットメッセージ規約

このプロジェクトでは、コミットメッセージに基づいて自動的にバージョンが更新されます。

## 📋 コミットメッセージの形式

```
<type>: <description>

[optional body]

[optional footer]
```

## 🏷️ バージョンアップのタイプ

### 🔴 Major Version (破壊的変更)
以下のキーワードを含むコミットは **メジャーバージョン** をアップします：
- `BREAKING CHANGE:`
- `breaking:`
- `major:`

**例:**
```bash
git commit -m "major: APIの仕様を大幅変更

BREAKING CHANGE: 旧バージョンとの互換性がありません"
```

### 🟡 Minor Version (新機能)
以下のキーワードを含むコミットは **マイナーバージョン** をアップします：
- `feat:`
- `feature:`
- `minor:`
- `add:`

**例:**
```bash
git commit -m "feat: 新しいレポート機能を追加"
git commit -m "add: CSVエクスポート機能を実装"
```

### 🟢 Patch Version (バグ修正・改善)
以下のキーワードを含むコミットは **パッチバージョン** をアップします：
- `fix:`
- `bug:`
- `patch:`
- `update:`
- `refactor:`
- `docs:`
- `style:`
- `test:`

**例:**
```bash
git commit -m "fix: データ保存時のバグを修正"
git commit -m "update: UIの表示を改善"
git commit -m "docs: READMEを更新"
```

## 🎯 推奨コミットメッセージ例

### 新機能追加
```bash
git commit -m "feat: 店舗比較レポート機能を追加

- 複数店舗の収益を比較表示
- グラフによる視覚的な比較
- CSVエクスポート対応"
```

### バグ修正
```bash
git commit -m "fix: 日付選択時のエラーを修正

- parseInt基数指定の問題を解決
- null/undefined チェックを追加"
```

### 破壊的変更
```bash
git commit -m "major: データ構造を大幅変更

BREAKING CHANGE: 
- 旧バージョンのデータとの互換性なし
- 新しいマイグレーション機能が必要"
```

### ドキュメント更新
```bash
git commit -m "docs: インストール手順を更新"
```

### リファクタリング
```bash
git commit -m "refactor: バリデーション処理を改善

- コードの可読性向上
- パフォーマンス最適化"
```

## 🔄 自動バージョン更新の流れ

1. **コミット** → GitHub Actions が起動
2. **メッセージ解析** → バージョンアップタイプを決定
3. **ファイル更新** → `version.js` と `index.html` を更新
4. **タグ作成** → Git タグを自動作成
5. **リリース作成** → Major/Minor の場合はGitHubリリースを作成

## 📊 バージョン番号の構成

```
v1.2.3.2309151430
│ │ │ └─ ビルド番号 (YYMMDDHHMMSS)
│ │ └─── パッチバージョン
│ └───── マイナーバージョン  
└─────── メジャーバージョン
```

## 🛠️ 手動バージョン更新

緊急時やテスト時は手動でもバージョンを更新できます：

```bash
# パッチバージョンアップ
git commit -m "patch: 緊急バグ修正" --allow-empty

# マイナーバージョンアップ  
git commit -m "feat: 手動バージョンアップ" --allow-empty

# メジャーバージョンアップ
git commit -m "major: 手動メジャーアップ" --allow-empty
```

## 📝 注意事項

- コミットメッセージは **日本語** でも **英語** でも構いません
- キーワードは **大文字小文字を区別しません**
- 複数のタイプが含まれる場合は、**最も重要度の高いもの** が適用されます
- `main` ブランチへのプッシュ時のみバージョンが更新されます