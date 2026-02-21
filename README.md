# ClipStack

Minimal macOS clipboard manager in the menu bar, built with Tauri v2 + Svelte + Rust.

## Features

- Menu bar popover with tray icon toggle
- Clipboard text/URL capture in Rust backend
- Persistent clipboard history on disk
- Event-driven UI refresh on clipboard changes
- Click-to-copy, delete per item, escape to close
- Light/dark mode follows system

## Requirements

- macOS 14+
- Node.js 18+
- Rust toolchain >= 1.88

If Homebrew Rust is preferred in your shell, run:

```bash
export PATH="$HOME/.cargo/bin:$PATH"
```

## Development

```bash
npm install
npm run tauri dev
```

## Quality Checks

```bash
npm run check
npm run test
npm run ci:preflight
```

## Build

App bundle:

```bash
npm run build:macos:app
```

DMG for distribution tests:

```bash
npm run build:macos:dmg
```

`build:macos:app`/`build:macos:dmg` disable updater artifacts for local testing, so no signing key is required.

Outputs:

- `src-tauri/target/release/bundle/macos/ClipStack.app`
- `src-tauri/target/release/bundle/dmg/ClipStack_*.dmg`

## Release Flow (Single Source of Truth)

1. Run preflight: `npm run release:preflight`
2. Bump version in all three files:
   - `package.json`
   - `src-tauri/Cargo.toml`
   - `src-tauri/tauri.conf.json`
3. Build and validate DMG: `npm run build:macos:dmg`
4. Push to `main`: `git push origin main`
5. GitHub Actions (`.github/workflows/release.yml`) creates signed artifacts and `latest.json`

## Data & Privacy

- Clipboard history file: `<app_data_dir>/clipboard_history.json`
- Data remains local on device (no telemetry/sync)
- CSP is enabled and frontend uses module imports (no global `window.__TAURI__`)

## License

Source-available under `LICENSE` (non-commercial for third parties; commercial use reserved to the licensor).
