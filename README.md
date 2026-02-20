# ClipStack

Minimal macOS clipboard manager in the menu bar, built with Tauri v2 + Svelte + Rust.

## Current Feature Set

- Menu bar popover with tray icon toggle
- Clipboard text/URL capture in Rust backend
- Persistent clipboard history on disk (survives restart/crash)
- Click-to-copy with lightweight "Copied" feedback
- Per-item delete
- Outside click / focus-loss close behavior
- Escape closes popover
- Light/dark mode follows system

## Requirements

- macOS 14+
- Node.js 18+
- Rust toolchain

## Development

```bash
npm install
npm run tauri dev
```

## Checks

```bash
npm run check
npm run test
cargo test -j 1 --manifest-path src-tauri/Cargo.toml
cargo clippy --manifest-path src-tauri/Cargo.toml -- -D warnings
```

## Production Build

```bash
npm run tauri build
```

App-only bundle (recommended for local install testing):

```bash
npm run tauri build -- --bundles app
```

Distribution build (app + drag-and-drop DMG):

```bash
npm run build:macos:dmg
```

Build outputs:

- `src-tauri/target/release/bundle/macos/ClipStack.app`
- `src-tauri/target/release/bundle/dmg/ClipStack_*.dmg`

Run built app:

```bash
open src-tauri/target/release/bundle/macos/ClipStack.app
```

## Distribution Notes

- The DMG contains `ClipStack.app` and an `Applications` shortcut for classic drag-and-drop install.
- For broad distribution without Gatekeeper warnings, you should sign and notarize the app with an Apple Developer ID certificate.

## Auto-Update & Release

- Auto-updater is configured through GitHub Releases (`latest.json` + signed artifacts).
- CI/CD workflow lives in `.github/workflows/release.yml`.
- Full release instructions are documented in `RELEASING.md`.

## Data Storage

Clipboard history is written to app data as JSON:

- `<app_data_dir>/clipboard_history.json`

On startup, ClipStack loads this file automatically.

## Privacy

- All clipboard data stays local on your Mac.
- No telemetry, analytics, or network sync.

## License

MIT
