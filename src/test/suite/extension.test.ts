import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

suite('Hivemind Test Suite', () => {
    vscode.window.showInformationMessage('Start all tests.');

    let tmpDir: string;

    setup(() => {
        tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'hivemind-test-'));
    });

    teardown(() => {
        if (tmpDir && fs.existsSync(tmpDir)) {
            fs.rmSync(tmpDir, { recursive: true, force: true });
        }
    });

    test('Sync Settings Test', async () => {
        // Create dummy settings.json
        const settingsPath = path.join(tmpDir, 'settings.json');
        const settingsContent = {
            "hivemind.test.setting": "successful"
        };
        fs.writeFileSync(settingsPath, JSON.stringify(settingsContent));

        // Configure source path
        const config = vscode.workspace.getConfiguration('hivemind');
        await config.update('sourcePath', tmpDir, vscode.ConfigurationTarget.Global);

        // Run sync
        await vscode.commands.executeCommand('hivemind.sync');

        // Verify setting
        // Note: It might take a moment for settings to propagate? Usually update() is async but return waits.
        const val = vscode.workspace.getConfiguration().get('hivemind.test.setting');
        assert.strictEqual(val, 'successful');
    });
});
