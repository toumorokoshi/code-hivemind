import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { syncSettings } from './synchronizers/settings';
import { syncKeybindings } from './synchronizers/keybindings';
import { syncExtensions } from './synchronizers/extensions';

export class SyncManager {
    constructor(private context: vscode.ExtensionContext) { }

    public async sync() {
        const config = vscode.workspace.getConfiguration('hivemind');
        const sourcePath = config.get<string>('sourcePath');

        if (!sourcePath) {
            throw new Error('No source path configured. Please set "hivemind.sourcePath".');
        }

        if (!fs.existsSync(sourcePath)) {
            throw new Error(`Source path does not exist: ${sourcePath}`);
        }

        // HEURISTIC: Find target User directory from globalStorageUri
        // globalStorageUri: .../User/globalStorage/vscode-hivemind
        // We want .../User
        const globalStoragePath = this.context.globalStorageUri.fsPath;
        const targetUserDir = path.dirname(path.dirname(path.dirname(globalStoragePath)));

        // Verify strictly if it looks like a User dir?
        // Actually, let's just use it. If it doesn't contain settings.json, we might be creating it?
        console.log(`Target User Dir estimated at: ${targetUserDir}`);

        // Run synchronizers
        await syncSettings(sourcePath);
        await syncKeybindings(sourcePath, targetUserDir);
        await syncExtensions(sourcePath);
    }
}
