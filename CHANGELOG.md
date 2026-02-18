# Changelog

All notable changes to ClipStack will be documented in this file.

This changelog is **append-only** - entries are never removed or modified once added.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned for Next Release
- Image support in clipboard history
- URL detection with clickable previews
- Pin/favorite items functionality
- Global keyboard shortcut (⌘⇧V)
- Launch at login via SMAppService
- Dark mode toggle in settings

## [1.0.0] - 2026-02-18

### Added
- Initial release of ClipStack clipboard manager
- Menu bar integration with tray icon
- Clipboard history monitoring (500ms polling interval)
- Text and URL content type detection
- Live search functionality
- Click-to-copy with visual feedback (checkmark animation)
- Settings panel with history limit configuration (10/25/50/100 items)
- Swipe-to-delete and Clear All functionality
- Empty state with helpful messaging
- Responsive UI with backdrop blur effect
- Rust backend using `arboard` crate for clipboard access
- Svelte 5 frontend with TypeScript
- Tauri V2 framework integration

### Technical Details
- **Frontend:** Svelte 5.0 + TypeScript + Vite
- **Backend:** Rust 2021 edition
- **Framework:** Tauri V2.0
- **Clipboard Library:** arboard 3.x
- **UUID Generation:** uuid 1.x with v4 feature
- **Minimum macOS:** 14.0 (Sonoma)
- **App Bundle:** Native macOS .app with DMG distribution

### Project Structure
```
ClipStack/
├── src/routes/           # Svelte components
│   ├── +page.svelte      # Main app component
│   ├── ClipItemRow.svelte
│   ├── SearchBar.svelte
│   └── Settings.svelte
├── src-tauri/
│   ├── src/
│   │   ├── lib.rs        # Tauri commands + clipboard logic
│   │   └── main.rs       # Application entry point
│   ├── Cargo.toml        # Rust dependencies
│   └── tauri.conf.json   # Tauri configuration
├── package.json          # Node.js dependencies
└── README.md             # Project documentation
```

### Known Issues
- Bundle identifier ends with `.app` (generates warning, non-critical)
- Image content type detected but not yet displayed as thumbnails
- No persistence between app restarts (in-memory only)
- No keyboard shortcut handler implemented yet
- Launch at login not yet implemented

### Build Commands
```bash
# Development
npm install
npm run tauri dev

# Production Build
npm run tauri build

# Output locations
# - App: src-tauri/target/release/bundle/macos/ClipStack.app
# - DMG: src-tauri/target/release/bundle/dmg/ClipStack_1.0.0_aarch64.dmg
```

### Dependencies (Initial)
**Node.js:**
- @tauri-apps/api: ^2
- @tauri-apps/cli: ^2
- @tauri-apps/plugin-opener: ^2
- svelte: ^5.0.0
- vite: ^6.0.3

**Rust:**
- tauri: 2 (features: tray-icon, image-png)
- tauri-plugin-opener: 2
- tauri-plugin-shell: 2
- arboard: 3
- uuid: 1 (features: v4)
- serde: 1 (features: derive)
- serde_json: 1

---

## Version History

| Version | Date | Status |
|---------|------|--------|
| 1.0.0 | 2026-02-18 | ✅ Released |

---

*Last updated: 2026-02-18*
