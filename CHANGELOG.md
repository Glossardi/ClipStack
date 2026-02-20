# Changelog

All notable changes to ClipStack will be documented in this file.

This changelog is **append-only** - entries are never removed or modified once added.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned for Next Release
- Image support in clipboard history
- Persistence across app restarts (Tauri store plugin)
- Pin/favorite items functionality
- Global keyboard shortcut (⌘⇧V)
- Launch at login via SMAppService

## [1.1.0] - 2026-02-20

### Changed (Breaking UX)
- **Window toggle behavior** – Left-clicking the tray icon now toggles the window. Clicking again closes it instead of always showing it.
- **Auto-dismiss on blur** – The popover hides automatically when focus moves to another app or window (clicking outside). No more sticky overlay.
- **Copy & hide** – Clicking a clipboard item copies its content and immediately hides the window so the user can paste right away.
- **Window no longer always-on-top** – Removed `alwaysOnTop: true`; the window behaves like a standard macOS menu-bar panel.
- **Window starts hidden** – App launches silently to the menu bar; the window only appears on tray click.

### Added
- **Escape key** – Pressing Escape hides the window (or closes Settings if open).
- **Auto-focus search** – Search field is automatically focused whenever the window opens.
- **System dark mode** – Dark/light theme now follows `prefers-color-scheme` automatically with a `change` listener; no manual toggle needed.
- **Pop-in animation** – Window appears with a subtle scale + fade animation (`cubic-bezier` spring easing).
- **Tray icon position** – Window is positioned below the tray icon click point instead of appearing at a fixed position.

### Fixed
- **Transparency / backdrop blur** – Enabled `macosPrivateApi: true` in `tauri.conf.json`; the blur and vibrancy effects now render correctly (previously produced a console warning and fell back to opaque).
- **10 deprecation warnings** – Suppressed `cocoa` FFI warnings with targeted `#[allow(deprecated)]` blocks and an inline migration comment.
- **Duplicate handling** – Re-copying an existing item now moves it to the top of the list instead of silently ignoring it.

### Removed
- **Quit button (✕) in search bar** – Removed; dismissal is now handled by clicking outside the window.
- **GitHub repository link in Settings** – Removed (not an open-source project).

### Improved UI (Apple-style polish)
- `main` window element: `border-radius: 14px`, refined shadow (`box-shadow` with 3 layers), `backdrop-filter: blur(40px) saturate(180%)`.
- SearchBar: replaced emoji magnifier with inline SVG icon; bare `<input>` without wrapper box for a cleaner macOS feel.
- ClipItemRow: compact type badge (26×26 rounded rect) instead of emoji; tighter row height (~50px); SVG checkmark and delete icons.
- Settings: smaller header (15px), SF-style section labels, inline SVG close button.
- Footer: "Clear All" turns red on hover; consistent with macOS destructive action convention.
- Thin scrollbar (4px) with transparent track inside scroll area.
- All global CSS selectors updated from `.dark` → `html.dark` for correct scoping.

### Technical Details
- `tauri.conf.json`: `macosPrivateApi: true`, `visible: false`, `alwaysOnTop: false`
- `lib.rs`: `#[allow(deprecated)]` on cocoa imports; tray click handler extracts `position` for window placement; toggle logic via `window.is_visible()`
- `+page.svelte`: uses `getCurrentWindow().hide()` instead of `.close()`; dark mode via `matchMedia`; Escape key listener
- `SearchBar.svelte`: dispatcher changed to `input: string` (value not event); quit event removed; `bind:this` exposes `inputRef`
- `ClipItemRow.svelte`: `onCopy` callback triggers `appWindow.hide()` in parent; `createEventDispatcher` removed (callbacks only)
- `Settings.svelte`: `setLimit` dispatcher emits `number` directly (not wrapped in `CustomEvent`)

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
| 1.1.0 | 2026-02-20 | ✅ Released |
| 1.0.3 | 2026-02-20 | ✅ Released |
| 1.0.2 | 2026-02-18 | ✅ Released |
| 1.0.1 | 2026-02-18 | ✅ Released |
| 1.0.0 | 2026-02-18 | ✅ Released |

---

*Last updated: 2026-02-20*
