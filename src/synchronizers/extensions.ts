import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'jsonc-parser';

export async function syncExtensions(sourcePath: string) {
    console.log(`Syncing extensions from ${sourcePath}`);

    // Look for extensions.json in the source User directory
    // This is not a standard file, but part of the hivemind design implies a "source of truth".
    // Users might maintain a list here, OR we could look for a `extensions` directory pointer.

    const extensionsJsonPath = path.join(sourcePath, 'extensions.json');
    if (fs.existsSync(extensionsJsonPath)) {
        try {
            const content = fs.readFileSync(extensionsJsonPath, 'utf8');
            const data = parse(content);
            const recommendations = data.recommendations || [];

            if (Array.isArray(recommendations)) {
                for (const extId of recommendations) {
                    await installExtension(extId);
                }
            }
        } catch (err) {
            console.error('Error reading extensions.json:', err);
        }
    } else {
        console.log('No extensions.json found in source User directory. Skipping extension sync.');
    }
}

async function installExtension(id: string) {
    try {
        console.log(`Installing extension: ${id}`);
        await vscode.commands.executeCommand('workbench.extensions.installExtension', id);
    } catch (error) {
        console.error(`Failed to install extension ${id}:`, error);
    }
}
