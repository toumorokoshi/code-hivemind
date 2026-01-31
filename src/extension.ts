import * as vscode from 'vscode';
import { SyncManager } from './syncManager';

export function activate(context: vscode.ExtensionContext) {
    console.log('Congratulations, your extension "vscode-hivemind" is now active!');

    const syncManager = new SyncManager(context);

    let disposable = vscode.commands.registerCommand('hivemind.sync', async () => {
        try {
            await syncManager.sync();
            vscode.window.showInformationMessage('Hivemind: Synchronization completed successfully.');
        } catch (error: any) {
            vscode.window.showErrorMessage(`Hivemind: Sync failed. ${error.message}`);
            console.error(error);
        }
    });

    context.subscriptions.push(disposable);
}

export function deactivate() { }
