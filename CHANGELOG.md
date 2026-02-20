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

## [1.0.3] - 2026-02-20

### Fixed
- **Checkmark animation** - Added missing `fade` import from `svelte/transition`; animation now works correctly after copying an item
- **Hover effect** - Fixed invalid CSS pseudo-class `:hovering` → `:hover`; item background highlight now works
- **Delete button** - Added visible delete (✕) button per clipboard item, appearing on hover; previously the delete functionality existed in the backend but had no accessible UI
- **Search clear** - `clearSearch()` in SearchBar now dispatches a dedicated `clear` event instead of constructing a broken synthetic DOM event; parent resets `searchText` and re-filters correctly
- **SearchBar event wiring** - Parent (`+page.svelte`) now uses `on:input` / `on:clear` / `on:quit` (Svelte event dispatcher pattern) instead of incorrect `onInput` / `onQuit` prop passing
- **Memory leak** - `setInterval` in clipboard monitor is now stored and cleared via `onDestroy`; prevents accumulating intervals on component remount
- **Version mismatch** - Settings panel showed `1.0.1`; corrected to `1.0.0` matching `package.json`

### Added
- **5 new Rust unit tests** - Extended test coverage from 4 to 9 tests:
  - `test_add_item_deduplication` - verifies duplicate items are rejected
  - `test_history_limit_enforcement` - verifies oldest items are trimmed when limit is reached
  - `test_delete_item` - verifies correct item removal by ID
  - `test_clear_all_items` - verifies full history wipe
  - `test_set_history_limit_trims_excess` - verifies limit reduction trims existing items

### Technical Details
- `ClipItemRow.svelte` restructured: outer `<div role="listitem">` wraps a `<button class="clip-copy">` for copy and a conditional `<button class="delete-btn">` for delete
- `SearchBar.svelte` dispatcher type extended with `clear: void` event
- `+page.svelte` imports `onDestroy` and stores interval reference in `monitorInterval`
- Rust `make_item()` test helper added for concise test setup
- `cargo update time --precise 0.3.36` applied to maintain compatibility with rustc 1.86.0

---

## [1.0.2] - 2026-02-18

### Fixed
- **Settings panel close button** - Fixed event dispatcher to properly close Settings panel when X button is clicked
- **Event handling** - Updated from `onClose` callback to Svelte 5 `on:close` event pattern for proper component communication
- **Version display** - Updated version in Settings panel to 1.0.1

### Added
- **Rust unit tests** - Added test coverage for clipboard state initialization, item creation, URL detection, and content type detection
- **Test module** - New `#[cfg(test)]` module in `lib.rs` with 4 test cases for core clipboard logic

### Changed
- **Event dispatcher types** - Migrated to `CustomEvent` pattern for type-safe event handling in Settings.svelte
- **Settings event handlers** - Refactored `handleCloseSettings()` function for cleaner state management

### Technical Details
- Settings panel now uses `createEventDispatcher<{ setLimit: CustomEvent<number>; close: CustomEvent<void>; }>`
- Event dispatching uses `{ detail: value }` pattern for Svelte 5 compatibility
- Added 4 Rust tests covering: state initialization, item creation, URL detection, content type detection

---

## [1.0.1] - 2026-02-18

### Fixed
- **Menu bar only mode** - Set macOS activation policy to `Accessory` so app doesn't appear in Dock
- **Window visibility on launch** - Added explicit `window.show()` and `window.set_focus()` calls in setup
- **Bundle identifier warning** - Changed from `com.clipstack.app` to `com.clipstack.macos` to avoid macOS bundle extension conflict
- **Window control permissions** - Added `core:window:allow-show`, `core:window:allow-set-focus`, `core:window:allow-close` to capabilities
- **Shell plugin configuration** - Updated from deprecated `allowlist` to `open` for Tauri V2 compatibility
- **Accessibility** - Changed clipboard items from `<div>` to `<button>` elements with proper `aria-label` attributes

### Changed
- **Dependencies** - Added `cocoa` and `objc` crates for macOS native API access (activation policy)
- **README** - Updated with menu bar behavior documentation and troubleshooting section

### Technical Details
- macOS activation policy set via `NSApplication::setActivationPolicy_(NSApplicationActivationPolicyAccessory)`
- Uses `cocoa::appkit` and `cocoa::base` for native macOS integration
- Window shown automatically on first launch and when tray icon is clicked

---

## Version History

| Version | Date | Status |
|---------|------|--------|
| 1.0.3 | 2026-02-20 | ✅ Released |
| 1.0.2 | 2026-02-18 | ✅ Released |
| 1.0.1 | 2026-02-18 | ✅ Released |
| 1.0.0 | 2026-02-18 | ✅ Released |

---

*Last updated: 2026-02-20*
