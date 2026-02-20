# Changelog

All notable changes to ClipStack are documented here.

The format is based on Keep a Changelog and this project follows Semantic Versioning.

## [Unreleased]

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

## [1.1.0] - 2026-02-20

### Changed
- Menubar panel architecture with tray toggle behavior.
- Clipboard monitoring moved from frontend to Rust backend.
- Simplified single-page popover UI.

## [1.0.3] - 2026-02-20
## [1.0.2] - 2026-02-18
## [1.0.1] - 2026-02-18
