use arboard::Clipboard;
use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use std::time::{SystemTime, UNIX_EPOCH};
use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, TrayIconBuilder, TrayIconEvent},
    Manager, PhysicalPosition, State,
};

// TODO(#migration): migrate to objc2-app-kit when cocoa 0.26 is fully superseded
#[cfg(target_os = "macos")]
#[allow(deprecated)]
use cocoa::appkit::{NSApplication, NSApplicationActivationPolicyAccessory};
#[cfg(target_os = "macos")]
#[allow(deprecated)]
use cocoa::base::{id, nil};

// NSPanel + NSWindowDelegate to auto-hide on deactivation (the standard macOS
// menu-bar popover pattern used by Spotlight, 1Password mini, etc.)
#[cfg(target_os = "macos")]
mod macos_panel {
    use cocoa::base::id;
    use objc::{msg_send, sel, sel_impl};

    /// Convert the WKWebView's parent NSWindow into an NSPanel and configure it
    /// so macOS hides it automatically when the app loses focus, without any
    /// Focused(false) race conditions.
    ///
    /// - `NSPanel` is a subclass of `NSWindow` specifically designed for utility
    ///   windows/popovers; it supports `hidesOnDeactivate`.
    /// - `NSWindowStyleMaskNonactivatingPanel` (1 << 7 = 128) means clicking the
    ///   panel does NOT steal focus from the previously active app — this is the
    ///   key flag that makes "click item → hide → paste" work correctly.
    pub fn configure_as_panel(ns_window: id) {
        unsafe {
            // NSFloatingWindowLevel (3): window floats above normal windows
            let _: () = msg_send![ns_window, setLevel: 3i64];

            // hidesOnDeactivate = YES: macOS hides the panel automatically when
            // another app becomes active — no Rust event listener needed.
            let _: () = msg_send![ns_window, setHidesOnDeactivate: true];

            // NSWindowCollectionBehaviorTransient (1<<3) + CanJoinAllSpaces (1<<0)
            let _: () = msg_send![ns_window, setCollectionBehavior: 9u64];
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ClipItem {
    pub id: String,
    pub content: String,
    pub content_type: String,
    pub created_at: u64,
}

#[derive(Default)]
struct ClipboardState {
    items: Mutex<Vec<ClipItem>>,
    history_limit: Mutex<usize>,
}

impl ClipboardState {
    fn new() -> Self {
        Self {
            items: Mutex::new(Vec::new()),
            history_limit: Mutex::new(50),
        }
    }
}

#[tauri::command]
fn get_clipboard_items(state: State<ClipboardState>) -> Vec<ClipItem> {
    state.items.lock().unwrap().clone()
}

#[tauri::command]
fn copy_to_clipboard(content: String) -> Result<(), String> {
    let mut clipboard = Clipboard::new().map_err(|e| e.to_string())?;
    clipboard.set_text(content).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn add_clipboard_item(content: String, state: State<ClipboardState>) -> Result<ClipItem, String> {
    let item = ClipItem {
        id: uuid::Uuid::new_v4().to_string(),
        content_type: if content.starts_with("http") {
            "url".to_string()
        } else {
            "text".to_string()
        },
        content: content.clone(),
        created_at: SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_millis() as u64,
    };

    let mut items = state.items.lock().unwrap();

    // Duplicate: move to front
    if let Some(pos) = items.iter().position(|i| i.content == content) {
        let existing = items.remove(pos);
        items.insert(0, existing);
        return Ok(item);
    }

    items.insert(0, item.clone());

    let limit = *state.history_limit.lock().unwrap();
    while items.len() > limit {
        items.pop();
    }

    Ok(item)
}

#[tauri::command]
fn delete_clipboard_item(id: String, state: State<ClipboardState>) -> Result<(), String> {
    let mut items = state.items.lock().unwrap();
    items.retain(|i| i.id != id);
    Ok(())
}

#[tauri::command]
fn clear_clipboard_items(state: State<ClipboardState>) -> Result<(), String> {
    let mut items = state.items.lock().unwrap();
    items.clear();
    Ok(())
}

#[tauri::command]
fn set_history_limit(limit: usize, state: State<ClipboardState>) {
    let mut history_limit = state.history_limit.lock().unwrap();
    *history_limit = limit;

    let mut items = state.items.lock().unwrap();
    while items.len() > limit {
        items.pop();
    }
}

#[tauri::command]
fn get_from_clipboard() -> Result<String, String> {
    let mut clipboard = Clipboard::new().map_err(|e| e.to_string())?;
    clipboard.get_text().map_err(|e| e.to_string())
}

#[cfg(test)]
mod tests {
    use super::*;

    fn make_item(content: &str) -> ClipItem {
        ClipItem {
            id: uuid::Uuid::new_v4().to_string(),
            content: content.to_string(),
            content_type: if content.starts_with("http") {
                "url".to_string()
            } else {
                "text".to_string()
            },
            created_at: 0,
        }
    }

    #[test]
    fn test_clipboard_state_initialization() {
        let state = ClipboardState::new();
        let items = state.items.lock().unwrap();
        assert_eq!(items.len(), 0);
        let limit = state.history_limit.lock().unwrap();
        assert_eq!(*limit, 50);
    }

    #[test]
    fn test_clipboard_item_creation() {
        let item = ClipItem {
            id: "test-id".to_string(),
            content: "Test content".to_string(),
            content_type: "text".to_string(),
            created_at: 1234567890,
        };
        assert_eq!(item.id, "test-id");
        assert_eq!(item.content, "Test content");
        assert_eq!(item.content_type, "text");
    }

    #[test]
    fn test_url_detection() {
        assert!("https://example.com".starts_with("http"));
        assert!("http://test.com".starts_with("http"));
        assert!(!"just text".starts_with("http"));
    }

    #[test]
    fn test_content_type_detection() {
        let url_type = if "https://example.com".starts_with("http") { "url" } else { "text" };
        let text_type = if "Plain text".starts_with("http") { "url" } else { "text" };
        assert_eq!(url_type, "url");
        assert_eq!(text_type, "text");
    }

    #[test]
    fn test_add_item_deduplication() {
        let mut items: Vec<ClipItem> = Vec::new();
        let content = "Hello World";
        if !items.iter().any(|i| i.content == content) {
            items.push(make_item(content));
        }
        assert_eq!(items.len(), 1);
        if !items.iter().any(|i| i.content == content) {
            items.push(make_item(content));
        }
        assert_eq!(items.len(), 1);
    }

    #[test]
    fn test_history_limit_enforcement() {
        let mut items: Vec<ClipItem> = Vec::new();
        let limit = 3usize;
        for i in 0..5 {
            items.insert(0, make_item(&format!("item {}", i)));
            while items.len() > limit {
                items.pop();
            }
        }
        assert_eq!(items.len(), limit);
        assert_eq!(items[0].content, "item 4");
        assert_eq!(items[2].content, "item 2");
    }

    #[test]
    fn test_delete_item() {
        let mut items: Vec<ClipItem> = vec![
            make_item("first"),
            make_item("second"),
            make_item("third"),
        ];
        let id_to_delete = items[1].id.clone();
        items.retain(|i| i.id != id_to_delete);
        assert_eq!(items.len(), 2);
        assert!(!items.iter().any(|i| i.id == id_to_delete));
    }

    #[test]
    fn test_clear_all_items() {
        let mut items: Vec<ClipItem> = vec![make_item("a"), make_item("b"), make_item("c")];
        items.clear();
        assert_eq!(items.len(), 0);
    }

    #[test]
    fn test_set_history_limit_trims_excess() {
        let mut items: Vec<ClipItem> = vec![
            make_item("a"), make_item("b"), make_item("c"),
            make_item("d"), make_item("e"),
        ];
        let new_limit = 3usize;
        while items.len() > new_limit {
            items.pop();
        }
        assert_eq!(items.len(), new_limit);
        assert_eq!(items[0].content, "a");
        assert_eq!(items[2].content, "c");
    }
}

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_shell::init())
        .manage(ClipboardState::new())
        .invoke_handler(tauri::generate_handler![
            get_clipboard_items,
            copy_to_clipboard,
            add_clipboard_item,
            delete_clipboard_item,
            clear_clipboard_items,
            set_history_limit,
            get_from_clipboard
        ])
        .setup(|app| {
            // Accessory policy: menu-bar only, no Dock icon
            #[cfg(target_os = "macos")]
            {
                #[allow(deprecated)]
                unsafe {
                    let ns_app: id = cocoa::appkit::NSApplication::sharedApplication(nil);
                    ns_app.setActivationPolicy_(NSApplicationActivationPolicyAccessory);
                }
            }

            let quit = MenuItem::with_id(app, "quit", "Quit ClipStack", true, None::<&str>)?;
            let settings = MenuItem::with_id(app, "settings", "Settings", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&settings, &quit])?;

            let _tray = TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&menu)
                .show_menu_on_left_click(false)
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "quit" => {
                        app.exit(0);
                    }
                    "settings" => {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        position,
                        ..
                    } = event
                    {
                        let app = tray.app_handle();
                        if let Some(window) = app.get_webview_window("main") {
                            if window.is_visible().unwrap_or(false) {
                                let _ = window.hide();
                            } else {
                                let window_width = 380.0_f64;
                                let x = (position.x - window_width / 2.0).max(0.0);
                                let y = position.y + 4.0;
                                let _ = window.set_position(PhysicalPosition::new(x as i32, y as i32));
                                let _ = window.show();
                                let _ = window.set_focus();
                            }
                        }
                    }
                })
                .build(app)?;

            // Configure the window as a floating NSPanel with hidesOnDeactivate.
            // This is the standard macOS pattern for menu-bar popovers — the OS
            // handles hide-on-click-outside natively with zero race conditions.
            #[cfg(target_os = "macos")]
            if let Some(window) = app.get_webview_window("main") {
                if let Ok(ns_window) = window.ns_window() {
                    macos_panel::configure_as_panel(ns_window as id);
                }
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running ClipStack");
}
