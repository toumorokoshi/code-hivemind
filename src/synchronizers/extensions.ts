import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { parse } from "jsonc-parser";
import { log } from "../log";

export async function syncExtensions(sourcePath: string) {
  log.appendLine(`Syncing extensions from ${sourcePath}...`);

  // Logic: Uni-directional merge.
  // 1. Read source extensions list.
  // 2. Attempt to install each.
  // 3. If install fails (e.g. not in registry), skip and warn.
  // 4. Do NOT uninstall anything.

  const extensionsJsonPath = path.join(sourcePath, "extensions.json");
  if (fs.existsSync(extensionsJsonPath)) {
    try {
      const content = fs.readFileSync(extensionsJsonPath, "utf8");
      const data = parse(content);
      const recommendations = data.recommendations || [];

      if (Array.isArray(recommendations)) {
        log.appendLine(`Found ${recommendations.length} extensions to merge.`);
        for (const extId of recommendations) {
          await installExtension(extId);
        }
      }
    } catch (err) {
      log.appendLine(`Error reading extensions.json: ${err}`);
    }
  } else {
    log.appendLine(
      "No extensions.json found in source User directory. Skipping extension sync.",
    );
  }
}

async function installExtension(id: string) {
  // Check if already installed to avoid redundant calls?
  // vscode.extensions.getExtension(id) check might be fast.
  if (vscode.extensions.getExtension(id)) {
    // Already installed
    return;
  }

  try {
    log.appendLine(`Merging extension: ${id}`);
    await vscode.commands.executeCommand(
      "workbench.extensions.installExtension",
      id,
    );
    log.appendLine(`Successfully installed/merged: ${id}`);
  } catch (error) {
    // Critical: Skip validation failure for merge strategy.
    log.appendLine(
      `Failed to install extension ${id}. It may not exist in the current registry. Skipping merge for this item. ${error}`,
    );
  }
}
