import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { FileSynchronizer } from "./fileSynchronizer";
import { syncExtensions } from "./synchronizers/extensions";
import {
  syncSkills,
  resolveSkillPaths,
  syncSkillsDir,
  DEFAULT_SKILLS_SUBDIR,
  GEMINI_SKILLS_SUBDIR,
} from "./synchronizers/skills";
import { log } from "./log";

interface ResolvedPaths {
  sourcePath: string;
  targetUserDir: string;
  sourceSettings: string;
  targetSettings: string;
  sourceKeybindings: string;
  targetKeybindings: string;
}

export class SyncManager {
  private settingsSync?: FileSynchronizer;
  private keybindingsSync?: FileSynchronizer;

  constructor(private context: vscode.ExtensionContext) {}

  private resolvePaths(): ResolvedPaths | undefined {
    const config = vscode.workspace.getConfiguration("hivemind");
    let sourcePath = config.get<string>("sourcePath");

    if (!sourcePath) {
      sourcePath = SyncManager.getDefaultSourcePath(
        process.platform,
        os.homedir(),
        process.env.APPDATA,
      );
      log.appendLine(`No source path configured. Using default: ${sourcePath}`);
    }

    if (!sourcePath || !fs.existsSync(sourcePath)) {
      log.appendLine(`Source path not valid: ${sourcePath}. Skipping.`);
      return undefined;
    }

    const globalStoragePath = this.context.globalStorageUri.fsPath;
    const targetUserDir = path.dirname(path.dirname(globalStoragePath));
    log.appendLine(`Source: ${sourcePath}`);
    log.appendLine(`Target: ${targetUserDir}`);

    return {
      sourcePath,
      targetUserDir,
      sourceSettings: path.join(sourcePath, "settings.json"),
      targetSettings: path.join(targetUserDir, "settings.json"),
      sourceKeybindings: path.join(sourcePath, "keybindings.json"),
      targetKeybindings: path.join(targetUserDir, "keybindings.json"),
    };
  }

  public async start() {
    const paths = this.resolvePaths();
    if (!paths) {
      return;
    }

    this.settingsSync = new FileSynchronizer(
      paths.sourceSettings,
      paths.targetSettings,
      "Settings",
    );
    this.keybindingsSync = new FileSynchronizer(
      paths.sourceKeybindings,
      paths.targetKeybindings,
      "Keybindings",
    );

    await this.settingsSync.forceSyncFromTo(
      paths.sourceSettings,
      paths.targetSettings,
    );
    await this.keybindingsSync.forceSyncFromTo(
      paths.sourceKeybindings,
      paths.targetKeybindings,
    );

    this.settingsSync.start();
    this.keybindingsSync.start();

    await syncExtensions(paths.sourcePath);

    log.appendLine("Syncing Skills (Source -> Target)");
    await syncSkills(
      os.homedir(),
      vscode.env.appName,
      vscode.workspace
        .getConfiguration("hivemind")
        .get<string>("skillsSourcePath"),
    );
  }

  public stop() {
    this.settingsSync?.stop();
    this.keybindingsSync?.stop();
  }

  public async sync() {
    this.stop();
    await this.start();
  }

  public async syncSourceToTarget() {
    const paths = this.resolvePaths();
    if (!paths) {
      return;
    }

    const settingsSync = new FileSynchronizer(
      paths.sourceSettings,
      paths.targetSettings,
      "Settings",
    );
    const keybindingsSync = new FileSynchronizer(
      paths.sourceKeybindings,
      paths.targetKeybindings,
      "Keybindings",
    );

    await settingsSync.forceSyncFromTo(
      paths.sourceSettings,
      paths.targetSettings,
    );
    await keybindingsSync.forceSyncFromTo(
      paths.sourceKeybindings,
      paths.targetKeybindings,
    );
    await syncExtensions(paths.sourcePath);

    log.appendLine("Syncing Skills (Source -> Target)");
    await syncSkills(
      os.homedir(),
      vscode.env.appName,
      vscode.workspace
        .getConfiguration("hivemind")
        .get<string>("skillsSourcePath"),
    );
  }

  public async syncTargetToSource() {
    const paths = this.resolvePaths();
    if (!paths) {
      return;
    }

    const settingsSync = new FileSynchronizer(
      paths.sourceSettings,
      paths.targetSettings,
      "Settings",
    );
    const keybindingsSync = new FileSynchronizer(
      paths.sourceKeybindings,
      paths.targetKeybindings,
      "Keybindings",
    );

    await settingsSync.forceSyncFromTo(
      paths.targetSettings,
      paths.sourceSettings,
    );
    await keybindingsSync.forceSyncFromTo(
      paths.targetKeybindings,
      paths.sourceKeybindings,
    );

    log.appendLine("Syncing Skills (Target -> Source)");
    const { targetDir, sourceDir } = resolveSkillPaths(
      os.homedir(),
      vscode.env.appName,
      vscode.workspace
        .getConfiguration("hivemind")
        .get<string>("skillsSourcePath"),
    );
    await syncSkillsDir(targetDir, sourceDir);
  }

  public static getDefaultSourcePath(
    platform: string,
    homeDir: string,
    appData?: string,
  ): string | undefined {
    switch (platform) {
      case "darwin":
        return path.join(
          homeDir,
          "Library",
          "Application Support",
          "Code",
          "User",
        );
      case "win32":
        return path.join(
          appData || path.join(homeDir, "AppData", "Roaming"),
          "Code",
          "User",
        );
      case "linux":
        return path.join(homeDir, ".config", "Code", "User");
      default:
        return undefined;
    }
  }
}
