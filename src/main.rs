mod config;
mod error;
mod capture;
mod compression;
mod websocket;
mod metrics;

use anyhow::Result;
use clap::Parser;
use std::sync::Arc;
use tokio::sync::broadcast;
use tracing::{info, warn};
use tower_http::cors::CorsLayer;
use axum::{
    routing::get,
    Router,
};

use crate::{
    config::{Config, Args},
    capture::ScreenCapture,
    websocket::ws_handler,
    metrics::setup_metrics,
};

#[derive(Clone)]
pub struct AppState {
    pub frame_tx: broadcast::Sender<Vec<u8>>,
    pub config: Arc<Config>,
    pub metrics: Arc<metrics::Metrics>,
}

#[tokio::main]
async fn main() -> Result<()> {
    // Initialize tracing
    tracing_subscriber::fmt()
        .with_env_filter(tracing_subscriber::EnvFilter::from_default_env())
        .init();

    // Parse arguments and load configuration
    let args = Args::parse();
    let config = Arc::new(Config::load(&args)?);
    
    info!("Starting Screen Stream Backend v{}", env!("CARGO_PKG_VERSION"));
    info!("Configuration: {:?}", config);

    // Setup metrics
    let metrics = Arc::new(setup_metrics()?);

    // Create broadcast channel for frames
    let (frame_tx, _) = broadcast::channel(config.buffer_size);
    
    let state = AppState {
        frame_tx: frame_tx.clone(),
        config: config.clone(),
        metrics: metrics.clone(),
    };

    // Create screen capture
    let mut capture = ScreenCapture::new(config.clone(), metrics.clone())?;
    
    // Start screen capture task
    let capture_task = tokio::spawn(async move {
        capture.start_capture_loop(frame_tx).await
    });

    // Setup web server with CORS
    let app = Router::new()
        .route("/stream", get(ws_handler))
        .route("/health", get(health_check))
        .route("/metrics", get(metrics_handler))
        .layer(CorsLayer::permissive())
        .with_state(state);

    // Start server
    let addr = format!("{}:{}", config.server.host, config.server.port);
    info!("Server starting on {}", addr);
    
    let listener = tokio::net::TcpListener::bind(&addr).await?;
    
    // Graceful shutdown handling
    let server_task = tokio::spawn(async move {
        if let Err(e) = axum::serve(listener, app).await {
            warn!("Server error: {}", e);
        }
    });

    // Wait for tasks
    tokio::select! {
        result = capture_task => {
            if let Err(e) = result? {
                warn!("Capture task error: {}", e);
            }
        }
        _ = server_task => {
            info!("Server task completed");
        }
        _ = tokio::signal::ctrl_c() => {
            info!("Received Ctrl+C, shutting down...");
        }
    }

    info!("Shutdown complete");
    Ok(())
}

async fn health_check() -> &'static str {
    "OK"
}

async fn metrics_handler() -> String {
    "metrics endpoint - implement prometheus export here".to_string()
}
