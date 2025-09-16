use crate::{AppState, error::AppResult};
use axum::{
    extract::{ws::{Message, WebSocket, WebSocketUpgrade}, State},
    response::Response,
};
use std::net::SocketAddr;
use tracing::{info, warn, debug};

pub async fn ws_handler(
    ws: WebSocketUpgrade,
    State(state): State<AppState>,
) -> Response {
    ws.on_upgrade(move |socket| handle_websocket(socket, state))
}

async fn handle_websocket(socket: WebSocket, state: AppState) {
    let remote_addr = get_socket_addr(&socket);
    info!("WebSocket connection established from {:?}", remote_addr);
    
    state.metrics.increment_connections();
    
    let result = handle_client(socket, state.clone()).await;
    
    state.metrics.decrement_connections();
    
    match result {
        Ok(_) => info!("WebSocket connection closed cleanly for {:?}", remote_addr),
        Err(e) => warn!("WebSocket connection error for {:?}: {}", remote_addr, e),
    }
}

async fn handle_client(mut socket: WebSocket, state: AppState) -> AppResult<()> {
    let mut frame_rx = state.frame_tx.subscribe();
    let mut ping_interval = tokio::time::interval(std::time::Duration::from_secs(30));
    let mut frame_count = 0u64;
    
    loop {
        tokio::select! {
            // Handle incoming frames
            frame_result = frame_rx.recv() => {
                match frame_result {
                    Ok(frame_data) => {
                        frame_count += 1;
                        
                        if socket.send(Message::Binary(frame_data)).await.is_err() {
                            debug!("Failed to send frame {}, client disconnected", frame_count);
                            break;
                        }
                        
                        state.metrics.increment_frames_delivered();
                        
                        if frame_count % 100 == 0 {
                            debug!("Delivered {} frames to client", frame_count);
                        }
                    }
                    Err(tokio::sync::broadcast::error::RecvError::Lagged(skipped)) => {
                        warn!("Client lagging, skipped {} frames", skipped);
                        state.metrics.increment_dropped_frames();
                        continue;
                    }
                    Err(_) => {
                        warn!("Frame receiver closed");
                        break;
                    }
                }
            }
            
            // Send periodic pings
            _ = ping_interval.tick() => {
                if socket.send(Message::Ping(vec![])).await.is_err() {
                    debug!("Failed to send ping, client disconnected");
                    break;
                }
            }
            
            // Handle incoming messages from client
            msg_result = socket.recv() => {
                match msg_result {
                    Some(Ok(Message::Pong(_))) => {
                        debug!("Received pong from client");
                    }
                    Some(Ok(Message::Close(_))) => {
                        debug!("Client requested close");
                        break;
                    }
                    Some(Ok(Message::Text(text))) => {
                        debug!("Received text from client: {}", text);
                        // Could handle client commands here
                    }
                    Some(Err(e)) => {
                        warn!("WebSocket message error: {}", e);
                        break;
                    }
                    None => {
                        debug!("WebSocket stream ended");
                        break;
                    }
                    _ => {
                        // Ignore other message types
                    }
                }
            }
        }
    }
    
    Ok(())
}

fn get_socket_addr(_socket: &WebSocket) -> Option<SocketAddr> {
    // This is a placeholder - axum doesn't expose remote addr directly
    // In a real implementation, you'd extract this from the request
    None
}
