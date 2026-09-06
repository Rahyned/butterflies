use std::fs::OpenOptions;
use std::io::Write;
use std::path::{Path, PathBuf};
use std::time::Duration;
use tauri::Manager;
use time::OffsetDateTime;

fn log_dir(app: &tauri::AppHandle) -> PathBuf {
    app.path()
        .app_log_dir()
        .unwrap_or_else(|_| std::env::temp_dir().join("butterflies-logs"))
}

fn append_line(path: &Path, line: &str) {
    if let Some(parent) = path.parent() {
        let _ = std::fs::create_dir_all(parent);
    }
    if let Ok(mut file) = OpenOptions::new().create(true).append(true).open(path) {
        let _ = writeln!(file, "{line}");
    }
}

fn timestamp() -> String {
    OffsetDateTime::now_utc()
        .format(&time::format_description::well_known::Rfc3339)
        .unwrap_or_else(|_| "?".to_string())
}

#[tauri::command]
fn append_error_log(app: tauri::AppHandle, message: String) {
    let path = log_dir(&app).join("error.log");
    append_line(&path, &format!("[{}] {}", timestamp(), message));
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![append_error_log])
        .setup(|app| {
            let handle = app.handle().clone();

            let crash_handle = handle.clone();
            let default_hook = std::panic::take_hook();
            std::panic::set_hook(Box::new(move |info| {
                let payload = info
                    .payload()
                    .downcast_ref::<&str>()
                    .map(|s| (*s).to_string())
                    .or_else(|| info.payload().downcast_ref::<String>().cloned())
                    .unwrap_or_else(|| "unknown panic".to_string());
                let loc = info
                    .location()
                    .map(|l| l.to_string())
                    .unwrap_or_default();
                let path = log_dir(&crash_handle).join("crash.log");
                append_line(&path, &format!("[{}] {} at {}", timestamp(), payload, loc));
                default_hook(info);
            }));

            std::thread::spawn(move || {
                std::thread::sleep(Duration::from_millis(800));
                if let Some(main) = handle.get_webview_window("main") {
                    let _ = main.show();
                }
            });
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}