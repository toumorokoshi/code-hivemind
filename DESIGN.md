# Design

This document describes the motivation and approach for vscode-hivemind

## Problem Statement

Today, there are multiple vscode-based editors available, each with their own locations for storing settings and configurations. The configuration itself is very similar, but has different sychronization servers, or none at all.

For those that use multiple editors, or are migrating from one to the other, this results in:

- Adding hotkeys for only one editor, not usable in the other.
- Having to re-install extensions, debug configuration, etc.

## Proposal

The proposal is to produce a vscode-hivemind extension that allows one editor to treat another editor's settings as the source of truth. For example, you might install this extension when using [antigravity](https://antigravity.google/), and point at your vscode setttings as the synchronization point.

### User journeys

- As a user of an editor, I should be able to install my extension and use one of vscode, cursor, or antigravity settings as the source of truth.

### Scope

The proposed scope includes:

- hotkeys
- global configuration
- extensions
- debug configurations
- workspace settings

The scope does not include:

- editor-specific configuration (e.g. antigravity's agent manager settings).

## Implementation details

### Synchronization behavior

The synchronization is bi-directional, in real-time:

- as hotkeys are updated in the current editor, they are updated in the source editor.
- as hotkeys are updated in the source editor, they are updated in the current editor.

As such, both files are watched for changes, and updated in real-time. Doing so prevents the need for dealing with conflict resolution.

As the editor starts, the hivemind extension should check the source file for updates and synchronize the current editor.

### Synchronization of extensions

The synchronization of extensions is a bit trickier, as vs code uses the official vscode extension [marketplace](https://marketplace.visualstudio.com/VSCode), while other editors use the open vsx registry ([open-vsx.org](https://open-vsx.org/)).

As such, it is not often the case that the extensions match. The most robust approach is to check the registry that is used in that particular editor, and only match the extensions if they match.

However, if there is a bug, you could end up attempting to install extensions and merge bad lists together. As such:

- extensions are *uni-directional*, and will *merge* the extension list together rather than overwrite.
- when merging, if an extension fails to install (implying it does not exist in the registry), then it will be skipped for the merge.

