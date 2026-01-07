# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Obsidian Daily Note Collector is an Obsidian plugin that automatically adds links to your daily note whenever new files are created in your vault. It uses the `obsidian-daily-notes-interface` library to interact with daily notes.

## Development Setup

This repo should live inside an Obsidian vault's plugins folder for development and testing:
```
~/plugin_test/.obsidian/plugins/obsidian-daily-note-collector/
```

This allows hot-reload testing with the Obsidian Hot Reload plugin.

## Build Commands

```bash
npm run dev      # Development build with watch mode
npm run build    # Production build (runs tsc -noEmit then esbuild)
```

## Version Bumping & Releases

To release a new version:

1. Update `minAppVersion` in `manifest.json` if needed
2. Run one of:
   - `npm version patch` - bug fixes (1.0.0 → 1.0.1)
   - `npm version minor` - new features (1.0.0 → 1.1.0)
   - `npm version major` - breaking changes (1.0.0 → 2.0.0)
3. This automatically runs `version-bump.mjs` which updates `manifest.json` and `versions.json`
4. Create a GitHub release with tag matching the version (e.g., `1.2.0`, no "v" prefix)
5. Attach `manifest.json`, `main.js` to the release

## Architecture

- **main.ts** - Main plugin class, handles file create/delete events, links files to daily note
- **DailyNoteCollectorPluginSettings.ts** - Settings interface and defaults
- **DailyNoteCollectorSettingTab.ts** - Settings UI using Obsidian's PluginSettingTab

Key flow: `vault.on("create")` → `shouldCollectFile()` checks settings/patterns → generates link → appends to daily note (optionally under a specific heading)
