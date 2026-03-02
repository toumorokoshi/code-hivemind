import * as fs from "fs";
import * as vscode from "vscode";
import * as path from "path";
import { log } from "./log";

export class FileSynchronizer {
  private isSyncing = false;
  private watchers: fs.FSWatcher[] = [];

  constructor(
    private readonly pathA: string,
    private readonly pathB: string,
    private readonly name: string,
  ) {}

  public start() {
    if (!fs.existsSync(this.pathA)) {
      log.appendLine(`[${this.name}] Path A does not exist: ${this.pathA}`);
    }
    if (!fs.existsSync(this.pathB)) {
      // It might not exist yet, which is fine, we might create it.
      // But if neither exists, we can't do much.
      log.appendLine(`[${this.name}] Path B does not exist: ${this.pathB}`);
    }

    this.watch(this.pathA, this.pathB, "A->B");
    this.watch(this.pathB, this.pathA, "B->A");

    // Initial check?
    // We probably shouldn't blindly overwrite on start without knowing which is newer.
    // But the requirement says "check the source file for updates and synchronize the current editor".
    // Use manual sync method for startup.
  }

  public stop() {
    this.watchers.forEach((w) => w.close());
    this.watchers = [];
  }

  public async forceSyncFromTo(from: string, to: string) {
    await this.sync(from, to, "Force Sync");
  }

  private watch(source: string, target: string, direction: string) {
    if (!fs.existsSync(source)) {
      return;
    }

    try {
      const watcher = fs.watch(source, (eventType) => {
        if (eventType === "change") {
          this.sync(source, target, direction);
        }
      });
      this.watchers.push(watcher);
    } catch (err) {
      log.appendLine(`[${this.name}] Failed to watch ${source}: ${err}`);
    }
  }

  private async sync(source: string, target: string, label: string) {
    if (this.isSyncing) {
      return;
    }

    // Debounce/Lock
    this.isSyncing = true;

    try {
      // Need a small delay because fs.watch 'change' can fire while writing is still happening
      await new Promise((resolve) => setTimeout(resolve, 100));

      if (!fs.existsSync(source)) {
        return;
      }

      const sourceContent = fs.readFileSync(source, "utf8");
      let targetContent = "";
      if (fs.existsSync(target)) {
        targetContent = fs.readFileSync(target, "utf8");
      }

      if (sourceContent !== targetContent) {
        log.appendLine(
          `[${this.name}] Syncing ${label}: ${source} -> ${target}`,
        );
        fs.writeFileSync(target, sourceContent, "utf8");
      }
      vscode.window.showInformationMessage(
        `synchronized ${source} -> ${target} successfully`,
      );
    } catch (error) {
      log.appendLine(`[${this.name}] Error syncing ${label}: ${error}`);
    } finally {
      // Small cooldown to prevent echo
      setTimeout(() => {
        this.isSyncing = false;
      }, 300);
    }
  }
}
