# VSCode Hivemind

A tool to help keep vscode settings synchronized across vscode-based editors.

The `vscode-hivemind` extension allows you to synchronize settings, keybindings, and extensions from another editor instance (the "source") to your current editor.

## Features

- **Settings Sync**: Merges settings from the source `settings.json` into your global configuration.
- **Keybindings Sync**: Overwrites your `keybindings.json` with the source's version.
- **Extensions Sync**: Installs extensions listed in the source's `extensions.json` (if available).

## Configuration

1.  Open VS Code Settings (`Ctrl+,`).
2.  Search for `Hivemind`.
3.  Set `Hivemind: Source Path` to the absolute path of the **User Data Directory** of the source editor.

    **Examples:**
    - **Linux (VS Code)**: `/home/user/.config/Code/User`
    - **Mac (VS Code)**: `/Users/user/Library/Application Support/Code/User`
    - **Windows (VS Code)**: `C:\Users\user\AppData\Roaming\Code\User`

## Usage

1.  Open the Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P`).
2.  Run the command: `Hivemind: Sync`.
3.  The extension will:
    - update your global settings.
    - copy the keybindings file.
    - attempt to install recommended extensions.
4.  A notification will appear upon completion.

## Development

### Verification

To verify the installation manually:
1.  Run `npm run compile` to build the extension.
2.  Press `F5` in VS Code to launch the Extension Development Host.
3.  In the new window, configure `hivemind.sourcePath` to a valid directory containing `settings.json`.
4.  Run `Hivemind: Sync` and verify changes are applied.

### Tests

Integration tests are included in `src/test/suite/extension.test.ts`.
Run them using:
```bash
npm test
```
*Note: Running tests requires a graphical environment or proper configuration for headless execution.*