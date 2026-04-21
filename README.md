# Code Hivemind

An extension to help keep settings synchronized across Code OSS (vscode,
vscodium, etc) based editors. the idea is to bi-directionally synchronize
settings, keybindings, and to some extent extensions between multiple editors,
simplifying management of your editor configuration when working with multiple
Code OSS editors.

The `code-hivemind` extension allows you to synchronize settings, keybindings,
and extensions from another editor (the "source", defaulting to vscode) to your
current editor.

## Features

- **Bi-directional Real-time Sync**: Automatically synchronizes changes between
  your current editor and the source editor for:
    - `settings.json`
    - `keybindings.json`
- **Extensions Sync**: Installs extensions listed in the source's
  `extensions.json` (on command or startup).

## Configuration

1.  Open VS Code Settings (`Ctrl+,`).
2.  Search for `Hivemind`.
3.  Set `Hivemind: Source Path` to a list of absolute paths to the **User Data
    Directory** of the source editor. The first path that exists on the
    filesystem will be used. If the list is empty, the default VS Code directory
    for your operating system is used.

    **Example:**
    ```json
    "hivemind.sourcePath": [
      "/home/user/.config/Code/User",
      "/home/user/.config/Code - Insiders/User"
    ]
    ```

4.  Optionally set `Hivemind: Skills Source Path` to a list of absolute paths
    to the source global skills directory. The first path that exists on the
    filesystem will be used. Defaults to `["~/.agents/skills"]`.

    **Example:**
    ```json
    "hivemind.skillsSourcePath": [
      "~/.agents/skills",
      "~/.gemini/skills"
    ]
    ```

## Usage

Synchronization starts automatically when the extension activates (on startup).

To manually force a re-sync or extension check:
1.  Open the Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P`).
2.  Run the command: `Hivemind: Sync`.

## Development

### Verification

To verify the installation manually:
1.  Run `npm run compile` to build the extension.
2.  Press `F5` in VS Code to launch the Extension Development Host.
3.  In the new window, configure `hivemind.sourcePath` to a valid directory
    containing `settings.json`.
4.  Modify `settings.json` in the "Source" folder and watch it update in the
    "Extension Host" window immediately.

### Tests

Integration tests are included in `src/test/suite/extension.test.ts`. Run them
using:
```bash
npm test
```
*Note: Running tests requires a graphical environment or proper configuration
for headless execution.*

## Package

To package the extension, run:

```bash
npm run package
```

Then the extension can be installed with:

```bash
code --install-extension code-hivemind-0.0.1.vsix
```