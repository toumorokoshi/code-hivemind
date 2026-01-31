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

    // Old integration test removed as logic moved to watchers.
    // See fileSynchronizer.test.ts for logic verification.
    /*
    test('Sync Settings Test', async () => {
         ...
    });
    */
});
