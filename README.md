# niconico-kaikei

これは、日々の収支を管理するための会計アプリケーションです。

## 技術スタック
*   HTML
*   CSS
*   JavaScript (Vanilla JS)
*   Chart.js

## 主なファイル構成
*   `kaikei/index.html`: メインのHTMLファイル
*   `kaikei/js/app.js`: アプリケーション全体の制御
*   `kaikei/js/data-manager.js`: データの管理（読み込み、保存など）
*   `kaikei/js/ui-manager.js`: UIの表示・操作
*   `kaikei/js/chart-manager.js`: グラフの描画

## GitHubリポジトリ
*   [https://github.com/JETKIDS/niconico-kaikei](https://github.com/JETKIDS/niconico-kaikei)

## 開発フロー
1.  `main`ブランチから作業用のブランチを作成する (`feature/...`, `fix/...`など)
2.  作業ブランチで開発とコミットを行う
3.  GitHubにプッシュし、`main`ブランチへのプルリクエストを作成する
4.  レビュー後、プルリクエストをマージする

## 🏷️ バージョン管理
このプロジェクトは **自動バージョン管理** を採用しています。

### 自動バージョンアップ
- `main`ブランチへのコミット時に自動的にバージョンが更新されます
- コミットメッセージに基づいてバージョンアップタイプが決定されます

### コミットメッセージ規約
- `feat:` `add:` → **マイナーバージョンアップ** (新機能)
- `fix:` `update:` → **パッチバージョンアップ** (バグ修正・改善)  
- `major:` `BREAKING CHANGE:` → **メジャーバージョンアップ** (破壊的変更)

詳細は [コミットメッセージ規約](.github/COMMIT_CONVENTION.md) を参照してください。

## ライセンス
このプロジェクトはMITライセンスの下で公開されています。詳細は[LICENSE](LICENSE)ファイルをご覧ください。

## 貢献
プルリクエストやイシューの報告を歓迎します。このプロジェクトを改善するためのご協力をお待ちしています。
