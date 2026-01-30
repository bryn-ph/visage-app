use cpal::traits::{DeviceTrait, HostTrait, StreamTrait};
use tauri::Emitter;

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

    let stream = device
        .build_input_stream(
            &config.into(),
            move |data: &[f32], _: &cpal::InputCallbackInfo| {
                let samples: Vec<f32> = data.to_vec();
                app_handle.emit("audio-data", samples).unwrap();
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
