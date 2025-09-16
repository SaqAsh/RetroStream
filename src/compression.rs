use crate::{config::CompressionConfig, error::{AppError, AppResult}};
use serde::{Serialize, Deserialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FrameHeader {
    pub width: u32,
    pub height: u32,
    pub compressed: bool,
    pub timestamp: u64,
    pub frame_id: u64,
}

pub struct Compressor {
    config: CompressionConfig,
    frame_counter: std::sync::atomic::AtomicU64,
}

impl Compressor {
    pub fn new(config: CompressionConfig) -> Self {
        Self {
            config,
            frame_counter: std::sync::atomic::AtomicU64::new(0),
        }
    }

    pub fn compress(&self, data: &[u8]) -> AppResult<Vec<u8>> {
        if !self.config.enabled {
            return Ok(data.to_vec());
        }

        let compressed = zstd::encode_all(data, self.config.level)
            .map_err(|e| AppError::CompressionError(format!("Compression failed: {}", e)))?;
        
        Ok(compressed)
    }

    pub fn create_frame_message(&self, data: Vec<u8>, width: u32, height: u32) -> AppResult<Vec<u8>> {
        let frame_id = self.frame_counter.fetch_add(1, std::sync::atomic::Ordering::Relaxed);
        
        let header = FrameHeader {
            width,
            height,
            compressed: self.config.enabled,
            timestamp: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_millis() as u64,
            frame_id,
        };

        let header_json = serde_json::to_string(&header)?;
        let header_bytes = header_json.as_bytes();
        let header_len = header_bytes.len() as u32;

        // Message format: [4 bytes header length][header json][frame data]
        let mut message = Vec::with_capacity(4 + header_bytes.len() + data.len());
        message.extend_from_slice(&header_len.to_le_bytes());
        message.extend_from_slice(header_bytes);
        message.extend_from_slice(&data);

        Ok(message)
    }
}

// Decompression function - available for future use
#[allow(dead_code)]
pub fn decompress(data: &[u8]) -> AppResult<Vec<u8>> {
    zstd::decode_all(data)
        .map_err(|e| AppError::CompressionError(format!("Decompression failed: {}", e)))
}
