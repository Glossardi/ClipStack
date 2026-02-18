# PRD: ClipStack – macOS Clipboard Manager

## 1. Overview & Ziel

**Produkt:** ClipStack – eine minimalistische, native Clipboard-History-App für macOS als Menu-Bar-Utility.

**Kernphilosophie:** *Zero friction.* Die App soll sich anfühlen wie ein eingebautes macOS-Feature – schnell, vorhersehbar, nie im Weg. Kein Onboarding, keine Überraschungen, sofort nützlich.

**Target:** Entwickler, Designer und Power-User auf macOS 14 (Sonoma) und neuer.

***

## 2. Tech Stack & Architektur-Entscheidungen

| Entscheidung | Wahl | Begründung |
|---|---|---|
| **Sprache** | Swift 5.9+ | Native Performance, kein Overhead |
| **UI-Framework** | SwiftUI (mit gezieltem AppKit für Pasteboard) | `MenuBarExtra` seit macOS 13 nativ verfügbar  [nilcoalescing](https://nilcoalescing.com/blog/BuildAMacOSMenuBarUtilityInSwiftUI); kein externes Framework nötig |
| **Persistenz** | SwiftData (macOS 14+) | Native, kein CoreData-Boilerplate, perfekte SwiftUI-Integration |
| **Architektur** | Single `@Observable` ViewModel + SwiftData | Lean, kein MVVM-Overhead, kein Reaktivitäts-Framework |
| **Minimum Deployment** | macOS 14.0 | Ermöglicht SwiftData und neueste SwiftUI-APIs |
| **Distribution** | Direkt (DMG) oder Mac App Store | Kein Sparkle nötig für MVP |

**Explizit NICHT verwendet:**
- Keine externe Component Library (Shadcn ist Web-only; native Apple-Komponenten sind die richtige Wahl für echtes macOS-Feel)
- Kein Electron, kein React, kein Flutter
- Kein SwiftData-Sync via iCloud im MVP (optional Phase 2)

***

## 3. Projektstruktur (für Coding Agent)

```
ClipStack/
├── ClipStackApp.swift          # @main, MenuBarExtra Scene
├── Models/
│   └── ClipItem.swift          # SwiftData @Model
├── Services/
│   └── ClipboardMonitor.swift  # NSPasteboard polling / change-count
├── ViewModels/
│   └── ClipboardViewModel.swift # @Observable, Geschäftslogik
├── Views/
│   ├── MenuBarView.swift        # Root-View im Popover
│   ├── ClipItemRow.swift        # Einzelne History-Zeile
│   ├── SearchBar.swift          # Custom Search-Input
│   └── SettingsView.swift       # Settings-Window (Settings {})
├── Helpers/
│   └── KeyboardShortcutHandler.swift
└── Assets.xcassets/
    └── MenuBarIcon              # 18pt Template-Image (SF Symbol: doc.on.clipboard)
```

***

## 4. Features – Scope

### MVP (Phase 1)
- **Clipboard-Monitoring:** Polling `NSPasteboard.general.changeCount` alle ~0.5 Sekunden; bei Änderung neues Item vorn einfügen [blog.grigory](https://blog.grigory.nl/posts/clipminder/)
- **History-Liste:** Maximal 50 Einträge (konfigurierbar), älteste werden verdrängt
- **Content-Types:** Text, URLs (als klickbarer Link erkennbar), Bilder (Thumbnail-Preview)
- **Klick auf Item:** Kopiert den Eintrag zurück in die Clipboard UND schließt das Popover
- **Suche:** Live-Search-Feld oben im Popover (Filter über `ClipItem.content`)
- **Löschen:** Swipe-to-delete auf einzelnen Items; "Clear All"-Button
- **Menu-Bar-Icon:** SF Symbol `doc.on.clipboard`, Template-Image (automatisch Dark/Light Mode) [nilcoalescing](https://nilcoalescing.com/blog/BuildAMacOSMenuBarUtilityInSwiftUI)
- **Quit-Button:** Kleines `xmark.circle.fill` Icon oben rechts [nilcoalescing](https://nilcoalescing.com/blog/BuildAMacOSMenuBarUtilityInSwiftUI)
- **Launch at Login:** Toggle in Settings via `SMAppService.mainApp`
- **Keyboard Shortcut:** `⌘⇧V` global zum Öffnen/Schließen (via `NSEvent.addGlobalMonitorForEvents`)
- **Kein Dock-Icon:** `LSUIElement = YES` in Info.plist [nilcoalescing](https://nilcoalescing.com/blog/BuildAMacOSMenuBarUtilityInSwiftUI)

### Phase 2 (out of scope MVP)
- iCloud-Sync zwischen Geräten
- Pinning / Favoriten
- Regex-basierter Passwort-Filter (erkennt Passwort-Manager-Copies)
- Snippet-Templates

***

## 5. UI/UX Spec

### Popover-Dimensionen
```
Width:  380pt (fix)
Height: dynamisch, max 520pt
Padding: 12pt innen
```

### Layout-Struktur (MenuBarView)
```
┌─────────────────────────────────────┐
│ 🔍 Search...                    ✕  │  ← Search + Quit
├─────────────────────────────────────┤
│ [Icon] Copied text preview...       │  ← ClipItemRow
│         14:23 · Text                │
├─────────────────────────────────────┤
│ [🖼] [Bild-Thumbnail]               │
│         14:21 · Image               │
├─────────────────────────────────────┤
│ ...                                 │
├─────────────────────────────────────┤
│ [Clear All]              [Settings] │  ← Footer
└─────────────────────────────────────┘
```

### ClipItemRow
- **Primärtext:** `.body` Schriftgröße, max 2 Zeilen, `lineLimit(2)`, `truncationMode(.tail)`
- **Sekundärtext:** Zeitstempel relativ (z.B. "vor 2 Min."), Content-Type-Label – `.caption`, `.secondary` Color
- **Hover-State:** `.listRowBackground` mit `.fill.tertiary`
- **Aktiv-Feedback:** `withAnimation(.easeOut(duration: 0.1))` beim Kopieren + kurzes Checkmark-Icon-Flash

### Design-Prinzipien
- Ausschließlich SF Symbols für alle Icons
- Vibrancy: `.menuBarExtraStyle(.window)` mit `.background(.ultraThinMaterial)` [oneuptime](https://oneuptime.com/blog/post/2026-02-02-swiftui-macos-applications/view)
- Dark/Light Mode: vollständig automatisch durch semantische Apple-Farben (`.primary`, `.secondary`, `.fill`)
- Keine Custom-Fonts, keine Custom-Farben außer Akzentfarbe des Systems
- `@Environment(\.colorScheme)` für adaptierende Elemente [oneuptime](https://oneuptime.com/blog/post/2026-02-02-swiftui-macos-applications/view)
- Animationen: `reduceMotion`-Flag respektieren [oneuptime](https://oneuptime.com/blog/post/2026-02-02-swiftui-macos-applications/view)

***

## 6. Datenmodell

```swift
// ClipItem.swift
@Model
final class ClipItem {
    var id: UUID
    var content: String          // Primärer Text-Inhalt oder Pfad
    var contentType: ContentType // .text | .url | .image
    var imageData: Data?         // Nur für .image, optional
    var createdAt: Date
    var isPinned: Bool           // Phase 2, default false

    enum ContentType: String, Codable {
        case text, url, image
    }
}
```

***

## 7. ClipboardMonitor Service

```swift
// ClipboardMonitor.swift – Pseudocode für Agent
class ClipboardMonitor: ObservableObject {
    private var timer: Timer?
    private var lastChangeCount: Int = NSPasteboard.general.changeCount

    func start() {
        timer = Timer.scheduledTimer(withTimeInterval: 0.5, repeats: true) { _ in
            let current = NSPasteboard.general.changeCount
            guard current != self.lastChangeCount else { return }
            self.lastChangeCount = current
            self.handlePasteboardChange()
        }
    }

    private func handlePasteboardChange() {
        // Prüfe auf String → .text oder .url (URL-Regex)
        // Prüfe auf NSImage → .image
        // Emit neues ClipItem via Callback/Notification
    }
}
```

**Wichtiger Hinweis für Agent:** `NSPasteboard` braucht keine Permissions. Polling auf `changeCount` ist die Apple-empfohlene Methode. Kein Background-Entitlement nötig für Menu-Bar-Apps mit `LSUIElement`.

***

## 8. Settings

Erreichbar über Footer-Button, öffnet ein natives `Settings {}`-Window:

- **History-Limit:** Stepper 10 / 25 / 50 / 100
- **Launch at Login:** Toggle (SMAppService)
- **Global Shortcut:** KeyRecorder-View für `⌘⇧V`
- **Pasteboard-Polling-Interval:** 0.3s / 0.5s / 1.0s
- **About:** Version, GitHub-Link

***

## 9. Permissions & Entitlements

```xml
<!-- Entitlements: NUR was nötig ist -->
<key>com.apple.security.app-sandbox</key>  → true (für App Store)
<!-- KEIN Accessibility-Entitlement nötig -->
<!-- KEIN Screen Recording nötig -->
<!-- NSPasteboard ist immer erlaubt -->
```

***

## 10. Coding-Agent-Anweisungen

**Für den implementierenden Agent gelten folgende Direktiven:**

1. **Kein Over-Engineering.** Kein Combine, kein Coordinator-Pattern, kein DI-Container. `@Observable` + SwiftData genügt vollständig.
2. **SwiftUI-first.** AppKit (`NSPasteboard`, `NSEvent`) nur dort einsetzen, wo SwiftUI keine API hat – dann sauber in Services/Helpers kapseln.
3. **Keine Drittbibliotheken** außer wenn ein Feature sonst >200 Zeilen AppKit-Wrapper erfordert.
4. **Jede Datei ist eigenständig kompilierbar** – klare Imports, kein zirkulärer Abhängigkeitsgraph.
5. **Accessibility:** Alle interaktiven Elemente haben `.accessibilityLabel(...)`.
6. **Preview-fähig:** Jede View hat einen `#Preview`-Block mit Mock-Daten.
7. **Kommentare:** Nur wo die Intention nicht offensichtlich ist – kein "// This sets the title".
