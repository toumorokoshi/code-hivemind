import * as assert from "assert";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import {
  resolveSkillPaths,
  computeSkillsToSync,
  syncSkills,
  syncSkillsDir,
} from "../../synchronizers/skills";
import { SkillsSynchronizer } from "../../skillsSynchronizer";

suite("Skills Synchronizer Test Suite", () => {
  suite("resolveSkillPaths", () => {
    const homeDir = "/home/testuser";

    test("Antigravity appName returns gemini dir as target", () => {
      const result = resolveSkillPaths(homeDir, "Antigravity", ["~/.agents/skills"]);
      assert.strictEqual(
        result.sourceDir,
        path.join(homeDir, ".agents", "skills"),
      );
      assert.strictEqual(
        result.targetDir,
        path.join(homeDir, ".gemini", "skills"),
      );
    });

    test("Cursor appName returns cursor dir as target", () => {
      const result = resolveSkillPaths(homeDir, "Cursor", ["/custom/skills"]);
      assert.strictEqual(result.sourceDir, "/custom/skills");
      assert.strictEqual(
        result.targetDir,
        path.join(homeDir, ".cursor", "skills"),
      );
    });

    test("Default appName returns .agents/skills as target", () => {
      const result = resolveSkillPaths(homeDir, "Unknown Editor", ["/custom/skills"]);
      assert.strictEqual(
        result.targetDir,
        path.join(homeDir, ".agents", "skills"),
      );
    });

    test("expands ~ in sourceDir", () => {
      const result = resolveSkillPaths(homeDir, "Antigravity", ["~/my-skills"]);
      assert.strictEqual(result.sourceDir, path.join(homeDir, "my-skills"));
    });

    test("Symmetrical default for VS Code (syncing from Gemini)", () => {
      const result = resolveSkillPaths(homeDir, "Visual Studio Code", ["~/.gemini/skills"]);
      assert.strictEqual(result.sourceDir, path.join(homeDir, ".gemini", "skills"));
      assert.strictEqual(result.targetDir, path.join(homeDir, ".agents", "skills"));
    });

    test("resolves default source symmetrically when no config provided", () => {
      // VS Code -> Gemini
      const vsCodeResult = resolveSkillPaths(homeDir, "Visual Studio Code");
      assert.strictEqual(vsCodeResult.sourceDir, path.join(homeDir, ".gemini", "skills"));

      // Antigravity -> VS Code
      const antiResult = resolveSkillPaths(homeDir, "Antigravity");
      assert.strictEqual(antiResult.sourceDir, path.join(homeDir, ".agents", "skills"));
    });

    test("picks first existing path from array", () => {
      // Create a temp dir to simulate an existing path
      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "hivemind-skills-resolve-"));
      try {
        const result = resolveSkillPaths(homeDir, "Antigravity", [
          "/nonexistent/path1",
          tmpDir,
          "/nonexistent/path2",
        ]);
        assert.strictEqual(result.sourceDir, tmpDir);
      } finally {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      }
    });

    test("falls back to first entry when no paths exist", () => {
      const result = resolveSkillPaths(homeDir, "Antigravity", [
        "/nonexistent/first",
        "/nonexistent/second",
      ]);
      assert.strictEqual(result.sourceDir, "/nonexistent/first");
    });
  });

  suite("computeSkillsToSync", () => {
    test("new skill in source is included in result", () => {
      const source = new Map([
        ["deploy", new Map([["SKILL.md", "---\nname: deploy\n---\nDeploy steps"]])],
      ]);
      const target = new Map<string, Map<string, string>>();

      const result = computeSkillsToSync(source, target);
      assert.strictEqual(result.size, 1);
      assert.ok(result.has("deploy"));
    });

    test("changed file in existing skill is included", () => {
      const source = new Map([
        ["deploy", new Map([["SKILL.md", "updated content"]])],
      ]);
      const target = new Map([
        ["deploy", new Map([["SKILL.md", "old content"]])],
      ]);

      const result = computeSkillsToSync(source, target);
      assert.strictEqual(result.size, 1);
      assert.ok(result.has("deploy"));
    });

    test("identical skill is excluded", () => {
      const files = new Map([["SKILL.md", "same content"]]);
      const source = new Map([["deploy", new Map(files)]]);
      const target = new Map([["deploy", new Map(files)]]);

      const result = computeSkillsToSync(source, target);
      assert.strictEqual(result.size, 0);
    });

    test("skill only in target is not deleted", () => {
      const source = new Map<string, Map<string, string>>();
      const target = new Map([
        ["target-only", new Map([["SKILL.md", "content"]])],
      ]);

      const result = computeSkillsToSync(source, target);
      assert.strictEqual(result.size, 0);
    });
  });

  suite("syncSkills integration", () => {
    let tmpDir: string;

    setup(() => {
      tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "hivemind-skills-"));
    });

    teardown(() => {
      if (tmpDir && fs.existsSync(tmpDir)) {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      }
    });

    test("copies skills from source to automatically detected target", async () => {
      const sourceDir = path.join(tmpDir, "source-skills");
      const sourceSkillDir = path.join(sourceDir, "my-skill");
      fs.mkdirSync(sourceSkillDir, { recursive: true });
      fs.writeFileSync(path.join(sourceSkillDir, "SKILL.md"), "content");

      // Antigravity -> .gemini/skills
      await syncSkills(tmpDir, "Antigravity", [sourceDir]);

      const targetPath = path.join(tmpDir, ".gemini", "skills", "my-skill", "SKILL.md");
      assert.ok(fs.existsSync(targetPath));
      assert.strictEqual(fs.readFileSync(targetPath, "utf8"), "content");
    });

    test("skips sync when source and target are identical", async () => {
      const targetDir = path.join(tmpDir, ".gemini", "skills");
      fs.mkdirSync(path.join(targetDir, "skill1"), { recursive: true });
      fs.writeFileSync(path.join(targetDir, "skill1", "SKILL.md"), "original");

      // Using the target dir as source in Antigravity should do nothing
      await syncSkills(tmpDir, "Antigravity", [targetDir]);
      
      // No errors, skipped log would be seen in output
      assert.ok(fs.existsSync(path.join(targetDir, "skill1", "SKILL.md")));
    });

    test("does not delete target-only skills", async () => {
      const sourceDir = path.join(tmpDir, "source-skills");
      fs.mkdirSync(path.join(sourceDir, "source-skill"), { recursive: true });
      fs.writeFileSync(path.join(sourceDir, "source-skill", "SKILL.md"), "source");

      const targetDir = path.join(tmpDir, ".gemini", "skills");
      const targetOnlyDir = path.join(targetDir, "target-only");
      fs.mkdirSync(targetOnlyDir, { recursive: true });
      fs.writeFileSync(path.join(targetOnlyDir, "SKILL.md"), "target only");

      await syncSkills(tmpDir, "Antigravity", [sourceDir]);

      assert.ok(fs.existsSync(path.join(targetOnlyDir, "SKILL.md")));
    });

    test("syncSkillsDir can sync any two directories", async () => {
      const dirA = path.join(tmpDir, "dirA");
      const dirB = path.join(tmpDir, "dirB");
      fs.mkdirSync(path.join(dirA, "skillA"), { recursive: true });
      fs.writeFileSync(path.join(dirA, "skillA", "SKILL.md"), "contentA");

      await syncSkillsDir(dirA, dirB);

      assert.ok(fs.existsSync(path.join(dirB, "skillA", "SKILL.md")));
      assert.strictEqual(
        fs.readFileSync(path.join(dirB, "skillA", "SKILL.md"), "utf8"),
        "contentA",
      );
    });
  });

  suite("SkillsSynchronizer (Watcher) Test Suite", () => {
    let tmpDir: string;
    let sourceDir: string;
    let targetDir: string;

    setup(() => {
      tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "hivemind-sync-test-"));
      sourceDir = path.join(tmpDir, "source");
      targetDir = path.join(tmpDir, "target");
      fs.mkdirSync(sourceDir, { recursive: true });
      fs.mkdirSync(targetDir, { recursive: true });
    });

    teardown(() => {
      if (tmpDir && fs.existsSync(tmpDir)) {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      }
    });

    test("detects change and syncs from source to target", async () => {
      // Create an initial skill
      const skillDir = path.join(sourceDir, "skill1");
      fs.mkdirSync(skillDir, { recursive: true });
      const skillFile = path.join(skillDir, "SKILL.md");
      fs.writeFileSync(skillFile, "initial content");

      const synchronizer = new SkillsSynchronizer(
        tmpDir,
        "Antigravity",
        [sourceDir],
      );

      // Antigravity target is .gemini/skills
      const expectedTargetBase = path.join(tmpDir, ".gemini", "skills");
      const expectedTargetFile = path.join(
        expectedTargetBase,
        "skill1",
        "SKILL.md",
      );

      synchronizer.start();

      try {
        // Modify the source file
        fs.writeFileSync(skillFile, "updated content");

        // Wait for debounce (500ms) + some buffer
        await new Promise((resolve) => setTimeout(resolve, 1500));

        assert.ok(
          fs.existsSync(expectedTargetFile),
          "Target file should exist after sync",
        );
        assert.strictEqual(
          fs.readFileSync(expectedTargetFile, "utf8"),
          "updated content",
        );
      } finally {
        synchronizer.stop();
      }
    });

    test("detects new skill creation", async () => {
      const synchronizer = new SkillsSynchronizer(
        tmpDir,
        "Antigravity",
        [sourceDir],
      );
      const expectedTargetFile = path.join(
        tmpDir,
        ".gemini",
        "skills",
        "new-skill",
        "SKILL.md",
      );

      synchronizer.start();

      try {
        const newSkillDir = path.join(sourceDir, "new-skill");
        fs.mkdirSync(newSkillDir, { recursive: true });
        fs.writeFileSync(path.join(newSkillDir, "SKILL.md"), "new skill");

        await new Promise((resolve) => setTimeout(resolve, 1500));

        assert.ok(fs.existsSync(expectedTargetFile));
        assert.strictEqual(
          fs.readFileSync(expectedTargetFile, "utf8"),
          "new skill",
        );
      } finally {
        synchronizer.stop();
      }
    });
  });
});
