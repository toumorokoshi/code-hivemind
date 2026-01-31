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