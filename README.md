# Done & Dusted - Chrome New Tab To-Do List Extension

A minimal, elegant to-do list Chrome extension that transforms your new tab page into a productivity hub. Manage tasks effortlessly every time you open a new browser tab.

[![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-green?logo=googlechrome)](https://chrome.google.com)
[![Manifest V3](https://img.shields.io/badge/Manifest-V3-blue)](https://developer.chrome.com/docs/extensions/mv3/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Why Done & Dusted?

Stop switching between apps to manage your tasks. Done & Dusted puts your to-do list front and center every time you open a new tab, keeping your priorities visible and your productivity high.

## Features

- **New Tab Replacement** - Your to-do list appears instantly when opening new tabs
- **Multiple Projects** - Organize tasks into separate projects with pill-shaped tab navigation
- **Cross-Device Sync** - Tasks sync seamlessly across all your Chrome browsers
- **Inline Editing** - Click any task to edit it directly
- **Celebration Animations** - Satisfying graffiti spray animation when completing tasks
- **Minimal Design** - Clean, distraction-free interface with a light theme
- **Offline Support** - Works without internet connection
- **Zero Configuration** - Install and start using immediately

## Screenshots

![Done & Dusted Screenshot](img/screenshot.png)

## Installation

### From Source (Developer Mode)

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/done-and-dusted.git
   cd done-and-dusted
   ```

2. **Load in Chrome**
   - Navigate to `chrome://extensions/`
   - Enable **Developer mode** (toggle in top-right corner)
   - Click **Load unpacked**
   - Select the `done-and-dusted` folder

3. **Start using**
   - Open a new tab to see your to-do list

## Usage

### Managing Projects

- Click the **+** button to create a new project
- Click any project tab to switch between projects
- Right-click a project tab to rename or delete it

### Managing Tasks

- Type in the input field and press **Enter** to add a task
- Click the checkbox to mark a task complete (watch the celebration animation!)
- Click task text to edit it inline
- Completed tasks automatically move to the bottom with strikethrough styling

## Technical Details

| Feature | Implementation |
|---------|----------------|
| Extension Version | Manifest V3 |
| Storage | Chrome Sync Storage API |
| Storage Limit | ~100KB total, ~8KB per item |
| Animations | HTML5 Canvas |
| Styling | Pure CSS (no frameworks) |

## Project Structure

```
done-and-dusted/
├── manifest.json      # Chrome extension configuration
├── newtab.html        # Main HTML structure
├── styles.css         # Styling and themes
├── app.js             # Core application logic
├── icons/             # Extension icons (16, 48, 128px)
└── img/               # Images and screenshots
```

## Browser Support

- Google Chrome (recommended)
- Microsoft Edge (Chromium-based)
- Brave Browser
- Other Chromium-based browsers

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Keywords

`chrome-extension` `todo-list` `productivity` `new-tab` `task-manager` `project-management` `minimal` `to-do` `browser-extension` `manifest-v3`

---

**Done & Dusted** - Get things done, one tab at a time.
