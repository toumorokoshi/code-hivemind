import * as assert from "assert";
import * as path from "path";
import { SyncManager } from "../../syncManager";

suite("SyncManager Test Suite", () => {
  test("getDefaultSourcePath returns correct path for linux", () => {
    const homeDir = "/home/user";
    const result = SyncManager.getDefaultSourcePath("linux", homeDir);
    assert.strictEqual(result, path.join(homeDir, ".config", "Code", "User"));
  });

  test("getDefaultSourcePath returns correct path for darwin", () => {
    const homeDir = "/Users/user";
    const result = SyncManager.getDefaultSourcePath("darwin", homeDir);
    assert.strictEqual(
      result,
      path.join(homeDir, "Library", "Application Support", "Code", "User"),
    );
  });

  test("getDefaultSourcePath returns correct path for win32 with APPDATA", () => {
    const homeDir = "C:\\Users\\user";
    const appData = "C:\\Users\\user\\AppData\\Roaming";
    const result = SyncManager.getDefaultSourcePath("win32", homeDir, appData);
    assert.strictEqual(result, path.join(appData, "Code", "User"));
  });

  test("getDefaultSourcePath returns correct path for win32 without APPDATA", () => {
    const homeDir = "C:\\Users\\user";
    const result = SyncManager.getDefaultSourcePath("win32", homeDir);
    assert.strictEqual(
      result,
      path.join(homeDir, "AppData", "Roaming", "Code", "User"),
    );
  });
});
