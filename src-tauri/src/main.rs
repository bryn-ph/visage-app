// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use cpal::traits::{DeviceTrait, HostTrait, StreamTrait};
use tauri::Emitter;

const BATCH_SIZE: usize = 2048;

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            let handle = app.handle().clone();

            std::thread::spawn(move || {
                capture_system_audio(handle);
            });

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

fn capture_system_audio(app_handle: tauri::AppHandle) {
    let host = cpal::default_host();
    let device = host
        .default_output_device()
        .expect("No output device found");
    let config = device.default_output_config().unwrap();

    let mut batch: Vec<f32> = Vec::with_capacity(BATCH_SIZE);

    let stream = device
        .build_input_stream(
            &config.into(),
            move |data: &[f32], _: &cpal::InputCallbackInfo| {
                batch.extend_from_slice(data);

                if batch.len() >= BATCH_SIZE {
                    app_handle.emit("audio-data", batch.clone()).unwrap();
                    batch.clear();
                }
            },
            move |err| eprintln!("Stream error: {:?}", err),
            None,
        )
        .unwrap();

    stream.play().unwrap();

    loop {
        std::thread::sleep(std::time::Duration::from_millis(100));
    }
}
