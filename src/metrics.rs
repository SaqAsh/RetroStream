use std::sync::atomic::{AtomicU64, Ordering};
use std::time::Duration;

pub struct Metrics {
    // Connection metrics
    active_connections: AtomicU64,
    total_connections: AtomicU64,
    
    // Frame metrics
    frames_captured: AtomicU64,
    frames_sent: AtomicU64,
    frames_delivered: AtomicU64,
    frames_dropped: AtomicU64,
    
    // Error metrics
    capture_errors: AtomicU64,
    
    // Performance metrics
    avg_capture_duration_ms: AtomicU64,
    avg_compression_duration_ms: AtomicU64,
    compression_ratio: AtomicU64, // * 1000 for precision
}

impl Metrics {
    pub fn new() -> Self {
        Self {
            active_connections: AtomicU64::new(0),
            total_connections: AtomicU64::new(0),
            frames_captured: AtomicU64::new(0),
            frames_sent: AtomicU64::new(0),
            frames_delivered: AtomicU64::new(0),
            frames_dropped: AtomicU64::new(0),
            capture_errors: AtomicU64::new(0),
            avg_capture_duration_ms: AtomicU64::new(0),
            avg_compression_duration_ms: AtomicU64::new(0),
            compression_ratio: AtomicU64::new(1000), // 1.0 * 1000
        }
    }
    
    // Connection metrics
    pub fn increment_connections(&self) {
        self.active_connections.fetch_add(1, Ordering::Relaxed);
        self.total_connections.fetch_add(1, Ordering::Relaxed);
    }
    
    pub fn decrement_connections(&self) {
        self.active_connections.fetch_sub(1, Ordering::Relaxed);
    }
    
    pub fn get_active_connections(&self) -> u64 {
        self.active_connections.load(Ordering::Relaxed)
    }
    
    // Frame metrics
    pub fn increment_frames_captured(&self) {
        self.frames_captured.fetch_add(1, Ordering::Relaxed);
    }
    
    pub fn increment_frames_sent(&self) {
        self.frames_sent.fetch_add(1, Ordering::Relaxed);
    }
    
    pub fn increment_frames_delivered(&self) {
        self.frames_delivered.fetch_add(1, Ordering::Relaxed);
    }
    
    pub fn increment_dropped_frames(&self) {
        self.frames_dropped.fetch_add(1, Ordering::Relaxed);
    }
    
    pub fn increment_capture_errors(&self) {
        self.capture_errors.fetch_add(1, Ordering::Relaxed);
    }
    
    // Performance metrics
    pub fn record_capture_duration(&self, duration: Duration) {
        let ms = duration.as_millis() as u64;
        // Simple exponential moving average
        let current = self.avg_capture_duration_ms.load(Ordering::Relaxed);
        let new_avg = if current == 0 { ms } else { (current * 7 + ms) / 8 };
        self.avg_capture_duration_ms.store(new_avg, Ordering::Relaxed);
    }
    
    pub fn record_compression_duration(&self, duration: Duration) {
        let ms = duration.as_millis() as u64;
        let current = self.avg_compression_duration_ms.load(Ordering::Relaxed);
        let new_avg = if current == 0 { ms } else { (current * 7 + ms) / 8 };
        self.avg_compression_duration_ms.store(new_avg, Ordering::Relaxed);
    }
    
    pub fn record_compression_ratio(&self, original_size: usize, compressed_size: usize) {
        if original_size > 0 {
            let ratio = ((compressed_size * 1000) / original_size) as u64; // * 1000 for precision
            let current = self.compression_ratio.load(Ordering::Relaxed);
            let new_avg = if current == 1000 { ratio } else { (current * 7 + ratio) / 8 };
            self.compression_ratio.store(new_avg, Ordering::Relaxed);
        }
    }
    
    // Get summary
    pub fn get_summary(&self) -> MetricsSummary {
        MetricsSummary {
            active_connections: self.active_connections.load(Ordering::Relaxed),
            total_connections: self.total_connections.load(Ordering::Relaxed),
            frames_captured: self.frames_captured.load(Ordering::Relaxed),
            frames_sent: self.frames_sent.load(Ordering::Relaxed),
            frames_delivered: self.frames_delivered.load(Ordering::Relaxed),
            frames_dropped: self.frames_dropped.load(Ordering::Relaxed),
            capture_errors: self.capture_errors.load(Ordering::Relaxed),
            avg_capture_duration_ms: self.avg_capture_duration_ms.load(Ordering::Relaxed),
            avg_compression_duration_ms: self.avg_compression_duration_ms.load(Ordering::Relaxed),
            compression_ratio: self.compression_ratio.load(Ordering::Relaxed) as f64 / 1000.0,
        }
    }
}

#[derive(Debug)]
pub struct MetricsSummary {
    pub active_connections: u64,
    pub total_connections: u64,
    pub frames_captured: u64,
    pub frames_sent: u64,
    pub frames_delivered: u64,
    pub frames_dropped: u64,
    pub capture_errors: u64,
    pub avg_capture_duration_ms: u64,
    pub avg_compression_duration_ms: u64,
    pub compression_ratio: f64,
}

pub fn setup_metrics() -> anyhow::Result<Metrics> {
    Ok(Metrics::new())
}
