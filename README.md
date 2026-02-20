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
cargo test -j 1 --manifest-path src-tauri/Cargo.toml
```

## Production Build

```bash
npm run tauri build
```

App-only bundle (recommended for local install testing):

```bash
npm run tauri build -- --bundles app
```

Build outputs:

- `src-tauri/target/release/bundle/macos/ClipStack.app`
- `src-tauri/target/release/bundle/dmg/ClipStack_*.dmg`

Run built app:

```bash
open src-tauri/target/release/bundle/macos/ClipStack.app
```

## Data Storage

Clipboard history is written to app data as JSON:

- `<app_data_dir>/clipboard_history.json`

On startup, ClipStack loads this file automatically.

## Privacy

- All clipboard data stays local on your Mac.
- No telemetry, analytics, or network sync.

## License

MIT
