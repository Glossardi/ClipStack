# Changelog

All notable changes to ClipStack are documented here.

The format is based on Keep a Changelog and this project follows Semantic Versioning.

## [Unreleased]

### Fixed
- Preflight now prefers the rustup toolchain (`~/.cargo/bin`) so local checks use the pinned Rust version from `rust-toolchain.toml`.
- DMG packaging now also updates `Latest/ClipStack_latest_*.dmg` during local `build:macos:dmg` runs.

### Changed
- Added local CI-parity preflight scripts (`npm run ci:preflight`, `npm run release:preflight`) to catch release issues before push.
- Optimized GitHub Actions runtime with npm cache, Rust cache, and concurrency cancel-in-progress.

### Security
- Added stronger local ignore rules for private notes/instructions and local signing material patterns.

## [1.1.2] - 2026-02-20

### Fixed
- Removed duplicate tray icon in macOS menu bar by using one tray creation path.
- Stabilized release CI by ensuring `build/` exists before Rust compile checks.

### Added
- Tauri updater integration with startup check, download/install, and relaunch flow.
- Updater permissions in Tauri capabilities (`updater:default`, `process:default`).
- Signed multi-arch release pipeline (Intel + Apple Silicon) with `latest.json` artifacts.
- Release runbook consolidated in `README.md` as the single source of truth.

### Fixed
- Outside-click close behavior on macOS panel flow (focus-loss driven close path stabilized).

### Changed
- KISS UI: removed search from the popover.
- KISS UI: removed in-panel `Clear All` action.

### Added
- Persistent clipboard history (`clipboard_history.json`) with load-on-start and save-on-change.
- Reliable outside-click close via macOS global mouse monitor for the tray panel.

### Documentation
- Updated README with app-only production build command for local install testing.
- Added documented distribution flow for app + DMG packaging.

### Build
- Added `scripts/build-dmg.sh` for a reliable drag-and-drop DMG package flow.
- Added npm scripts `build:macos:app` and `build:macos:dmg`.

## [1.1.0] - 2026-02-20

### Changed
- Menubar panel architecture with tray toggle behavior.
- Clipboard monitoring moved from frontend to Rust backend.
- Simplified single-page popover UI.

## [1.0.3] - 2026-02-20
## [1.0.2] - 2026-02-18
## [1.0.1] - 2026-02-18
