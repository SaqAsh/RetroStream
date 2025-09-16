use crate::{config::Config, error::AppResult, compression::Compressor, metrics::Metrics};
use std::sync::Arc;
use tokio::sync::broadcast;
use tracing::{debug, warn, error};
use xcap::Monitor;

pub struct ScreenCapture {
    monitor: Monitor,
    compressor: Compressor,
    config: Arc<Config>,
    metrics: Arc<Metrics>,
    frame_count: u64,
}

impl ScreenCapture {
    pub fn new(config: Arc<Config>, metrics: Arc<Metrics>) -> AppResult<Self> {
        let monitor = Monitor::primary()
            .map_err(|e| {
                warn!("Failed to get primary monitor: {}, falling back to demo mode", e);
                // Return a dummy error that we'll handle
                crate::error::AppError::CompressionError("No monitor available".to_string())
            })?;
        
        let compressor = Compressor::new(config.compression.clone());
        
        debug!("Screen capture initialized for monitor: {:?}", monitor.name());
        
        Ok(Self {
            monitor,
            compressor,
            config,
            metrics,
            frame_count: 0,
        })
    }

    pub async fn start_capture_loop(&mut self, frame_tx: broadcast::Sender<Vec<u8>>) -> AppResult<()> {
        let mut interval = tokio::time::interval(
            std::time::Duration::from_millis(self.config.frame_interval_ms())
        );
        
        let mut frame_count = 0u64;
        let mut error_count = 0u64;
        
        debug!("Starting capture loop at {} FPS", self.config.capture.fps);
        
        loop {
            interval.tick().await;
            
            match self.capture_frame().await {
                Ok(frame_data) => {
                    frame_count += 1;
                    self.metrics.increment_frames_captured();
                    
                    // Send to all connected clients
                    let receiver_count = frame_tx.receiver_count();
                    if receiver_count > 0 {
                        match frame_tx.send(frame_data) {
                            Ok(_) => {
                                self.metrics.increment_frames_sent();
                                debug!("Frame {} sent to {} clients", frame_count, receiver_count);
                            }
                            Err(_) => {
                                warn!("No active receivers for frame {}", frame_count);
                            }
                        }
                    }
                }
                Err(e) => {
                    error_count += 1;
                    self.metrics.increment_capture_errors();
                    
                    if error_count % 10 == 0 {
                        error!("Capture error #{}: {}", error_count, e);
                    }
                    
                    // Exponential backoff on repeated errors
                    if error_count > 5 {
                        let backoff = std::cmp::min(1000, error_count * 100);
                        tokio::time::sleep(std::time::Duration::from_millis(backoff)).await;
                    }
                }
            }
        }
    }

    async fn capture_frame(&mut self) -> AppResult<Vec<u8>> {
        let start_time = std::time::Instant::now();
        
        // Try to capture real screen, fallback to demo if it fails
        let (rgba_data, width, height) = match self.monitor.capture_image() {
            Ok(image) => {
                let rgba = image.to_rgba8().into_raw();
                (rgba, image.width(), image.height())
            }
            Err(e) => {
                // Fallback to demo patterns if screen capture fails
                warn!("Screen capture failed: {}, using demo mode", e);
                let width = 1280;
                let height = 720;
                (self.generate_demo_frame(width, height), width, height)
            }
        };
        
        let capture_duration = start_time.elapsed();
        self.metrics.record_capture_duration(capture_duration);
        
        // Create frame message with metadata
        let final_data = self.compressor.create_frame_message(
            rgba_data.clone(),
            width,
            height,
        )?;
        
        self.frame_count += 1;
        
        if self.frame_count % 30 == 0 {
            debug!(
                "Frame {}: {}ms capture, {}x{}, {} bytes", 
                self.frame_count,
                capture_duration.as_millis(),
                width,
                height,
                final_data.len()
            );
        }
        
        Ok(final_data)
    }
    
    fn generate_demo_frame(&self, width: u32, height: u32) -> Vec<u8> {
        let mut rgba_data = Vec::with_capacity((width * height * 4) as usize);
        let time = self.frame_count as f32 * 0.1;
        
        for y in 0..height {
            for x in 0..width {
                let fx = x as f32 / width as f32;
                let fy = y as f32 / height as f32;
                
                // Create animated retro patterns
                let wave1 = ((fx * 10.0 + time).sin() * 0.5 + 0.5) * 255.0;
                let wave2 = ((fy * 8.0 + time * 1.3).cos() * 0.5 + 0.5) * 255.0;
                let wave3 = (((fx + fy) * 6.0 + time * 0.8).sin() * 0.5 + 0.5) * 255.0;
                
                // Retro green/cyan color scheme
                let r = (wave3 * 0.1) as u8;
                let g = ((wave1 + wave3) * 0.4) as u8;
                let b = (wave2 * 0.3) as u8;
                let a = 255u8;
                
                rgba_data.extend_from_slice(&[r, g, b, a]);
            }
        }
        
        rgba_data
    }
}
