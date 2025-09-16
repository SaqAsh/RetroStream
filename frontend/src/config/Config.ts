export interface StreamConfig {
  serverUrl: string;
  reconnectAttempts: number;
  reconnectDelay: number;
  heartbeatInterval: number;
  bufferSize: number;
  qualitySettings: QualitySettings;
}

export interface QualitySettings {
  high: QualityConfig;
  medium: QualityConfig;
  low: QualityConfig;
}

export interface QualityConfig {
  maxWidth: number;
  maxHeight: number;
  targetFPS: number;
  compressionLevel: number;
}

export class Config {
  private config: StreamConfig;

  constructor() {
    this.config = this.getDefaultConfig();
    this.loadFromEnvironment();
  }

  private getDefaultConfig(): StreamConfig {
    return {
      serverUrl: this.createServerUrl(),
      reconnectAttempts: 5,
      reconnectDelay: 2000,
      heartbeatInterval: 30000,
      bufferSize: 3,
      qualitySettings: {
        high: {
          maxWidth: 1920,
          maxHeight: 1080,
          targetFPS: 30,
          compressionLevel: 1,
        },
        medium: {
          maxWidth: 1280,
          maxHeight: 720,
          targetFPS: 24,
          compressionLevel: 3,
        },
        low: {
          maxWidth: 854,
          maxHeight: 480,
          targetFPS: 15,
          compressionLevel: 6,
        },
      },
    };
  }

  private createServerUrl(): string {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.hostname;
    // Always use port 8080 for the backend WebSocket connection
    const port = '8080';
    return `${protocol}//${host}:${port}/stream`;
  }

  private loadFromEnvironment(): void {
    // Override with environment variables or URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    
    if (urlParams.has('server')) {
      this.config.serverUrl = urlParams.get('server')!;
    }
    
    if (urlParams.has('quality')) {
      // Quality parameter can be used to override settings
    }
  }

  public get(): StreamConfig {
    return this.config;
  }

  public getQuality(quality: keyof QualitySettings): QualityConfig {
    return this.config.qualitySettings[quality];
  }

  public getServerUrl(): string {
    return this.config.serverUrl;
  }

  public getReconnectAttempts(): number {
    return this.config.reconnectAttempts;
  }

  public getReconnectDelay(): number {
    return this.config.reconnectDelay;
  }

  public getHeartbeatInterval(): number {
    return this.config.heartbeatInterval;
  }

  public getBufferSize(): number {
    return this.config.bufferSize;
  }
}
