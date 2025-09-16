use thiserror::Error;

#[derive(Error, Debug)]
pub enum AppError {
    #[error("Screen capture error: {0}")]
    #[allow(dead_code)]
    CaptureError(String),
    
    #[error("Compression error: {0}")]
    CompressionError(String),
    
    #[error("WebSocket error: {0}")]
    #[allow(dead_code)]
    WebSocketError(String),
    
    #[error("Configuration error: {0}")]
    #[allow(dead_code)]
    ConfigError(String),
    
    #[error("IO error: {0}")]
    IoError(#[from] std::io::Error),
    
    #[error("Serialization error: {0}")]
    SerializationError(#[from] serde_json::Error),
}

pub type AppResult<T> = Result<T, AppError>;
