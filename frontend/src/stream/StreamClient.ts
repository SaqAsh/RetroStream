import { EventEmitter } from '../utils/EventEmitter';
import { Logger } from '../utils/Logger';
import { Config, QualityConfig, QualitySettings } from '../config/Config';
import { FrameBuffer } from './FrameBuffer';
import { Decompressor } from './Decompressor';

export interface FrameMetadata {
  width: number;
  height: number;
  compressed: boolean;
  timestamp: number;
  frameId: number;
  latency?: number;
}

export interface StreamStats {
  fps: number;
  latency: number;
  droppedFrames: number;
  totalFrames: number;
}

interface StreamEvents extends Record<string, unknown> {
  connected: void;
  disconnected: void;
  error: Error;
  frame: { data: ImageData; metadata: FrameMetadata };
  stats: StreamStats;
}

export class StreamClient extends EventEmitter<StreamEvents> {
  private ws?: WebSocket;
  private config: Config;
  private logger: Logger;
  private frameBuffer: FrameBuffer;
  private decompressor: Decompressor;
  
  private reconnectAttempts = 0;
  private reconnectTimer?: number;
  private heartbeatTimer?: number;
  private statsTimer?: number;
  
  private currentQuality: keyof QualitySettings = 'medium';
  private isConnected = false;
  private isPaused = false;
  
  private stats: StreamStats = {
    fps: 0,
    latency: 0,
    droppedFrames: 0,
    totalFrames: 0,
  };
  
  private fpsCounter = {
    frames: 0,
    lastTime: Date.now(),
    currentFPS: 0,
  };

  constructor(config: Config, logger: Logger) {
    super();
    this.config = config;
    this.logger = logger;
    this.frameBuffer = new FrameBuffer(config.getBufferSize());
    this.decompressor = new Decompressor();
    
    this.setupStatsTracking();
  }

  public async connect(): Promise<void> {
    if (this.isConnected || this.ws?.readyState === WebSocket.CONNECTING) {
      return;
    }

    try {
      this.logger.info(`Connecting to ${this.config.getServerUrl()}`);
      
      this.ws = new WebSocket(this.config.getServerUrl());
      this.ws.binaryType = 'arraybuffer';
      
      this.setupWebSocketHandlers();
      
      // Wait for connection or timeout
      await this.waitForConnection();
      
    } catch (error) {
      this.logger.error('Connection failed:', error);
      this.handleConnectionError(error as Error);
      throw error;
    }
  }

  private setupWebSocketHandlers(): void {
    if (!this.ws) return;

    this.ws.onopen = () => {
      this.logger.info('WebSocket connected');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.startHeartbeat();
      this.emit('connected', undefined);
    };

    this.ws.onclose = (event) => {
      this.logger.warning(`WebSocket closed: ${event.code} - ${event.reason}`);
      this.handleDisconnection();
    };

    this.ws.onerror = (error) => {
      this.logger.error('WebSocket error:', error);
      this.handleConnectionError(new Error('WebSocket error'));
    };

    this.ws.onmessage = (event) => {
      if (!this.isPaused) {
        this.handleMessage(event.data);
      }
    };
  }

  private async waitForConnection(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.ws) {
        reject(new Error('WebSocket not initialized'));
        return;
      }

      const timeout = setTimeout(() => {
        reject(new Error('Connection timeout'));
      }, 10000);

      this.ws.addEventListener('open', () => {
        clearTimeout(timeout);
        resolve();
      });

      this.ws.addEventListener('error', () => {
        clearTimeout(timeout);
        reject(new Error('Connection failed'));
      });
    });
  }

  private handleMessage(data: ArrayBuffer): void {
    try {
      const frameData = this.parseFrameMessage(data);
      if (frameData) {
        this.processFrame(frameData.header, frameData.payload);
      }
    } catch (error) {
      this.logger.error('Error processing frame:', error);
    }
  }

  private parseFrameMessage(data: ArrayBuffer): { header: FrameMetadata; payload: ArrayBuffer } | null {
    const view = new DataView(data);
    
    if (data.byteLength < 4) {
      this.logger.warning('Frame message too short');
      return null;
    }

    const headerLength = view.getUint32(0, true);
    
    if (data.byteLength < 4 + headerLength) {
      this.logger.warning('Invalid frame message format');
      return null;
    }

    const headerBytes = data.slice(4, 4 + headerLength);
    const headerText = new TextDecoder().decode(headerBytes);
    
    try {
      const header = JSON.parse(headerText) as FrameMetadata;
      const payload = data.slice(4 + headerLength);
      
      // Calculate latency
      header.latency = Date.now() - header.timestamp;
      
      return { header, payload };
    } catch (error) {
      this.logger.error('Failed to parse frame header:', error);
      return null;
    }
  }

  private async processFrame(metadata: FrameMetadata, payload: ArrayBuffer): Promise<void> {
    try {
      // Update stats
      this.stats.totalFrames++;
      this.updateFPS();

      // For now, assume data is uncompressed RGBA
      const frameData = new Uint8Array(payload);
      
      // Validate frame size
      const expectedSize = metadata.width * metadata.height * 4;
      if (frameData.length !== expectedSize) {
        this.logger.warning(`Frame size mismatch: expected ${expectedSize}, got ${frameData.length}`);
        return;
      }

      // Create ImageData
      const imageData = new ImageData(
        new Uint8ClampedArray(frameData),
        metadata.width,
        metadata.height
      );

      // Buffer frame
      this.frameBuffer.addFrame({
        imageData,
        metadata,
        timestamp: Date.now(),
      });

      // Emit the latest frame
      const latestFrame = this.frameBuffer.getLatestFrame();
      if (latestFrame) {
        this.emit('frame', {
          data: latestFrame.imageData,
          metadata: latestFrame.metadata,
        });
      }

    } catch (error) {
      this.logger.error('Error processing frame:', error);
      this.stats.droppedFrames++;
    }
  }

  private updateFPS(): void {
    this.fpsCounter.frames++;
    const now = Date.now();
    
    if (now - this.fpsCounter.lastTime >= 1000) {
      this.fpsCounter.currentFPS = this.fpsCounter.frames;
      this.fpsCounter.frames = 0;
      this.fpsCounter.lastTime = now;
      
      this.stats.fps = this.fpsCounter.currentFPS;
    }
  }

  private setupStatsTracking(): void {
    this.statsTimer = window.setInterval(() => {
      if (this.isConnected) {
        const latestFrame = this.frameBuffer.getLatestFrame();
        if (latestFrame) {
          this.stats.latency = latestFrame.metadata.latency || 0;
        }
        
        this.emit('stats', { ...this.stats });
      }
    }, 1000);
  }

  private startHeartbeat(): void {
    this.heartbeatTimer = window.setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'ping' }));
      }
    }, this.config.getHeartbeatInterval());
  }

  private handleDisconnection(): void {
    this.isConnected = false;
    this.stopHeartbeat();
    this.emit('disconnected', undefined);
    
    if (this.reconnectAttempts < this.config.getReconnectAttempts()) {
      this.scheduleReconnect();
    }
  }

  private handleConnectionError(error: Error): void {
    this.isConnected = false;
    this.emit('error', error);
    
    if (this.reconnectAttempts < this.config.getReconnectAttempts()) {
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect(): void {
    this.reconnectAttempts++;
    const delay = this.config.getReconnectDelay() * Math.pow(2, this.reconnectAttempts - 1);
    
    this.logger.info(`Scheduling reconnect attempt ${this.reconnectAttempts} in ${delay}ms`);
    
    this.reconnectTimer = window.setTimeout(() => {
      this.connect().catch((error) => {
        this.logger.error('Reconnection failed:', error);
      });
    }, delay);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = undefined;
    }
  }

  public disconnect(): void {
    this.logger.info('Disconnecting from stream server');
    
    this.isConnected = false;
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = undefined;
    }
    
    this.stopHeartbeat();
    
    if (this.statsTimer) {
      clearInterval(this.statsTimer);
      this.statsTimer = undefined;
    }
    
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = undefined;
    }
    
    this.emit('disconnected', undefined);
  }

  public pause(): void {
    this.isPaused = true;
    this.logger.debug('Stream paused');
  }

  public resume(): void {
    this.isPaused = false;
    this.logger.debug('Stream resumed');
  }

  public setQuality(quality: keyof QualitySettings): void {
    this.currentQuality = quality;
    
    if (this.ws?.readyState === WebSocket.OPEN) {
      const qualityConfig = this.config.getQuality(quality);
      this.ws.send(JSON.stringify({
        type: 'quality',
        config: qualityConfig,
      }));
    }
  }

  public getCurrentFPS(): number {
    return this.fpsCounter.currentFPS;
  }

  public getStats(): StreamStats {
    return { ...this.stats };
  }

  public isConnectedState(): boolean {
    return this.isConnected;
  }
}
