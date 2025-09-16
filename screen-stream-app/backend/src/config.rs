use clap::Parser;
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use anyhow::Result;

#[derive(Parser)]
#[command(author, version, about, long_about = None)]
pub struct Args {
    /// Configuration file path
    #[arg(short, long, default_value = "config.toml")]
    pub config: PathBuf,
    
    /// Server port
    #[arg(short, long)]
    pub port: Option<u16>,
    
    /// Frame rate (FPS)
    #[arg(short, long)]
    pub fps: Option<u32>,
    
    /// Compression level (0-22)
    #[arg(short = 'z', long)]
    pub compression: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Config {
    pub server: ServerConfig,
    pub capture: CaptureConfig,
    pub compression: CompressionConfig,
    pub buffer_size: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ServerConfig {
    pub host: String,
    pub port: u16,
    pub max_connections: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CaptureConfig {
    pub fps: u32,
    pub width: Option<u32>,
    pub height: Option<u32>,
    pub quality: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CompressionConfig {
    pub level: i32,
    pub enabled: bool,
}

impl Default for Config {
    fn default() -> Self {
        Self {
            server: ServerConfig {
                host: "0.0.0.0".to_string(),
                port: 8080,
                max_connections: 10,
            },
            capture: CaptureConfig {
                fps: 30,
                width: None,
                height: None,
                quality: 0.8,
            },
            compression: CompressionConfig {
                level: 3,
                enabled: true,
            },
            buffer_size: 10,
        }
    }
}

impl Config {
    pub fn load(args: &Args) -> Result<Self> {
        let mut config = if args.config.exists() {
            let content = std::fs::read_to_string(&args.config)?;
            toml::from_str(&content)?
        } else {
            Self::default()
        };

        // Override with command line arguments
        if let Some(port) = args.port {
            config.server.port = port;
        }
        if let Some(fps) = args.fps {
            config.capture.fps = fps;
        }
        if let Some(compression) = args.compression {
            config.compression.level = compression;
        }

        Ok(config)
    }

    pub fn frame_interval_ms(&self) -> u64 {
        1000 / self.capture.fps as u64
    }
}
