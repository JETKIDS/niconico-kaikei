/**
 * アプリケーションバージョン管理システム
 */
class VersionManager {
    constructor() {
        this.version = {
            major: 1,
            minor: 0,
            patch: 0,
            build: this.getBuildNumber()
        };
        this.lastUpdate = new Date().toISOString();
    }

    /**
     * ビルド番号を生成（日付ベース）
     */
    getBuildNumber() {
        const now = new Date();
        const year = now.getFullYear().toString().slice(-2);
        const month = (now.getMonth() + 1).toString().padStart(2, '0');
        const day = now.getDate().toString().padStart(2, '0');
        const hour = now.getHours().toString().padStart(2, '0');
        const minute = now.getMinutes().toString().padStart(2, '0');
        
        return `${year}${month}${day}${hour}${minute}`;
    }

    /**
     * セマンティックバージョニング形式で取得
     */
    getSemanticVersion() {
        return `${this.version.major}.${this.version.minor}.${this.version.patch}`;
    }

    /**
     * 完全なバージョン文字列を取得
     */
    getFullVersion() {
        return `v${this.getSemanticVersion()}.${this.version.build}`;
    }

    /**
     * 短縮バージョン文字列を取得
     */
    getShortVersion() {
        return `v${this.getSemanticVersion()}`;
    }

    /**
     * バージョンアップ（パッチ）
     */
    incrementPatch() {
        this.version.patch++;
        this.version.build = this.getBuildNumber();
        this.lastUpdate = new Date().toISOString();
        this.saveVersion();
        return this.getFullVersion();
    }

    /**
     * バージョンアップ（マイナー）
     */
    incrementMinor() {
        this.version.minor++;
        this.version.patch = 0;
        this.version.build = this.getBuildNumber();
        this.lastUpdate = new Date().toISOString();
        this.saveVersion();
        return this.getFullVersion();
    }

    /**
     * バージョンアップ（メジャー）
     */
    incrementMajor() {
        this.version.major++;
        this.version.minor = 0;
        this.version.patch = 0;
        this.version.build = this.getBuildNumber();
        this.lastUpdate = new Date().toISOString();
        this.saveVersion();
        return this.getFullVersion();
    }

    /**
     * バージョン情報をローカルストレージに保存
     */
    saveVersion() {
        const versionData = {
            version: this.version,
            lastUpdate: this.lastUpdate,
            updateHistory: this.getUpdateHistory()
        };
        localStorage.setItem('app-version', JSON.stringify(versionData));
    }

    /**
     * バージョン情報をローカルストレージから読み込み
     */
    loadVersion() {
        try {
            const savedData = localStorage.getItem('app-version');
            if (savedData) {
                const versionData = JSON.parse(savedData);
                this.version = versionData.version || this.version;
                this.lastUpdate = versionData.lastUpdate || this.lastUpdate;
            }
        } catch (error) {
            console.warn('バージョン情報の読み込みに失敗しました:', error);
        }
    }

    /**
     * 更新履歴を取得
     */
    getUpdateHistory() {
        try {
            const history = JSON.parse(localStorage.getItem('version-history') || '[]');
            return history.slice(-10); // 最新10件のみ保持
        } catch (error) {
            return [];
        }
    }

    /**
     * 更新履歴に追加
     */
    addToHistory(changeType, description) {
        try {
            const history = this.getUpdateHistory();
            history.push({
                version: this.getFullVersion(),
                changeType: changeType,
                description: description,
                timestamp: new Date().toISOString()
            });
            localStorage.setItem('version-history', JSON.stringify(history));
        } catch (error) {
            console.warn('更新履歴の保存に失敗しました:', error);
        }
    }

    /**
     * 自動バージョンアップ（変更検知ベース）
     */
    autoIncrement(changeType = 'patch', description = '自動更新') {
        let newVersion;
        switch (changeType) {
            case 'major':
                newVersion = this.incrementMajor();
                break;
            case 'minor':
                newVersion = this.incrementMinor();
                break;
            case 'patch':
            default:
                newVersion = this.incrementPatch();
                break;
        }
        
        this.addToHistory(changeType, description);
        console.log(`バージョンが更新されました: ${newVersion}`);
        
        // バージョン表示を更新
        this.updateVersionDisplay();
        
        return newVersion;
    }

    /**
     * バージョン表示を更新
     */
    updateVersionDisplay() {
        const versionElement = document.getElementById('app-version');
        if (versionElement) {
            versionElement.textContent = this.getShortVersion();
        }

        // タイトルも更新
        const titleElement = document.querySelector('header h1');
        if (titleElement) {
            const versionSpan = titleElement.querySelector('.version-display');
            if (versionSpan) {
                versionSpan.textContent = this.getShortVersion();
            }
        }
    }

    /**
     * 初期化
     */
    init() {
        this.loadVersion();
        this.updateVersionDisplay();
        
        // 開発モードでの自動検知（デバッグ用）
        if (this.isDevelopmentMode()) {
            this.setupAutoDetection();
        }
    }

    /**
     * 開発モードかどうかを判定
     */
    isDevelopmentMode() {
        return window.location.hostname === 'localhost' || 
               window.location.hostname === '127.0.0.1' ||
               window.location.protocol === 'file:';
    }

    /**
     * 自動検知の設定（開発モード用）
     */
    setupAutoDetection() {
        // データ変更の監視
        document.addEventListener('dataChanged', () => {
            this.autoIncrement('patch', 'データ変更');
        });

        // 設定変更の監視
        document.addEventListener('settingsChanged', () => {
            this.autoIncrement('patch', '設定変更');
        });

        // 大きな機能追加の監視（カスタムイベント）
        document.addEventListener('featureAdded', (event) => {
            this.autoIncrement('minor', event.detail?.description || '新機能追加');
        });

        // 破壊的変更の監視（カスタムイベント）
        document.addEventListener('breakingChange', (event) => {
            this.autoIncrement('major', event.detail?.description || '破壊的変更');
        });
    }

    /**
     * バージョン情報の詳細を取得
     */
    getVersionInfo() {
        return {
            version: this.getFullVersion(),
            semantic: this.getSemanticVersion(),
            build: this.version.build,
            lastUpdate: this.lastUpdate,
            history: this.getUpdateHistory()
        };
    }
}

// グローバルインスタンスを作成
window.versionManager = new VersionManager();

console.log('VersionManager が読み込まれました');