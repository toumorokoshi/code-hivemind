import * as vscode from "vscode";
import { SyncManager } from "./syncManager";
import { log } from "./log";

let syncManager: SyncManager | undefined;

export function activate(context: vscode.ExtensionContext) {
  log.appendLine("Hivemind extension activated.");

  syncManager = new SyncManager(context);

  // Start watchers immediately
  syncManager
    .start()
    .catch((err: any) => log.appendLine(`Hivemind start failed: ${err}`));

  const registerSyncCommand = (
    commandId: string,
    action: () => Promise<void>,
    successMessage: string,
  ) =>
    vscode.commands.registerCommand(commandId, async () => {
      try {
        if (syncManager) {
          await action();
          vscode.window.showInformationMessage(successMessage);
        }
      } catch (error: any) {
        vscode.window.showErrorMessage(
          `Hivemind: Sync failed. ${error.message}`,
        );
        log.appendLine(`Sync error: ${error}`);
      }
    });

  context.subscriptions.push(
    log,
    registerSyncCommand(
      "hivemind.sync",
      () => syncManager!.sync(),
      "Hivemind: Synchronization completed successfully.",
    ),
    registerSyncCommand(
      "hivemind.syncSourceToTarget",
      () => syncManager!.syncSourceToTarget(),
      "Hivemind: Source → Target sync completed.",
    ),
    registerSyncCommand(
      "hivemind.syncTargetToSource",
      () => syncManager!.syncTargetToSource(),
      "Hivemind: Target → Source sync completed.",
    ),
  );
}

export function deactivate() {
  if (syncManager) {
    syncManager.stop();
  }
}
