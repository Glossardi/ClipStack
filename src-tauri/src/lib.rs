use arboard::Clipboard;
use serde::{Deserialize, Serialize};
use std::sync::atomic::{AtomicBool, AtomicU64, Ordering};
use std::sync::{Arc, Mutex};
use std::thread;
use std::time::{Duration, SystemTime, UNIX_EPOCH};
use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Manager, State, WindowEvent,
};

#[cfg(target_os = "macos")]
#[allow(deprecated)]
use cocoa::appkit::{NSApplication, NSApplicationActivationPolicyAccessory};
#[cfg(target_os = "macos")]
#[allow(deprecated)]
use cocoa::base::{id, nil};

#[cfg(target_os = "macos")]
#[allow(deprecated)]
mod macos_panel {
    use cocoa::base::{id, nil, BOOL, NO};
    use cocoa::foundation::{NSPoint, NSRect};
    use objc::{class, msg_send, sel, sel_impl};

    extern "C" {
        fn object_setClass(obj: id, cls: *const u8) -> *const u8;
    }

    pub fn configure_as_panel(ns_window: id) {
        unsafe {
            let panel_class = class!(NSPanel);
            object_setClass(ns_window as *mut _, panel_class as *const _ as *const u8);

            // NSNonactivatingPanelMask
            let mask: usize = msg_send![ns_window, styleMask];
            let _: () = msg_send![ns_window, setStyleMask: mask | (1usize << 7)];

            // Keep panel above regular windows.
            let _: () = msg_send![ns_window, setLevel: 25i64];

            // Join all spaces and remain available in fullscreen contexts.
            let _: () = msg_send![ns_window, setCollectionBehavior: 273u64];
            let _: () = msg_send![ns_window, setHasShadow: NO];

            let _: () = msg_send![ns_window, orderOut: nil];
        }
    }

    pub fn show_panel(ns_window: id) {
        unsafe {
            let _: () = msg_send![ns_window, orderFrontRegardless];
            let _: () = msg_send![ns_window, makeKeyWindow];
        }
    }

    pub fn hide_panel(ns_window: id) {
        unsafe {
            let _: () = msg_send![ns_window, orderOut: nil];
        }
    }

    pub fn is_visible(ns_window: id) -> bool {
        unsafe {
            let v: BOOL = msg_send![ns_window, isVisible];
            v != NO
        }
    }

    fn rect_contains_point(rect: NSRect, point: NSPoint) -> bool {
        point.x >= rect.origin.x
            && point.x <= rect.origin.x + rect.size.width
            && point.y >= rect.origin.y
            && point.y <= rect.origin.y + rect.size.height
    }

    fn screen_for_point(point: NSPoint) -> id {
        unsafe {
            let screens: id = msg_send![class!(NSScreen), screens];
            let count: usize = msg_send![screens, count];
            for idx in 0..count {
                let screen: id = msg_send![screens, objectAtIndex: idx];
                let frame: NSRect = msg_send![screen, frame];
                if rect_contains_point(frame, point) {
                    return screen;
                }
            }

            let main_screen: id = msg_send![class!(NSScreen), mainScreen];
            if main_screen != nil {
                return main_screen;
            }

            let first_screen: id = msg_send![screens, firstObject];
            first_screen
        }
    }

    pub fn mouse_location() -> NSPoint {
        unsafe { msg_send![class!(NSEvent), mouseLocation] }
    }

    pub fn set_frame_below_point(ns_window: id, anchor: NSPoint) {
        unsafe {
            let screen = screen_for_point(anchor);
            if screen == nil {
                return;
            }

            let visible_frame: NSRect = msg_send![screen, visibleFrame];
            let window_frame: NSRect = msg_send![ns_window, frame];
            let margin = 8.0;
            let gap = 8.0;

            let min_x = visible_frame.origin.x + margin;
            let max_x = (visible_frame.origin.x + visible_frame.size.width
                - window_frame.size.width
                - margin)
                .max(min_x);
            let preferred_x = anchor.x - (window_frame.size.width / 2.0);
            let clamped_x = preferred_x.max(min_x).min(max_x);

            let min_top_left_y = visible_frame.origin.y + window_frame.size.height + margin;
            let max_top_left_y = visible_frame.origin.y + visible_frame.size.height - margin;
            let preferred_top_left_y = anchor.y - gap;
            let clamped_top_left_y = preferred_top_left_y.max(min_top_left_y).min(max_top_left_y);

            let top_left = NSPoint::new(clamped_x, clamped_top_left_y);
            let _: () = msg_send![ns_window, setFrameTopLeftPoint: top_left];
        }
    }

    #[derive(Clone, Copy)]
    pub struct PanelHandle(usize);

    unsafe impl Send for PanelHandle {}
    unsafe impl Sync for PanelHandle {}

    impl PanelHandle {
        pub fn new(ns_window: id) -> Self {
            Self(ns_window as usize)
        }

        pub fn id(self) -> id {
            self.0 as id
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

#[derive(Clone)]
struct ClipboardState {
    items: Arc<Mutex<Vec<ClipItem>>>,
    history_limit: Arc<Mutex<usize>>,
    last_seen: Arc<Mutex<Option<String>>>,
}

impl ClipboardState {
    fn new() -> Self {
        Self {
            items: Arc::new(Mutex::new(Vec::new())),
            history_limit: Arc::new(Mutex::new(50)),
            last_seen: Arc::new(Mutex::new(None)),
        }
    }
}

fn now_millis() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis() as u64
}

fn detect_content_type(content: &str) -> String {
    let trimmed = content.trim();
    if trimmed.starts_with("http://") || trimmed.starts_with("https://") {
        "url".to_string()
    } else {
        "text".to_string()
    }
}

fn trim_to_limit(items: &mut Vec<ClipItem>, limit: usize) {
    while items.len() > limit {
        items.pop();
    }
}

fn upsert_clip_item(state: &ClipboardState, content: String) -> Option<ClipItem> {
    if content.trim().is_empty() {
        return None;
    }

    let limit = *state.history_limit.lock().unwrap();
    let mut items = state.items.lock().unwrap();

    if let Some(pos) = items.iter().position(|item| item.content == content) {
        let mut existing = items.remove(pos);
        existing.created_at = now_millis();
        existing.content_type = detect_content_type(&existing.content);
        items.insert(0, existing.clone());
        trim_to_limit(&mut items, limit);
        return Some(existing);
    }

    let item = ClipItem {
        id: uuid::Uuid::new_v4().to_string(),
        content_type: detect_content_type(&content),
        content,
        created_at: now_millis(),
    };

    items.insert(0, item.clone());
    trim_to_limit(&mut items, limit);
    Some(item)
}

fn refresh_last_seen(state: &ClipboardState, content: &str) {
    let mut last_seen = state.last_seen.lock().unwrap();
    *last_seen = Some(content.to_string());
}

fn start_clipboard_monitor(state: ClipboardState) {
    thread::spawn(move || {
        let mut clipboard = match Clipboard::new() {
            Ok(clipboard) => clipboard,
            Err(err) => {
                eprintln!("clipboard monitor failed to initialize: {err}");
                return;
            }
        };

        loop {
            if let Ok(content) = clipboard.get_text() {
                if !content.trim().is_empty() {
                    let should_capture = {
                        let mut last_seen = state.last_seen.lock().unwrap();
                        if last_seen.as_ref() == Some(&content) {
                            false
                        } else {
                            *last_seen = Some(content.clone());
                            true
                        }
                    };

                    if should_capture {
                        let _ = upsert_clip_item(&state, content);
                    }
                }
            }

            thread::sleep(Duration::from_millis(350));
        }
    });
}

#[tauri::command]
fn get_clipboard_items(state: State<ClipboardState>) -> Vec<ClipItem> {
    state.items.lock().unwrap().clone()
}

#[tauri::command]
fn copy_to_clipboard(content: String, state: State<ClipboardState>) -> Result<(), String> {
    let mut clipboard = Clipboard::new().map_err(|e| e.to_string())?;
    clipboard
        .set_text(content.clone())
        .map_err(|e| e.to_string())?;

    refresh_last_seen(state.inner(), &content);
    let _ = upsert_clip_item(state.inner(), content);

    Ok(())
}

#[tauri::command]
fn add_clipboard_item(content: String, state: State<ClipboardState>) -> Result<ClipItem, String> {
    upsert_clip_item(state.inner(), content).ok_or_else(|| "Clipboard content is empty".to_string())
}

#[tauri::command]
fn delete_clipboard_item(id: String, state: State<ClipboardState>) -> Result<(), String> {
    let mut items = state.items.lock().unwrap();
    items.retain(|item| item.id != id);
    Ok(())
}

#[tauri::command]
fn clear_clipboard_items(state: State<ClipboardState>) -> Result<(), String> {
    state.items.lock().unwrap().clear();
    *state.last_seen.lock().unwrap() = None;
    Ok(())
}

#[tauri::command]
fn set_history_limit(limit: usize, state: State<ClipboardState>) {
    let clamped_limit = limit.clamp(10, 500);

    *state.history_limit.lock().unwrap() = clamped_limit;

    let mut items = state.items.lock().unwrap();
    trim_to_limit(&mut items, clamped_limit);
}

#[tauri::command]
fn get_from_clipboard() -> Result<String, String> {
    let mut clipboard = Clipboard::new().map_err(|e| e.to_string())?;
    clipboard.get_text().map_err(|e| e.to_string())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn detects_url_content_type() {
        assert_eq!(detect_content_type("https://example.com"), "url");
        assert_eq!(detect_content_type("http://example.com"), "url");
        assert_eq!(detect_content_type("hello world"), "text");
    }

    #[test]
    fn deduplicates_and_promotes_existing_item() {
        let state = ClipboardState::new();

        let first = upsert_clip_item(&state, "alpha".to_string()).unwrap();
        let _ = upsert_clip_item(&state, "beta".to_string()).unwrap();
        let promoted = upsert_clip_item(&state, "alpha".to_string()).unwrap();

        let items = state.items.lock().unwrap();
        assert_eq!(items.len(), 2);
        assert_eq!(items[0].content, "alpha");
        assert_eq!(promoted.id, first.id);
    }

    #[test]
    fn enforces_history_limit() {
        let state = ClipboardState::new();
        *state.history_limit.lock().unwrap() = 3;

        let _ = upsert_clip_item(&state, "one".to_string());
        let _ = upsert_clip_item(&state, "two".to_string());
        let _ = upsert_clip_item(&state, "three".to_string());
        let _ = upsert_clip_item(&state, "four".to_string());

        let items = state.items.lock().unwrap();
        assert_eq!(items.len(), 3);
        assert_eq!(items[0].content, "four");
        assert_eq!(items[2].content, "two");
    }

    #[test]
    fn ignores_empty_content() {
        let state = ClipboardState::new();

        assert!(upsert_clip_item(&state, "   ".to_string()).is_none());
        assert!(state.items.lock().unwrap().is_empty());
    }
}

pub fn run() {
    let clipboard_state = ClipboardState::new();

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(clipboard_state.clone())
        .invoke_handler(tauri::generate_handler![
            get_clipboard_items,
            copy_to_clipboard,
            add_clipboard_item,
            delete_clipboard_item,
            clear_clipboard_items,
            set_history_limit,
            get_from_clipboard
        ])
        .setup(move |app| {
            start_clipboard_monitor(clipboard_state.clone());

            #[cfg(target_os = "macos")]
            {
                #[allow(deprecated)]
                unsafe {
                    let ns_app: id = cocoa::appkit::NSApplication::sharedApplication(nil);
                    ns_app.setActivationPolicy_(NSApplicationActivationPolicyAccessory);
                }
            }

            let quit = MenuItem::with_id(app, "quit", "Quit ClipStack", true, None::<&str>)?;
            let clear = MenuItem::with_id(
                app,
                "clear_history",
                "Clear Clipboard History",
                true,
                None::<&str>,
            )?;
            let menu = Menu::with_items(app, &[&clear, &quit])?;

            if let Some(window) = app.get_webview_window("main") {
                let _ = window.hide();
            }

            #[cfg(target_os = "macos")]
            let panel = {
                let window = app.get_webview_window("main").expect("main window");
                let ptr = window.ns_window().expect("ns_window");
                #[allow(deprecated)]
                let ns_win = ptr as id;
                macos_panel::configure_as_panel(ns_win);
                macos_panel::PanelHandle::new(ns_win)
            };

            let tray_clicking = Arc::new(AtomicBool::new(false));
            let tray_clicking_for_window_events = tray_clicking.clone();
            let hide_guard_until = Arc::new(AtomicU64::new(0));
            let hide_guard_until_for_window_events = hide_guard_until.clone();

            #[cfg(target_os = "macos")]
            {
                let panel_for_window_events = panel;
                if let Some(window) = app.get_webview_window("main") {
                    window.on_window_event(move |event| match event {
                        WindowEvent::Focused(false) => {
                            let now = now_millis();
                            let guard_until =
                                hide_guard_until_for_window_events.load(Ordering::SeqCst);
                            if !tray_clicking_for_window_events.load(Ordering::SeqCst)
                                && now >= guard_until
                            {
                                macos_panel::hide_panel(panel_for_window_events.id());
                            }
                        }
                        WindowEvent::CloseRequested { api, .. } => {
                            api.prevent_close();
                            macos_panel::hide_panel(panel_for_window_events.id());
                        }
                        _ => {}
                    });
                }
            }

            let _tray = TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&menu)
                .show_menu_on_left_click(false)
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "quit" => app.exit(0),
                    "clear_history" => {
                        let state = app.state::<ClipboardState>();
                        state.items.lock().unwrap().clear();
                        *state.last_seen.lock().unwrap() = None;
                    }
                    _ => {}
                })
                .on_tray_icon_event(move |_tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state,
                        ..
                    } = event
                    {
                        #[cfg(target_os = "macos")]
                        {
                            match button_state {
                                MouseButtonState::Down => {
                                    tray_clicking.store(true, Ordering::SeqCst);
                                    hide_guard_until.store(now_millis() + 350, Ordering::SeqCst);
                                }
                                MouseButtonState::Up => {
                                    let ns_win = panel.id();

                                    if macos_panel::is_visible(ns_win) {
                                        macos_panel::hide_panel(ns_win);
                                    } else {
                                        let pointer = macos_panel::mouse_location();
                                        macos_panel::set_frame_below_point(ns_win, pointer);
                                        macos_panel::show_panel(ns_win);
                                        hide_guard_until
                                            .store(now_millis() + 320, Ordering::SeqCst);
                                    }

                                    let guard = tray_clicking.clone();
                                    thread::spawn(move || {
                                        thread::sleep(Duration::from_millis(170));
                                        guard.store(false, Ordering::SeqCst);
                                    });
                                }
                            }
                        }

                        #[cfg(not(target_os = "macos"))]
                        {
                            let app = _tray.app_handle();
                            if let Some(window) = app.get_webview_window("main") {
                                if window.is_visible().unwrap_or(false) {
                                    let _ = window.hide();
                                } else {
                                    let _ = window.show();
                                    let _ = window.set_focus();
                                }
                            }
                        }
                    }
                })
                .build(app)?;

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running ClipStack");
}
