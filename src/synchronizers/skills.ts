import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";
import { log } from "../log";

export const DEFAULT_SKILLS_SUBDIR = ".agents/skills";
// see https://antigravity.google/docs/skills
export const GEMINI_SKILLS_SUBDIR = ".gemini/antigravity/skills";

const EDITOR_SKILL_DIRS: Record<string, string> = {
  Antigravity: GEMINI_SKILLS_SUBDIR,
  Cursor: ".cursor/skills",
  "Visual Studio Code": DEFAULT_SKILLS_SUBDIR,
};

export interface SkillPaths {
  sourceDir: string;
  targetDir: string;
}

export function resolveSkillPaths(
  homeDir: string,
  appName: string,
  configSourceDir?: string,
): SkillPaths {
  let sourcePath = configSourceDir;

  if (!sourcePath) {
    // Symmetrical default: if in VS Code, target Gemini. In Gemini, target VS Code.
    const sourceSubDir =
      appName === "Visual Studio Code"
        ? GEMINI_SKILLS_SUBDIR
        : DEFAULT_SKILLS_SUBDIR;
    sourcePath = path.join(homeDir, sourceSubDir);
  } else if (sourcePath.startsWith("~")) {
    // Expand ~ if present in configSourceDir
    sourcePath = path.join(homeDir, sourcePath.slice(1));
  }

  const targetSubDir = EDITOR_SKILL_DIRS[appName] || DEFAULT_SKILLS_SUBDIR;
  const targetDir = path.join(homeDir, targetSubDir);

  return { sourceDir: sourcePath, targetDir };
}

export function computeSkillsToSync(
  sourceSkills: Map<string, Map<string, string>>,
  targetSkills: Map<string, Map<string, string>>,
): Map<string, Map<string, string>> {
  const result = new Map<string, Map<string, string>>();

  for (const [skillName, sourceFiles] of sourceSkills) {
    const targetFiles = targetSkills.get(skillName);

    if (!targetFiles) {
      result.set(skillName, sourceFiles);
      continue;
    }

    const hasChanges = [...sourceFiles].some(([filePath, content]) => {
      return targetFiles.get(filePath) !== content;
    });

    if (hasChanges) {
      result.set(skillName, sourceFiles);
    }
  }

  return result;
}

function readSkillsDirectory(dir: string): Map<string, Map<string, string>> {
  const skills = new Map<string, Map<string, string>>();

  if (!fs.existsSync(dir)) {
    return skills;
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }
    const skillDir = path.join(dir, entry.name);
    const files = readDirectoryRecursive(skillDir, skillDir);
    if (files.size > 0) {
      skills.set(entry.name, files);
    }
  }

  return skills;
}

function readDirectoryRecursive(
  baseDir: string,
  currentDir: string,
): Map<string, string> {
  const files = new Map<string, string>();
  const entries = fs.readdirSync(currentDir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(currentDir, entry.name);
    const relativePath = path.relative(baseDir, fullPath);

    if (entry.isDirectory()) {
      const subFiles = readDirectoryRecursive(baseDir, fullPath);
      for (const [subPath, content] of subFiles) {
        files.set(subPath, content);
      }
    } else {
      files.set(relativePath, fs.readFileSync(fullPath, "utf8"));
    }
  }

  return files;
}

function writeSkillToDirectory(
  targetDir: string,
  skillName: string,
  files: Map<string, string>,
) {
  const skillDir = path.join(targetDir, skillName);
  for (const [relativePath, content] of files) {
    const fullPath = path.join(skillDir, relativePath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, content, "utf8");
  }
}

export async function syncSkills(
  homeDir: string,
  appName: string,
  configSourceDir?: string,
) {
  const { sourceDir, targetDir } = resolveSkillPaths(
    homeDir,
    appName,
    configSourceDir,
  );

  await syncSkillsDir(sourceDir, targetDir);
}

export async function syncSkillsDir(sourceDir: string, targetDir: string) {
  if (sourceDir === targetDir) {
    log.appendLine(
      "Source and target skills directories are identical. Skipping.",
    );
    return;
  }

  log.appendLine(`Syncing skills from ${sourceDir} to ${targetDir}...`);

  if (!fs.existsSync(sourceDir)) {
    log.appendLine(
      `Source skills directory does not exist: ${sourceDir}. Skipping skill sync.`,
    );
    return;
  }

  const sourceSkills = readSkillsDirectory(sourceDir);
  if (sourceSkills.size === 0) {
    log.appendLine("No skills found in source directory. Skipping.");
    return;
  }

  log.appendLine(`Found ${sourceSkills.size} skill(s) in source.`);

  const targetSkills = readSkillsDirectory(targetDir);
  const toSync = computeSkillsToSync(sourceSkills, targetSkills);

  if (toSync.size === 0) {
    log.appendLine(`${targetDir}: already up to date.`);
    vscode.window.showInformationMessage(
      `skills ${sourceDir} -> ${targetDir} already up to date`,
    );
    return;
  }

  log.appendLine(`${targetDir}: syncing ${toSync.size} skill(s)...`);

  for (const [skillName, files] of toSync) {
    try {
      writeSkillToDirectory(targetDir, skillName, files);
      log.appendLine(`  ✓ ${skillName}`);
    } catch (error) {
      log.appendLine(`  ✗ ${skillName}: ${error}`);
    }
  }

  vscode.window.showInformationMessage(
    `synchronized skills ${sourceDir} -> ${targetDir} successfully`,
  );
}
