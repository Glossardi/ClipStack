# Changelog

All notable changes to ClipStack are documented here.

The format is based on Keep a Changelog and this project follows Semantic Versioning.

## [1.2.0] - 2026-03-06

### Added
- **Start at Login** — ClipStack can now launch automatically at login. Toggle via the right-click tray menu ("Start at Login" checkmark). Preference persists across restarts.
- **Settings persistence** — new `settings.json` in app data directory stores user preferences.

### Changed
- Tray right-click menu now shows: Clear Clipboard History | separator | Start at Login (checkmark) | Quit ClipStack.

## [1.1.6] - 2026-02-23

### Changed
- CI: Enable Apple Developer ID code signing and notarization via GitHub Secrets
- Signed builds will no longer show "unidentified developer" warning on macOS

## [Unreleased]

## [1.1.5] - 2026-02-23

### Fixed
- **Auto-updater was never triggered** — the `latest.json` file (required by the Tauri updater) was not uploaded to the `latest` GitHub release tag. The updater endpoint returned 404 for all existing installs. Fixed `publish_latest` CI job to also upload `latest.json` alongside the DMGs.

### Changed
- **Update check on every popover open** — previously the app only checked for updates once at startup. Now `checkForUpdatesOnFocus()` checks on every `tauri://focus` event (when the menu bar popover opens), throttled to at most once per hour. Users on long-running sessions will now receive updates without restarting.

## [1.1.4] - 2026-02-23

### Fixed
- **"App is damaged" Gatekeeper error** — the Rust linker was applying an incomplete `linker-signed` ad-hoc signature to the binary but Tauri was not re-sealing the full `.app` bundle resources. macOS detected the mismatched signature as cryptographically invalid and showed "damaged and can't be opened". Fixed by setting `APPLE_SIGNING_IDENTITY: "-"` in CI so `tauri-action` runs a proper `codesign --force --deep --sign -` after bundling, correctly sealing Info.plist and all resources.
- **Download page Gatekeeper instructions** — "Open Anyway" in System Settings only works for Developer-ID-signed apps. For ad-hoc signed apps the correct fix is `xattr -cr ~/Downloads/ClipStack.dmg` in Terminal. Updated the website callout with the correct steps, now open by default.

## [1.1.3] - 2026-02-22

### Fixed
- **CI: `publish_latest` Intel DMG never uploaded** — the shell pattern `*x86_64*` did not match Tauri's actual output filename `_x64`. Fixed to `*x64*`; Intel users now receive the correct DMG on every release.
- **Missing "latest" release tag** — the `publish_latest` CI job was introduced after v1.1.2 was already released, so the `latest` tag on GitHub never existed. Created manually and will be maintained automatically going forward.
- **macOS Gatekeeper notice on website** — added a clear instruction for users who see "app is damaged": right-click the app in Finder and choose Open.

### Changed
- Rebuilt download landing page (`web/`) with Apple-style design: prominent app icon, bold hero headline, authentic macOS menu-bar popover mock showing real clipboard history UI, bilingual DE/EN, Umami analytics, and cookieless footer.
- Download buttons auto-detect Mac architecture and show the correct DMG as primary CTA; always show Intel fallback link.
- Download links resolve via GitHub Releases API for the newest real asset URLs, falling back to stable `/latest/` redirect.

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
