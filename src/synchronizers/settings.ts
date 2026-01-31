import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'jsonc-parser';

export async function syncSettings(sourcePath: string) {
    console.log(`Syncing settings from ${sourcePath}`);
    const settingsPath = path.join(sourcePath, 'settings.json');
    if (!fs.existsSync(settingsPath)) {
        console.warn(`Settings file not found at ${settingsPath}`);
        return;
    }

    try {
        const content = fs.readFileSync(settingsPath, 'utf8');
        const settings = parse(content);

        if (!settings) {
            console.warn('Failed to parse settings.json');
            return;
        }

        const config = vscode.workspace.getConfiguration();

        for (const key of Object.keys(settings)) {
            // Avoid syncing hivemind settings to prevent changing the source path mid-sync or loops
            if (key.startsWith('hivemind')) {
                continue;
            }

            const value = settings[key];
            // Update global settings
            try {
                await config.update(key, value, vscode.ConfigurationTarget.Global);
            } catch (err) {
                console.error(`Failed to update setting ${key}:`, err);
            }
        }
        console.log('Settings successfully synced.');
    } catch (error) {
        console.error('Error syncing settings:', error);
    }
}
