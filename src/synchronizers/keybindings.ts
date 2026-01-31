import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export async function syncKeybindings(sourcePath: string, targetUserDir: string) {
    console.log(`Syncing keybindings from ${sourcePath} to ${targetUserDir}`);
    const sourceKeybindingsPath = path.join(sourcePath, 'keybindings.json');
    const targetKeybindingsPath = path.join(targetUserDir, 'keybindings.json');

    if (!fs.existsSync(sourceKeybindingsPath)) {
        console.warn(`Source keybindings not found: ${sourceKeybindingsPath}`);
        return;
    }

    try {
        const content = fs.readFileSync(sourceKeybindingsPath, 'utf8');
        fs.writeFileSync(targetKeybindingsPath, content, 'utf8');
        console.log(`Keybindings synced to ${targetKeybindingsPath}`);
    } catch (error) {
        console.error(`Failed to sync keybindings:`, error);
    }
}

