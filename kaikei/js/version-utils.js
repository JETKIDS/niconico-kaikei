/**
 * バージョン管理ユーティリティ関数
 */

/**
 * 手動でバージョンを更新する関数
 */
function updateVersion(type = 'patch', description = '') {
    if (window.versionManager) {
        return window.versionManager.autoIncrement(type, description);
    }
    console.warn('VersionManager が利用できません');
    return null;
}

/**
 * 新機能追加時のバージョン更新
 */
function addFeature(description) {
    document.dispatchEvent(new CustomEvent('featureAdded', {
        detail: { description: description }
    }));
    return updateVersion('minor', `新機能: ${description}`);
}

/**
 * バグ修正時のバージョン更新
 */
function fixBug(description) {
    return updateVersion('patch', `バグ修正: ${description}`);
}

/**
 * 破壊的変更時のバージョン更新
 */
function breakingChange(description) {
    document.dispatchEvent(new CustomEvent('breakingChange', {
        detail: { description: description }
    }));
    return updateVersion('major', `破壊的変更: ${description}`);
}

/**
 * バージョン情報を表示するモーダル
 */
function showVersionInfo() {
    if (!window.versionManager) {
        alert('バージョン情報が利用できません');
        return;
    }

    const versionInfo = window.versionManager.getVersionInfo();
    const history = versionInfo.history;

    let historyHTML = '';
    if (history.length > 0) {
        historyHTML = '<h4>更新履歴</h4><ul>';
        history.reverse().forEach(item => {
            const date = new Date(item.timestamp).toLocaleString('ja-JP');
            historyHTML += `<li><strong>${item.version}</strong> (${item.changeType}) - ${item.description} <small>${date}</small></li>`;
        });
        historyHTML += '</ul>';
    }

    const modalHTML = `
        <div class="modal" id="version-info-modal" style="display: block;">
            <div class="modal-content">
                <div class="form-header">
                    <h3>バージョン情報</h3>
                    <button class="close-btn" onclick="closeVersionModal()">&times;</button>
                </div>
                <div class="data-form">
                    <div class="form-group">
                        <label>現在のバージョン:</label>
                        <div style="font-size: 1.5rem; font-weight: bold; color: #8b0000;">${versionInfo.version}</div>
                    </div>
                    <div class="form-group">
                        <label>セマンティックバージョン:</label>
                        <div>${versionInfo.semantic}</div>
                    </div>
                    <div class="form-group">
                        <label>ビルド番号:</label>
                        <div>${versionInfo.build}</div>
                    </div>
                    <div class="form-group">
                        <label>最終更新:</label>
                        <div>${new Date(versionInfo.lastUpdate).toLocaleString('ja-JP')}</div>
                    </div>
                    ${historyHTML}
                    <div class="form-actions">
                        <button class="btn btn-secondary" onclick="closeVersionModal()">閉じる</button>
                        <button class="btn btn-primary" onclick="manualVersionUpdate()">手動更新</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

/**
 * バージョン情報モーダルを閉じる
 */
function closeVersionModal() {
    const modal = document.getElementById('version-info-modal');
    if (modal) {
        modal.remove();
    }
}

/**
 * 手動バージョン更新ダイアログ
 */
function manualVersionUpdate() {
    const type = prompt('更新タイプを選択してください:\n- patch (バグ修正)\n- minor (新機能)\n- major (破壊的変更)', 'patch');
    
    if (type && ['patch', 'minor', 'major'].includes(type)) {
        const description = prompt('変更内容を入力してください:', '');
        if (description !== null) {
            const newVersion = updateVersion(type, description || '手動更新');
            alert(`バージョンが更新されました: ${newVersion}`);
            closeVersionModal();
        }
    } else if (type !== null) {
        alert('無効な更新タイプです。patch, minor, major のいずれかを入力してください。');
    }
}

// バージョン表示をクリックした時のイベントリスナー
document.addEventListener('DOMContentLoaded', function() {
    // バージョン表示をクリックでバージョン情報を表示
    setTimeout(() => {
        const versionDisplay = document.getElementById('app-version');
        if (versionDisplay) {
            versionDisplay.addEventListener('click', showVersionInfo);
            versionDisplay.style.cursor = 'pointer';
            versionDisplay.title = 'クリックでバージョン情報を表示';
        }
    }, 1000);
});

// 開発者向けのグローバル関数として公開
window.versionUtils = {
    updateVersion,
    addFeature,
    fixBug,
    breakingChange,
    showVersionInfo
};

console.log('Version utilities が読み込まれました');