import * as vscode from 'vscode';
import { SyncManager } from './syncManager';


let syncManager: SyncManager | undefined;

export function activate(context: vscode.ExtensionContext) {
    console.log('Congratulations, your extension "vscode-hivemind" is now active!');

    syncManager = new SyncManager(context);

    // Start watchers immediately
    syncManager.start().catch((err: any) => console.error('Hivemind start failed:', err));

    let disposable = vscode.commands.registerCommand('hivemind.sync', async () => {
        try {
            if (syncManager) {
                await syncManager.sync();
                vscode.window.showInformationMessage('Hivemind: Synchronization completed successfully.');
            }
        } catch (error: any) {
            vscode.window.showErrorMessage(`Hivemind: Sync failed. ${error.message}`);
            console.error(error);
        }
    });

    context.subscriptions.push(disposable);
}

export function deactivate() {
    if (syncManager) {
        syncManager.stop();
    }
}
