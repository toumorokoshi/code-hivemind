import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";
import { log } from "./log";
import { resolveSkillPaths, syncSkillsDir } from "./synchronizers/skills";

export class SkillsSynchronizer {
  private isSyncing = false;
  private watchers: fs.FSWatcher[] = [];
  private readonly MAX_DEPTH = 3;

  constructor(
    private readonly homeDir: string,
    private readonly appName: string,
    private readonly configSourceDirs?: string[],
  ) {}

  public start() {
    const { sourceDir, targetDir } = resolveSkillPaths(
      this.homeDir,
      this.appName,
      this.configSourceDirs,
    );

    if (sourceDir === targetDir) {
      return;
    }

    this.watchRecursive(sourceDir, targetDir, "Source->Target", 0);
    this.watchRecursive(targetDir, sourceDir, "Target->Source", 0);
  }

  public stop() {
    this.watchers.forEach((w) => w.close());
    this.watchers = [];
  }

  private watchRecursive(
    watchPath: string,
    syncTarget: string,
    label: string,
    depth: number,
  ) {
    if (depth > this.MAX_DEPTH || !fs.existsSync(watchPath)) {
      return;
    }

    const stats = fs.statSync(watchPath);
    if (!stats.isDirectory()) {
      return;
    }

    try {
      const watcher = fs.watch(watchPath, (eventType, filename) => {
        log.appendLine(
          `[SkillsSync] ${label} change detected in ${watchPath}: ${filename} (${eventType})`,
        );

        // If a new directory was added, we should watch it too
        if (filename && eventType === "rename") {
          const fullPath = path.join(watchPath, filename);
          if (fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory()) {
            this.watchRecursive(fullPath, syncTarget, label, depth + 1);
          }
        }

        this.debouncedSync(watchPath, syncTarget, label);
      });
      this.watchers.push(watcher);

      // Recursively watch subdirectories
      const entries = fs.readdirSync(watchPath, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory()) {
          this.watchRecursive(
            path.join(watchPath, entry.name),
            syncTarget,
            label,
            depth + 1,
          );
        }
      }
    } catch (err) {
      log.appendLine(`[SkillsSync] Failed to watch ${watchPath}: ${err}`);
    }
  }

  private syncTimeout?: NodeJS.Timeout;

  private debouncedSync(source: string, target: string, label: string) {
    if (this.syncTimeout) {
      clearTimeout(this.syncTimeout);
    }

    this.syncTimeout = setTimeout(() => {
      this.sync(source, target, label);
    }, 500); // 500ms debounce
  }

  private async sync(source: string, target: string, label: string) {
    if (this.isSyncing) {
      return;
    }

    this.isSyncing = true;
    try {
      // For skills, we always sync the root directories to ensure consistency
      const { sourceDir, targetDir } = resolveSkillPaths(
        this.homeDir,
        this.appName,
        this.configSourceDirs,
      );

      if (label === "Source->Target") {
        await syncSkillsDir(sourceDir, targetDir);
      } else {
        await syncSkillsDir(targetDir, sourceDir);
      }
    } catch (error) {
      log.appendLine(`[SkillsSync] Error during ${label}: ${error}`);
    } finally {
      // Small cooldown to prevent echo
      setTimeout(() => {
        this.isSyncing = false;
      }, 1000);
    }
  }
}
