import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { FileSynchronizer } from './fileSynchronizer';
import { syncExtensions } from './synchronizers/extensions';

export class SyncManager {
    private settingsSync?: FileSynchronizer;
    private keybindingsSync?: FileSynchronizer;

    constructor(private context: vscode.ExtensionContext) { }

    public async start() {
        const config = vscode.workspace.getConfiguration('hivemind');
        let sourcePath = config.get<string>('sourcePath');

        if (!sourcePath) {
            sourcePath = this.getDefaultSourcePath();
            console.log(`Hivemind: No source path configured. Using default: ${sourcePath}`);
        }

        if (!sourcePath || !fs.existsSync(sourcePath)) {
            console.log(`Hivemind: Source path not valid: ${sourcePath}. Skipping watchers.`);
            return;
        }

        // HEURISTIC: Find target User directory from globalStorageUri
        const globalStoragePath = this.context.globalStorageUri.fsPath;
        const targetUserDir = path.dirname(path.dirname(globalStoragePath));
        console.log(`Target User Dir estimated at: ${targetUserDir}`);

        // Paths
        const sourceSettings = path.join(sourcePath, 'settings.json');
        const targetSettings = path.join(targetUserDir, 'settings.json');

        const sourceKeybindings = path.join(sourcePath, 'keybindings.json');
        const targetKeybindings = path.join(targetUserDir, 'keybindings.json');

        // Initialize Synchronizers
        this.settingsSync = new FileSynchronizer(sourceSettings, targetSettings, 'Settings');
        this.keybindingsSync = new FileSynchronizer(sourceKeybindings, targetKeybindings, 'Keybindings');

        // Startup: Sync FROM source TO target (as per design)
        await this.settingsSync.forceSyncFromTo(sourceSettings, targetSettings);
        await this.keybindingsSync.forceSyncFromTo(sourceKeybindings, targetKeybindings);

        // Start Watchers
        this.settingsSync.start();
        this.keybindingsSync.start();

        // Extensions (kept as one-off for now, or maybe watcher on extensions.json later)
        await syncExtensions(sourcePath);
    }

    public stop() {
        this.settingsSync?.stop();
        this.keybindingsSync?.stop();
    }

    public async sync() {
        // Wrapper for manual sync command - essentially restarts logic or forces source->target
        this.stop();
        await this.start();
    }

    private getDefaultSourcePath(): string | undefined {
        const homeDir = os.homedir();
        switch (process.platform) {
            case 'darwin':
                return path.join(homeDir, 'Library', 'Application Support', 'Code', 'User');
            case 'win32':
                return path.join(process.env.APPDATA || path.join(homeDir, 'AppData', 'Roaming'), 'Code', 'User');
            case 'linux':
                return path.join(homeDir, '.config', 'Code', 'User');
            default:
                return undefined;
        }
    }
}
