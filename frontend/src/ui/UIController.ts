import { EventEmitter } from '../utils/EventEmitter';
import { Logger } from '../utils/Logger';
import { FrameMetadata } from '../stream/StreamClient';

interface UIEvents extends Record<string, unknown> {
  reconnect: void;
  qualityChange: string;
  scaleChange: number;
  fullscreen: void;
  screenshot: void;
}

export interface StreamStats {
  fps: number;
  latency: number;
}

export class UIController extends EventEmitter<UIEvents> {
  private logger: Logger;
  
  // DOM elements
  private canvas?: HTMLCanvasElement;
  private ctx?: CanvasRenderingContext2D;
  private connectionStatus?: HTMLElement;
  private fpsCounter?: HTMLElement;
  private latencyCounter?: HTMLElement;
  private loadingOverlay?: HTMLElement;
  private errorOverlay?: HTMLElement;
  private reconnectBtn?: HTMLButtonElement;
  private qualitySelect?: HTMLSelectElement;
  private scaleSlider?: HTMLInputElement;
  private scaleValue?: HTMLElement;
  private fullscreenBtn?: HTMLButtonElement;
  private screenshotBtn?: HTMLButtonElement;
  
  private currentScale = 0.25;
  private isFullscreen = false;

  constructor(logger: Logger) {
    super();
    this.logger = logger;
  }

  public async initialize(): Promise<void> {
    this.logger.info('Initializing UI controller...');
    
    await this.setupDOMElements();
    this.setupEventHandlers();
    this.setupCanvas();
    
    this.logger.info('UI controller initialized');
  }

  private async setupDOMElements(): Promise<void> {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      await new Promise(resolve => {
        document.addEventListener('DOMContentLoaded', resolve);
      });
    }

    // Get DOM elements
    this.canvas = document.getElementById('screen-canvas') as HTMLCanvasElement;
    this.connectionStatus = document.getElementById('connection-status');
    this.fpsCounter = document.getElementById('fps-counter');
    this.latencyCounter = document.getElementById('latency-counter');
    this.loadingOverlay = document.getElementById('loading-overlay');
    this.errorOverlay = document.getElementById('error-overlay');
    this.reconnectBtn = document.getElementById('reconnect-btn') as HTMLButtonElement;
    this.qualitySelect = document.getElementById('quality-select') as HTMLSelectElement;
    this.scaleSlider = document.getElementById('scale-slider') as HTMLInputElement;
    this.scaleValue = document.getElementById('scale-value');
    this.fullscreenBtn = document.getElementById('fullscreen-btn') as HTMLButtonElement;
    this.screenshotBtn = document.getElementById('screenshot-btn') as HTMLButtonElement;

    if (!this.canvas) {
      throw new Error('Canvas element not found');
    }

    this.ctx = this.canvas.getContext('2d');
    if (!this.ctx) {
      throw new Error('Failed to get 2D context');
    }
  }

  private setupEventHandlers(): void {
    // Reconnect button
    this.reconnectBtn?.addEventListener('click', () => {
      this.emit('reconnect', undefined);
      this.hideError();
    });

    // Quality selector
    this.qualitySelect?.addEventListener('change', (e) => {
      const target = e.target as HTMLSelectElement;
      this.emit('qualityChange', target.value);
    });

    // Scale slider
    this.scaleSlider?.addEventListener('input', (e) => {
      const target = e.target as HTMLInputElement;
      const scale = parseFloat(target.value);
      this.setScale(scale);
      this.emit('scaleChange', scale);
    });

    // Fullscreen button
    this.fullscreenBtn?.addEventListener('click', () => {
      this.emit('fullscreen', undefined);
    });

    // Screenshot button
    this.screenshotBtn?.addEventListener('click', () => {
      this.emit('screenshot', undefined);
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.code === 'F11') {
        e.preventDefault();
        this.emit('fullscreen', undefined);
      } else if (e.ctrlKey && e.code === 'KeyS') {
        e.preventDefault();
        this.emit('screenshot', undefined);
      }
    });

    // Handle fullscreen changes
    document.addEventListener('fullscreenchange', () => {
      this.isFullscreen = !!document.fullscreenElement;
      this.updateFullscreenButton();
    });
  }

  private setupCanvas(): void {
    if (!this.canvas) return;

    // Set initial canvas size
    this.resizeCanvas(1280, 720);
    
    // Handle window resize
    window.addEventListener('resize', () => {
      this.handleResize();
    });
  }

  private resizeCanvas(width: number, height: number): void {
    if (!this.canvas) return;

    this.canvas.width = width;
    this.canvas.height = height;
    
    // Apply scaling
    this.applyCanvasScale();
  }

  private applyCanvasScale(): void {
    if (!this.canvas) return;

    const scaledWidth = this.canvas.width * this.currentScale;
    const scaledHeight = this.canvas.height * this.currentScale;
    
    this.canvas.style.width = `${scaledWidth}px`;
    this.canvas.style.height = `${scaledHeight}px`;
  }

  public renderFrame(frameData: ImageData, metadata: FrameMetadata): void {
    if (!this.ctx || !this.canvas) return;

    try {
      // Resize canvas if frame dimensions changed
      if (this.canvas.width !== metadata.width || this.canvas.height !== metadata.height) {
        this.resizeCanvas(metadata.width, metadata.height);
      }

      // Render frame
      this.ctx.putImageData(frameData, 0, 0);
      
      // Hide loading overlay on first frame
      if (this.loadingOverlay && !this.loadingOverlay.classList.contains('hidden')) {
        this.loadingOverlay.classList.add('hidden');
      }

    } catch (error) {
      this.logger.error('Error rendering frame:', error);
    }
  }

  public setConnectionStatus(status: 'connected' | 'connecting' | 'disconnected' | 'error'): void {
    if (!this.connectionStatus) return;

    // Remove all status classes
    this.connectionStatus.classList.remove('connected', 'connecting', 'error');
    
    // Add current status class
    if (status !== 'disconnected') {
      this.connectionStatus.classList.add(status);
    }

    // Update text
    const statusText = {
      connected: 'CONNECTED',
      connecting: 'CONNECTING...',
      disconnected: 'DISCONNECTED',
      error: 'ERROR'
    };
    
    this.connectionStatus.textContent = statusText[status];

    // Show/hide loading overlay
    if (status === 'connecting') {
      this.showLoading();
    } else if (status === 'connected') {
      this.hideLoading();
      this.hideError();
    } else if (status === 'error') {
      this.hideLoading();
      this.showError('Connection failed');
    } else {
      this.showLoading();
    }
  }

  public updateStats(stats: StreamStats): void {
    if (this.fpsCounter) {
      this.fpsCounter.textContent = stats.fps.toString();
    }
    
    if (this.latencyCounter) {
      this.latencyCounter.textContent = `${stats.latency}ms`;
    }
  }

  public setScale(scale: number): void {
    this.currentScale = scale;
    this.applyCanvasScale();
    
    if (this.scaleValue) {
      this.scaleValue.textContent = `${Math.round(scale * 100)}%`;
    }
    
    if (this.scaleSlider) {
      this.scaleSlider.value = scale.toString();
    }
  }

  public toggleFullscreen(): void {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        this.logger.error('Error attempting to enable fullscreen:', err);
      });
    } else {
      document.exitFullscreen().catch(err => {
        this.logger.error('Error attempting to exit fullscreen:', err);
      });
    }
  }

  public takeScreenshot(): void {
    if (!this.canvas) return;

    try {
      const link = document.createElement('a');
      link.download = `screenshot-${Date.now()}.png`;
      link.href = this.canvas.toDataURL();
      link.click();
      
      this.logger.info('Screenshot saved');
    } catch (error) {
      this.logger.error('Failed to take screenshot:', error);
    }
  }

  public handleResize(): void {
    // Reapply canvas scaling on window resize
    this.applyCanvasScale();
  }

  private showLoading(): void {
    if (this.loadingOverlay) {
      this.loadingOverlay.classList.remove('hidden');
    }
  }

  private hideLoading(): void {
    if (this.loadingOverlay) {
      this.loadingOverlay.classList.add('hidden');
    }
  }

  public showError(message: string): void {
    if (this.errorOverlay) {
      this.errorOverlay.classList.remove('hidden');
      const errorText = this.errorOverlay.querySelector('.error-text');
      if (errorText) {
        errorText.textContent = message.toUpperCase();
      }
    }
  }

  private hideError(): void {
    if (this.errorOverlay) {
      this.errorOverlay.classList.add('hidden');
    }
  }

  private updateFullscreenButton(): void {
    if (this.fullscreenBtn) {
      this.fullscreenBtn.textContent = this.isFullscreen ? 'EXIT FULL' : 'FULLSCREEN';
    }
  }

  public getCanvas(): HTMLCanvasElement | undefined {
    return this.canvas;
  }

  public getCurrentScale(): number {
    return this.currentScale;
  }

  public isInFullscreen(): boolean {
    return this.isFullscreen;
  }
}
