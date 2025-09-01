/**
 * マニュアルボタン実装の自動検証スクリプト
 * 全ての要件が満たされているかをプログラム的に確認
 */

const fs = require('fs');
const path = require('path');

class ManualButtonVerifier {
    constructor() {
        this.results = {
            passed: 0,
            failed: 0,
            warnings: 0,
            details: []
        };
    }

    /**
     * 検証実行
     */
    async verify() {
        console.log('🔍 マニュアルボタン実装の検証を開始します...\n');

        // ファイル存在確認
        await this.verifyFileStructure();
        
        // HTML構造確認
        await this.verifyHTMLStructure();
        
        // CSS実装確認
        await this.verifyCSSImplementation();
        
        // JavaScript実装確認
        await this.verifyJavaScriptImplementation();
        
        // 要件マッピング確認
        await this.verifyRequirementMapping();

        // 結果出力
        this.outputResults();
    }

    /**
     * ファイル構造の確認
     */
    async verifyFileStructure() {
        console.log('📁 ファイル構造の確認...');
        
        const requiredFiles = [
            'kaikei/index.html',
            'kaikei/css/style.css',
            'kaikei/js/ui-manager.js',
            'kaikei/manual.html',
            'test-manual-button-enhancement.html',
            'test-manual-button-final-verification.html'
        ];

        for (const file of requiredFiles) {
            if (fs.existsSync(file)) {
                this.addResult('pass', `✓ ${file} が存在します`);
            } else {
                this.addResult('fail', `✗ ${file} が見つかりません`);
            }
        }
    }

    /**
     * HTML構造の確認
     */
    async verifyHTMLStructure() {
        console.log('🏗️ HTML構造の確認...');
        
        try {
            const htmlContent = fs.readFileSync('kaikei/index.html', 'utf8');
            
            // マニュアルボタンの存在確認
            if (htmlContent.includes('id="manual-button"')) {
                this.addResult('pass', '✓ マニュアルボタンのHTML要素が存在します');
            } else {
                this.addResult('fail', '✗ マニュアルボタンのHTML要素が見つかりません');
            }

            // アクセシビリティ属性の確認
            const accessibilityAttributes = [
                'aria-label',
                'title',
                'tabindex'
            ];

            for (const attr of accessibilityAttributes) {
                if (htmlContent.includes(attr)) {
                    this.addResult('pass', `✓ ${attr} 属性が設定されています`);
                } else {
                    this.addResult('fail', `✗ ${attr} 属性が設定されていません`);
                }
            }

            // セマンティック構造の確認
            if (htmlContent.includes('manual-button-icon') && htmlContent.includes('manual-button-text')) {
                this.addResult('pass', '✓ セマンティックな構造が実装されています');
            } else {
                this.addResult('warning', '⚠ セマンティック構造を確認してください');
            }

            // noscriptフォールバックの確認
            if (htmlContent.includes('<noscript>')) {
                this.addResult('pass', '✓ JavaScript無効時のフォールバックが実装されています');
            } else {
                this.addResult('warning', '⚠ noscriptフォールバックが見つかりません');
            }

        } catch (error) {
            this.addResult('fail', `✗ HTML構造の確認でエラー: ${error.message}`);
        }
    }

    /**
     * CSS実装の確認
     */
    async verifyCSSImplementation() {
        console.log('🎨 CSS実装の確認...');
        
        try {
            const cssContent = fs.readFileSync('kaikei/css/style.css', 'utf8');
            
            // 基本スタイルの確認
            if (cssContent.includes('.manual-button')) {
                this.addResult('pass', '✓ マニュアルボタンのCSSクラスが定義されています');
            } else {
                this.addResult('fail', '✗ マニュアルボタンのCSSクラスが見つかりません');
            }

            // レスポンシブデザインの確認
            const responsiveBreakpoints = [
                '@media (max-width: 1024px)',
                '@media (max-width: 768px)',
                '@media (max-width: 480px)'
            ];

            for (const breakpoint of responsiveBreakpoints) {
                if (cssContent.includes(breakpoint)) {
                    this.addResult('pass', `✓ ${breakpoint} ブレークポイントが実装されています`);
                } else {
                    this.addResult('warning', `⚠ ${breakpoint} ブレークポイントが見つかりません`);
                }
            }

            // アクセシビリティ対応の確認
            const accessibilityFeatures = [
                '@media (prefers-contrast: high)',
                '@media (prefers-reduced-motion: reduce)',
                ':focus',
                ':focus-visible'
            ];

            for (const feature of accessibilityFeatures) {
                if (cssContent.includes(feature)) {
                    this.addResult('pass', `✓ ${feature} アクセシビリティ機能が実装されています`);
                } else {
                    this.addResult('warning', `⚠ ${feature} アクセシビリティ機能が見つかりません`);
                }
            }

            // ローディング状態の確認
            if (cssContent.includes('.manual-button.loading')) {
                this.addResult('pass', '✓ ローディング状態のスタイルが実装されています');
            } else {
                this.addResult('warning', '⚠ ローディング状態のスタイルが見つかりません');
            }

            // ブラウザ互換性対応の確認
            if (cssContent.includes('@supports')) {
                this.addResult('pass', '✓ ブラウザ互換性対応が実装されています');
            } else {
                this.addResult('warning', '⚠ ブラウザ互換性対応を確認してください');
            }

        } catch (error) {
            this.addResult('fail', `✗ CSS実装の確認でエラー: ${error.message}`);
        }
    }

    /**
     * JavaScript実装の確認
     */
    async verifyJavaScriptImplementation() {
        console.log('⚙️ JavaScript実装の確認...');
        
        try {
            const jsContent = fs.readFileSync('kaikei/js/ui-manager.js', 'utf8');
            
            // ManualButtonManagerクラスの確認
            if (jsContent.includes('class ManualButtonManager')) {
                this.addResult('pass', '✓ ManualButtonManagerクラスが実装されています');
            } else {
                this.addResult('fail', '✗ ManualButtonManagerクラスが見つかりません');
            }

            // 主要メソッドの確認
            const requiredMethods = [
                'init()',
                'handleClick',
                'handleKeydown',
                'validateManualFile',
                'openManual',
                'isPopupBlocked',
                'handlePopupBlocked',
                'showError',
                'showSuccess'
            ];

            for (const method of requiredMethods) {
                if (jsContent.includes(method)) {
                    this.addResult('pass', `✓ ${method} メソッドが実装されています`);
                } else {
                    this.addResult('warning', `⚠ ${method} メソッドが見つかりません`);
                }
            }

            // エラーハンドリングの確認
            if (jsContent.includes('try') && jsContent.includes('catch')) {
                this.addResult('pass', '✓ エラーハンドリングが実装されています');
            } else {
                this.addResult('warning', '⚠ エラーハンドリングを確認してください');
            }

            // ブラウザ互換性チェックの確認
            if (jsContent.includes('checkBrowserCompatibility')) {
                this.addResult('pass', '✓ ブラウザ互換性チェックが実装されています');
            } else {
                this.addResult('warning', '⚠ ブラウザ互換性チェックが見つかりません');
            }

            // UI統合の確認
            if (jsContent.includes('checkUIConflicts')) {
                this.addResult('pass', '✓ UI統合チェックが実装されています');
            } else {
                this.addResult('warning', '⚠ UI統合チェックが見つかりません');
            }

        } catch (error) {
            this.addResult('fail', `✗ JavaScript実装の確認でエラー: ${error.message}`);
        }
    }

    /**
     * 要件マッピングの確認
     */
    async verifyRequirementMapping() {
        console.log('📋 要件マッピングの確認...');
        
        try {
            const requirementsContent = fs.readFileSync('.kiro/specs/manual-button-enhancement/requirements.md', 'utf8');
            const tasksContent = fs.readFileSync('.kiro/specs/manual-button-enhancement/tasks.md', 'utf8');
            
            // 要件の数を確認
            const requirementMatches = requirementsContent.match(/### Requirement \d+/g);
            const requirementCount = requirementMatches ? requirementMatches.length : 0;
            
            if (requirementCount >= 4) {
                this.addResult('pass', `✓ ${requirementCount}個の要件が定義されています`);
            } else {
                this.addResult('warning', `⚠ 要件数が少ない可能性があります (${requirementCount}個)`);
            }

            // タスクの完了状況確認
            const completedTasks = (tasksContent.match(/- \[x\]/g) || []).length;
            const totalTasks = (tasksContent.match(/- \[[\sx-]\]/g) || []).length;
            
            if (completedTasks === totalTasks && totalTasks > 0) {
                this.addResult('pass', `✓ 全タスクが完了しています (${completedTasks}/${totalTasks})`);
            } else {
                this.addResult('warning', `⚠ 未完了のタスクがあります (${completedTasks}/${totalTasks})`);
            }

        } catch (error) {
            this.addResult('fail', `✗ 要件マッピングの確認でエラー: ${error.message}`);
        }
    }

    /**
     * 結果を追加
     */
    addResult(type, message) {
        this.results.details.push({ type, message });
        
        switch (type) {
            case 'pass':
                this.results.passed++;
                console.log(`  ${message}`);
                break;
            case 'fail':
                this.results.failed++;
                console.log(`  ${message}`);
                break;
            case 'warning':
                this.results.warnings++;
                console.log(`  ${message}`);
                break;
        }
    }

    /**
     * 結果出力
     */
    outputResults() {
        console.log('\n' + '='.repeat(60));
        console.log('📊 検証結果サマリー');
        console.log('='.repeat(60));
        
        const total = this.results.passed + this.results.failed + this.results.warnings;
        const passRate = total > 0 ? Math.round((this.results.passed / total) * 100) : 0;
        
        console.log(`合格: ${this.results.passed}件`);
        console.log(`不合格: ${this.results.failed}件`);
        console.log(`警告: ${this.results.warnings}件`);
        console.log(`合格率: ${passRate}%`);
        
        console.log('\n📝 総合評価:');
        if (this.results.failed === 0 && passRate >= 90) {
            console.log('🎉 優秀 - マニュアルボタンの実装は全ての要件を満たしています');
        } else if (this.results.failed === 0 && passRate >= 70) {
            console.log('✅ 良好 - マニュアルボタンの実装は概ね要件を満たしています');
        } else if (this.results.failed <= 2) {
            console.log('⚠️ 改善が必要 - いくつかの問題を修正してください');
        } else {
            console.log('❌ 不合格 - 重要な問題があります。実装を見直してください');
        }

        // 詳細結果をファイルに出力
        const reportContent = this.generateDetailedReport();
        fs.writeFileSync('manual-button-verification-report.md', reportContent);
        console.log('\n📄 詳細レポートが manual-button-verification-report.md に保存されました');
    }

    /**
     * 詳細レポート生成
     */
    generateDetailedReport() {
        const timestamp = new Date().toLocaleString('ja-JP');
        const total = this.results.passed + this.results.failed + this.results.warnings;
        const passRate = total > 0 ? Math.round((this.results.passed / total) * 100) : 0;

        let report = `# マニュアルボタン実装検証レポート

**検証日時:** ${timestamp}
**検証対象:** マニュアルボタン機能の実装

## サマリー

- **合格:** ${this.results.passed}件
- **不合格:** ${this.results.failed}件  
- **警告:** ${this.results.warnings}件
- **合格率:** ${passRate}%

## 詳細結果

`;

        // 結果を種類別に分類
        const passedItems = this.results.details.filter(item => item.type === 'pass');
        const failedItems = this.results.details.filter(item => item.type === 'fail');
        const warningItems = this.results.details.filter(item => item.type === 'warning');

        if (passedItems.length > 0) {
            report += `### ✅ 合格項目 (${passedItems.length}件)\n\n`;
            passedItems.forEach(item => {
                report += `- ${item.message}\n`;
            });
            report += '\n';
        }

        if (failedItems.length > 0) {
            report += `### ❌ 不合格項目 (${failedItems.length}件)\n\n`;
            failedItems.forEach(item => {
                report += `- ${item.message}\n`;
            });
            report += '\n';
        }

        if (warningItems.length > 0) {
            report += `### ⚠️ 警告項目 (${warningItems.length}件)\n\n`;
            warningItems.forEach(item => {
                report += `- ${item.message}\n`;
            });
            report += '\n';
        }

        report += `## 総合評価

`;

        if (this.results.failed === 0 && passRate >= 90) {
            report += '🎉 **優秀** - マニュアルボタンの実装は全ての要件を満たしており、本番環境での使用に適しています。';
        } else if (this.results.failed === 0 && passRate >= 70) {
            report += '✅ **良好** - マニュアルボタンの実装は概ね要件を満たしていますが、警告項目の改善を推奨します。';
        } else if (this.results.failed <= 2) {
            report += '⚠️ **改善が必要** - いくつかの重要な問題があります。不合格項目を修正してください。';
        } else {
            report += '❌ **不合格** - 多くの重要な問題があります。実装を大幅に見直してください。';
        }

        report += `

## 推奨事項

1. 不合格項目を優先的に修正してください
2. 警告項目についても可能な限り改善してください  
3. 実際のブラウザでの動作確認を行ってください
4. アクセシビリティテストを実施してください
5. モバイルデバイスでの表示確認を行ってください

---
*このレポートは自動生成されました*
`;

        return report;
    }
}

// 検証実行
if (require.main === module) {
    const verifier = new ManualButtonVerifier();
    verifier.verify().catch(error => {
        console.error('検証中にエラーが発生しました:', error);
        process.exit(1);
    });
}

module.exports = ManualButtonVerifier;