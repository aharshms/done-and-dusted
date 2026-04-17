# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Done & Dusted is a Chrome extension that replaces the new tab page with a minimal, elegant to-do list manager. Users can create multiple projects, each with its own task list.

## Architecture

- **manifest.json** - Chrome Extension Manifest V3 configuration
- **newtab.html** - Main HTML structure that replaces Chrome's new tab
- **styles.css** - Light minimal theme styling
- **app.js** - Core application logic including:
  - Project management (CRUD)
  - Todo management (CRUD with inline editing)
  - Chrome sync storage for cross-device persistence
  - Canvas-based graffiti animation on task completion

## Key Features

- Projects displayed as pill-shaped tabs at top
- Two task statuses: pending and completed
- Completed tasks show strikethrough and move to bottom of list
- Inline editing of task text
- Graffiti/spray paint animation plays when marking tasks complete
- Data syncs across Chrome browsers via `chrome.storage.sync`

## Loading the Extension

1. Add PNG icons (16x16, 48x48, 128x128) to `/icons/` folder
2. Open `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked" and select this project folder

## Data Structure

```javascript
{
  projects: [
    {
      id: string,
      name: string,
      todos: [
        { id: string, text: string, completed: boolean }
      ]
    }
  ],
  activeProjectId: string | null
}
```

## Chrome Storage

Uses `chrome.storage.sync` API - data is limited to ~100KB total and ~8KB per item. The `saveData()` and `loadData()` functions in app.js handle persistence.
