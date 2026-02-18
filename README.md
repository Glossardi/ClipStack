# ClipStack

A minimalist, native macOS clipboard manager utility that runs in the menu bar.

Built with **Tauri V2**, **Svelte 5**, and **Rust** - no Xcode required for development!

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![macOS](https://img.shields.io/badge/platform-macOS%2014.0+-silver.svg)

## ✨ Features

- 📋 **Clipboard History** - Automatically captures text and URLs
- 🔍 **Live Search** - Filter clipboard items instantly
- ⚡ **Quick Copy** - Click any item to copy back to clipboard
- 🎯 **Menu Bar Integration** - Lives in your menu bar, out of the way
- ⚙️ **Configurable** - Adjust history limit and polling interval
- 🚀 **Lightweight** - Built with Rust, minimal resource usage

## 📋 Requirements

- macOS 14.0 (Sonoma) or later
- Node.js 18+ and npm
- Rust toolchain (for building)

## 🚀 Quick Start

### Development

```bash
# Install dependencies
npm install

# Run in development mode (hot reload)
npm run tauri dev
```

### Build

```bash
# Build for production
npm run tauri build

# Output locations:
# - App: src-tauri/target/release/bundle/macos/ClipStack.app
# - DMG: src-tauri/target/release/bundle/dmg/ClipStack_*.dmg
```

### Run the built app

```bash
open src-tauri/target/release/bundle/macos/ClipStack.app
```

## 📁 Project Structure

```
ClipStack/
├── src/                      # Svelte frontend
│   ├── routes/
│   │   ├── +page.svelte      # Main app component
│   │   ├── ClipItemRow.svelte # History item component
│   │   ├── SearchBar.svelte   # Search input
│   │   └── Settings.svelte    # Settings panel
│   ├── app.html
│   └── app.css
├── src-tauri/                # Rust backend
│   ├── src/
│   │   ├── lib.rs            # Main Rust code + Tauri commands
│   │   └── main.rs           # Entry point
│   ├── Cargo.toml            # Rust dependencies
│   └── tauri.conf.json       # Tauri configuration
├── package.json              # Node.js dependencies
└── README.md
```

## 🛠 Tech Stack

| Component | Technology |
|-----------|------------|
| **Frontend** | Svelte 5 + TypeScript |
| **Backend** | Rust |
| **Framework** | Tauri V2 |
| **Clipboard** | arboard (Rust crate) |
| **Styling** | CSS with backdrop-filter |

## ⚙️ Configuration

Access settings via the gear icon in the footer:

- **History Limit**: 10 / 25 / 50 / 100 items
- **About**: Version info and GitHub link

## 🔧 Development Commands

```bash
npm run dev          # Start Vite dev server
npm run build        # Build frontend only
npm run tauri dev    # Run full app in dev mode
npm run tauri build  # Build production app
npm run preview      # Preview production build
```

## 📝 How It Works

1. **Clipboard Monitoring**: The Rust backend polls the system clipboard every 500ms using the `arboard` crate
2. **Change Detection**: When clipboard content changes, a new item is added to the in-memory history
3. **Deduplication**: Duplicate entries at the top of the list are prevented
4. **Limit Enforcement**: Old items are automatically removed when the history limit is reached
5. **UI Updates**: Svelte's reactivity automatically updates the UI when new items arrive

## 🔒 Privacy

- All clipboard data stays local on your device
- No telemetry, analytics, or external connections
- No iCloud sync (MVP version)

## 📄 License

MIT License - see LICENSE file for details

## 🙋 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 🗺 Roadmap

### Phase 1 (Current)
- ✅ Basic clipboard history
- ✅ Search functionality
- ✅ Settings panel
- ✅ Menu bar integration

### Phase 2 (Planned)
- 🔲 Image support
- 🔲 URL detection and preview
- 🔲 Pin/favorite items
- 🔲 Keyboard shortcuts (⌘⇧V)
- 🔲 Launch at login
- 🔲 Dark mode toggle

---

Built with ❤️ using Tauri
