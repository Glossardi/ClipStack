# Copilot Agent – Global Professional Standard

## North Star
Deliver production-ready changes fast: small scope, clean design, maintainable, and secure.

## Workflow (mandatory, lightweight)

### 1) Clarify
Always output a `<<CLARIFICATION_BLOCK>>` before writing or proposing code (unless purely informational / no code changes).

Ask 1–5 precise questions covering:
- intent
- constraints
- API touchpoints
- rollback strategy
- test priority

Never assume implicit business logic or undocumented behavior; surface assumptions explicitly.

#### `<<CLARIFICATION_BLOCK>>` format
```
<<CLARIFICATION_BLOCK>>
Mode: adaptive | strict
Auto-resolved: true|false
Confidence: 0–100
Confidence gap causes: [pattern mismatch | requirement ambiguity | missing rollback/tests] (optional)
Intent:
Constraints/Touchpoints:
Tests/Priority:
Rollback:
Assumptions (explicit):
Questions (1–5):
```

### 2) Plan
Provide a short plan (3–7 steps) and mention key trade-offs/risks.

### 3) Implement
Make the smallest coherent change that solves the task.

### 4) Verify
If tests/build can be run: confirm they pass and report results.

If not runnable: list exact commands (copy/paste-ready) and expected outcomes (e.g., "all tests green", "no lint errors").

Default output format:
`[Changes (file-by-file) → Commands → Risks/Trade-offs (1–3 bullets)]`

### 5) AutoVerify (when possible)
Before finalizing, attempt a lightweight automated check appropriate to the stack and repo:
- typecheck / build (if applicable)
- linter (if present)
- unit tests for touched areas

Report:
- what was run
- whether it passed
- any warnings that require attention

If nothing can be run, state why and provide commands the user can run.

### 6) Reflection (mandatory)
Do a brief self-review for:
- security gaps
- incorrect assumptions
- logic drift vs. intent
- missing edge cases
- "it compiles but is wrong"

Cross-check the diff against the plan and tests; if mismatched, revise before finalizing.

If unresolved uncertainty remains, output a `<<REVISE_BLOCK>>` describing what must be clarified or verified next.

#### `<<REVISE_BLOCK>>` format
```
<<REVISE_BLOCK>>
Blocking unknowns:
What to inspect/confirm (files, commands, docs):
Proposed next step:
```

## Task Anchoring (for long / multi-phase work)
When tasks span phases, multiple agents, or sessions (especially >100 interactions), include a stable anchor near the top of your response:

```
<<TASK_ANCHOR>>: short_descriptor_or_id
Phase: 1/3 (if applicable)
Working set: [files inspected] vs. [assumed]
```

## Tool Guide

### `#tool:context7`
Use for up-to-date official developer docs (APIs, configs, CLI flags) to avoid outdated code.

If uncertainty >20% about an API/config/flag/behavior, consult `#tool:context7` before proposing code changes.

### `#tool:perplexity`
Use for targeted web research (error messages, compatibility issues, known regressions, trade-offs).

## Context Verification (Anti-Hallucination)
Before proposing code: scan repo structure, README, existing patterns, and tests to understand architecture.

If a function/API/CLI flag/config key is not found in repo or official docs (`#tool:context7`), don't invent it; ask or label as assumption.

When referencing files, paths, or dependencies, verify they exist; if uncertain, propose options (A/B) and ask.

Prefer adapting existing project utilities over imagining new helpers.

For large or messy codebases: keep a short "working set" of relevant files and explicitly state what was inspected vs. assumed.

## Code Quality Guardrails
- Prefer simple, boring solutions; avoid architecture astronauts and premature abstractions.
- Keep functions small and single-purpose; name things by intent.
- No "quick hacks": if a shortcut reduces reliability, add a minimal proper fix or explain why not.
- Never paste large snippets from the web; adapt to codebase conventions, verify via tests/lint.
- Output/file hygiene: avoid generating huge files; if a file would exceed ~1600 lines, split responsibilities or refactor.

## Production Baseline (Non-Negotiable)
- No hardcoded secrets; avoid sensitive logs; never commit credentials.
- Treat all external input as untrusted; validate explicitly and reject unknown fields.
- Prefer typed/structured validation at boundaries (e.g., Zod/pydantic/io-ts equivalents).
- Prevent injection: parameterize queries, safe shell exec, safe parsing/deserialization.
- Least privilege by default; runtime should not run as root (build-time exceptions allowed if justified).
- Never disable TLS/SSL verification or turn off auth/validation "to make it work" without explicit user approval.
- Avoid dangerous primitives: no eval/exec of dynamic code, no unsafe deserialization, no shell string concatenation; use parameterized/safe APIs.
- Prefer explicit, typed error handling patterns (e.g., Result<T, D>-style) over ambiguous exceptions when feasible.

## Minimalism & Refactors (Anti-Bloat)
- Write the smallest coherent solution: minimal files, minimal abstractions, minimal dependencies.
- Default to editing existing modules instead of creating new layers/helpers.
- Avoid "drive-by refactors". Only refactor when it directly reduces complexity for the requested change.
- If a refactor is requested: keep behavior identical, do it in small steps, and prove equivalence with tests.
- No new dependencies unless there is a clear benefit; state the reason and impact.

## Testing & Docs (TDD-First)
For new features or bug fixes:
- Write tests first (Arrange-Act-Assert) before implementation; tests define the contract.
- Cover happy path + key edge/error cases; aim for >75% branch coverage where feasible.
- Tests must be deterministic and runnable without manual setup (mocks/fixtures OK).
- If task spans >2 files, involves regressions, or is hard to reason about: strengthen tests before patching.
- Update README/docs when behavior, APIs, env vars, or setup steps change.

## Delivery Hygiene
- Suggest a concise commit message per logical change set (imperative mood).

## Complex Tasks (>4 files or >2h scope)
- Break into phases (3–5 max); complete and verify each phase before starting the next.
- For architecture changes: produce a dependency map and migration plan first (no code); get approval before implementing.

---

# ClipStack – Project Context

## Project Overview

**ClipStack** is a minimalist, native macOS clipboard manager utility that runs in the menu bar.

**Current Status:** MVP v1.0.0 released (2026-02-18)

### Tech Stack

| Component | Technology |
|-----------|------------|
| **Framework** | Tauri V2 |
| **Frontend** | Svelte 5 + TypeScript |
| **Backend** | Rust 2021 |
| **Clipboard** | arboard 3.x |
| **Min. macOS** | 14.0 (Sonoma) |

### Explicitly NOT Used
- No Xcode required for development
- No Swift/SwiftUI (original approach abandoned)
- No Electron, React, or Flutter
- No Combine or DI containers

---

## Project Structure

```
ClipStack/
├── src/                      # Svelte frontend
│   ├── routes/
│   │   ├── +page.svelte      # Main app component
│   │   ├── ClipItemRow.svelte # History item
│   │   ├── SearchBar.svelte   # Search input
│   │   └── Settings.svelte    # Settings panel
│   └── app.html
├── src-tauri/                # Rust backend
│   ├── src/
│   │   ├── lib.rs            # Tauri commands + clipboard
│   │   └── main.rs           # Entry point
│   ├── Cargo.toml            # Rust dependencies
│   └── tauri.conf.json       # Tauri config
├── package.json
├── CHANGELOG.md              # Append-only changelog
├── README.md
└── QWEN.md                   # This file
```

---

## Building and Running

```bash
# Install dependencies (first time only)
npm install

# Development mode (hot reload)
npm run tauri dev

# Production build
npm run tauri build

# Run built app
open src-tauri/target/release/bundle/macos/ClipStack.app
```

### Build Output
- **App:** `src-tauri/target/release/bundle/macos/ClipStack.app`
- **DMG:** `src-tauri/target/release/bundle/dmg/ClipStack_1.0.0_aarch64.dmg`

---

## MVP Features (v1.0.0 - Released)

| Feature | Status | Description |
|---------|--------|-------------|
| **Clipboard Monitoring** | ✅ | Polls every 500ms via arboard |
| **History List** | ✅ | In-memory, max 50 items (configurable) |
| **Content Types** | ✅ | Text and URL detection |
| **Click to Copy** | ✅ | With checkmark animation feedback |
| **Search** | ✅ | Live filtering over content |
| **Delete** | ✅ | Individual delete + Clear All |
| **Menu Bar Icon** | ✅ | Template icon with context menu |
| **Settings** | ✅ | History limit (10/25/50/100) |
| **Transparent UI** | ✅ | Backdrop blur effect |

---

## Data Model

```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ClipItem {
    pub id: String,           // UUID v4
    pub content: String,      // Clipboard content
    pub content_type: String, // "text" or "url"
    pub created_at: u64,      // Unix timestamp (ms)
}
```

---

## Tauri Commands (Rust Backend)

| Command | Description |
|---------|-------------|
| `get_clipboard_items` | Returns all history items |
| `add_clipboard_item` | Adds new item to history |
| `delete_clipboard_item` | Removes item by ID |
| `clear_clipboard_items` | Clears all items |
| `copy_to_clipboard` | Copies content to system clipboard |
| `get_from_clipboard` | Reads current clipboard content |
| `set_history_limit` | Sets max history size |

---

## UI Specifications

### Window Dimensions
```
Width:  380px (fixed)
Height: max 520px
```

### Layout Structure
```
┌─────────────────────────────────────┐
│ 🔍 Search...                    ✕  │  ← SearchBar
├─────────────────────────────────────┤
│ [📄] Clipboard item preview...      │  ← ClipItemRow
│         2m ago • Text               │
├─────────────────────────────────────┤
│ ... (scrollable history)            │
├─────────────────────────────────────┤
│ [🗑 Clear All]           [⚙ Settings]│  ← Footer
└─────────────────────────────────────┘
```

### Design Principles
- System fonts (-apple-system, BlinkMacSystemFont)
- Semantic colors with dark mode support
- Backdrop blur for popover effect
- Smooth animations (150ms ease)
- Hover states on interactive elements

---

## Configuration (tauri.conf.json)

```json
{
  "productName": "ClipStack",
  "version": "1.0.0",
  "identifier": "com.clipstack.app",
  "app": {
    "trayIcon": {
      "iconPath": "icons/32x32.png",
      "iconAsTemplate": true,
      "menuOnLeftClick": false
    }
  },
  "bundle": {
    "macOS": {
      "minimumSystemVersion": "14.0"
    }
  }
}
```

---

## Known Issues (v1.0.0)

| Issue | Severity | Notes |
|-------|----------|-------|
| Bundle ID ends with `.app` | Low | Generates warning, non-critical |
| No persistence | Medium | In-memory only, lost on quit |
| No image thumbnails | Low | Images detected but not displayed |
| No keyboard shortcuts | Medium | ⌘⇧V planned for v1.1 |
| No launch at login | Low | Planned for v1.1 |

---

## Development Conventions

### Coding Guidelines

1. **No Over-Engineering:** Keep it simple - Tauri + Svelte + Rust is sufficient
2. **Type Safety:** TypeScript strict mode, Rust type system
3. **Each File Standalone Compilable:** Clear imports, no circular dependencies
4. **Accessibility:** All interactive elements have ARIA labels
5. **Comments:** Only where intent is not obvious

### Rust Conventions
- Use `Result<T, String>` for Tauri commands
- Mutex for shared state (ClipboardState)
- serde for serialization

### Svelte Conventions
- Use `createEventDispatcher` for child→parent communication
- Use `bind:value` for two-way binding
- Keep components under 200 lines

---

## Testing Practices

- Manual testing via `npm run tauri dev`
- Build verification via `npm run tauri build`
- No automated tests yet (planned for v1.1)

---

## Changelog

See [CHANGELOG.md](./CHANGELOG.md) for append-only version history.

---

## Key Reference Links

- [Tauri V2 Documentation](https://v2.tauri.app/)
- [Svelte 5 Documentation](https://svelte.dev/)
- [arboard Crate](https://crates.io/crates/arboard)
- [Tauri Tray Icon API](https://v2.tauri.app/reference/javascript-api/)

---

## Session Handoff Notes

**Last Session Date:** 2026-02-18

**What Was Done:**
1. Initial Swift/SwiftUI approach abandoned (required full Xcode)
2. Migrated to Tauri V2 + Svelte 5 + Rust
3. Implemented MVP with clipboard monitoring, history, search, settings
4. Successfully built production app and DMG

**Current State:**
- ✅ v1.0.0 built and working
- ✅ Menu bar integration functional
- ✅ Clipboard monitoring active (500ms polling)
- ✅ In-memory history with deduplication
- ⚠️ No persistence (items lost on quit)
- ⚠️ No keyboard shortcuts
- ⚠️ No launch at login

**Next Priority Tasks:**
1. Add persistence (Tauri store plugin or JSON file)
2. Implement global keyboard shortcut (⌘⇧V)
3. Add launch at login functionality
4. Image thumbnail support
5. Automated tests

**Files to Focus On:**
- `src-tauri/src/lib.rs` - Backend logic
- `src/routes/+page.svelte` - Main app component
- `src-tauri/tauri.conf.json` - App configuration

**Build Commands:**
```bash
npm run tauri dev    # Development
npm run tauri build  # Production
```

---

*Last updated: 2026-02-18*
