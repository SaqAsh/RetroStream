import { StreamClient } from './stream/StreamClient';
import { UIController } from './ui/UIController';
import { Logger } from './utils/Logger';
import { Config } from './config/Config';

class App {
  private streamClient: StreamClient;
  private uiController: UIController;
  private logger: Logger;
  private config: Config;

  constructor() {
    this.config = new Config();
    this.logger = new Logger();
    this.uiController = new UIController(this.logger);
    this.streamClient = new StreamClient(this.config, this.logger);
    
    this.initialize();
  }

  private async initialize(): Promise<void> {
    this.logger.info('Initializing RetroStream application...');
    
    try {
      // Initialize UI
      await this.uiController.initialize();
      
      // Setup event handlers
      this.setupEventHandlers();
      
      // Auto-connect
      await this.connect();
      
      this.logger.info('Application initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize application:', error);
      this.uiController.showError('Initialization failed');
    }
  }

  private setupEventHandlers(): void {
    // Stream events
    this.streamClient.on('connected', () => {
      this.uiController.setConnectionStatus('connected');
      this.logger.info('Connected to stream server');
    });

    this.streamClient.on('disconnected', () => {
      this.uiController.setConnectionStatus('disconnected');
      this.logger.warning('Disconnected from stream server');
    });

    this.streamClient.on('error', (error) => {
      this.uiController.setConnectionStatus('error');
      this.uiController.showError('Connection error');
      this.logger.error('Stream error:', error);
    });

    this.streamClient.on('frame', (data) => {
      this.uiController.renderFrame(data.data, data.metadata);
      this.uiController.updateStats({
        fps: this.streamClient.getCurrentFPS(),
        latency: data.metadata.latency || 0,
      });
    });

    // UI events
    this.uiController.on('reconnect', () => {
      this.connect();
    });

    this.uiController.on('qualityChange', (quality) => {
      this.streamClient.setQuality(quality as 'high' | 'medium' | 'low');
      this.logger.info(`Quality changed to: ${quality}`);
    });

    this.uiController.on('scaleChange', (scale) => {
      this.uiController.setScale(scale);
      this.logger.info(`Scale changed to: ${scale}x`);
    });

    this.uiController.on('fullscreen', () => {
      this.uiController.toggleFullscreen();
    });

    this.uiController.on('screenshot', () => {
      this.uiController.takeScreenshot();
      this.logger.info('Screenshot captured');
    });

    // Handle page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.streamClient.pause();
      } else {
        this.streamClient.resume();
      }
    });

    // Handle window resize
    window.addEventListener('resize', () => {
      this.uiController.handleResize();
    });

    // Graceful shutdown
    window.addEventListener('beforeunload', () => {
      this.streamClient.disconnect();
    });
  }

  private async connect(): Promise<void> {
    try {
      this.uiController.setConnectionStatus('connecting');
      this.logger.info('Attempting to connect to stream server...');
      
      await this.streamClient.connect();
    } catch (error) {
      this.logger.error('Failed to connect:', error);
      this.uiController.setConnectionStatus('error');
      this.uiController.showError('Failed to connect to server');
    }
  }
}

// Initialize the application when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new App());
} else {
  new App();
}
