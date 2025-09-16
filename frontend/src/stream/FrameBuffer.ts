import { FrameMetadata } from './StreamClient';

export interface BufferedFrame {
  imageData: ImageData;
  metadata: FrameMetadata;
  timestamp: number;
}

export class FrameBuffer {
  private buffer: BufferedFrame[] = [];
  private maxSize: number;
  private currentIndex = 0;

  constructor(maxSize: number) {
    this.maxSize = maxSize;
  }

  public addFrame(frame: BufferedFrame): void {
    this.buffer.push(frame);
    
    // Remove old frames if buffer is full
    if (this.buffer.length > this.maxSize) {
      this.buffer.shift();
    }
    
    // Update current index to point to the latest frame
    this.currentIndex = this.buffer.length - 1;
  }

  public getLatestFrame(): BufferedFrame | null {
    if (this.buffer.length === 0) {
      return null;
    }
    
    return this.buffer[this.buffer.length - 1];
  }

  public getFrame(index: number): BufferedFrame | null {
    if (index < 0 || index >= this.buffer.length) {
      return null;
    }
    
    return this.buffer[index];
  }

  public getCurrentFrame(): BufferedFrame | null {
    return this.getFrame(this.currentIndex);
  }

  public nextFrame(): BufferedFrame | null {
    if (this.currentIndex < this.buffer.length - 1) {
      this.currentIndex++;
    }
    return this.getCurrentFrame();
  }

  public previousFrame(): BufferedFrame | null {
    if (this.currentIndex > 0) {
      this.currentIndex--;
    }
    return this.getCurrentFrame();
  }

  public seekToLatest(): BufferedFrame | null {
    this.currentIndex = Math.max(0, this.buffer.length - 1);
    return this.getCurrentFrame();
  }

  public getBufferSize(): number {
    return this.buffer.length;
  }

  public getMaxSize(): number {
    return this.maxSize;
  }

  public clear(): void {
    this.buffer = [];
    this.currentIndex = 0;
  }

  public getBufferHealth(): number {
    // Returns a value between 0 and 1 indicating buffer health
    // 1 = buffer is full, 0 = buffer is empty
    return this.buffer.length / this.maxSize;
  }

  public getOldestFrameAge(): number {
    if (this.buffer.length === 0) {
      return 0;
    }
    
    const oldestFrame = this.buffer[0];
    return Date.now() - oldestFrame.timestamp;
  }

  public getLatency(): number {
    const latestFrame = this.getLatestFrame();
    if (!latestFrame) {
      return 0;
    }
    
    return latestFrame.metadata.latency || 0;
  }

  public dropOldFrames(maxAge: number): number {
    const now = Date.now();
    let dropped = 0;
    
    while (this.buffer.length > 0 && (now - this.buffer[0].timestamp) > maxAge) {
      this.buffer.shift();
      dropped++;
    }
    
    // Adjust current index
    this.currentIndex = Math.max(0, this.currentIndex - dropped);
    
    return dropped;
  }

  public getFrameStats(): {
    bufferSize: number;
    maxSize: number;
    currentIndex: number;
    oldestFrameAge: number;
    latency: number;
    bufferHealth: number;
  } {
    return {
      bufferSize: this.getBufferSize(),
      maxSize: this.getMaxSize(),
      currentIndex: this.currentIndex,
      oldestFrameAge: this.getOldestFrameAge(),
      latency: this.getLatency(),
      bufferHealth: this.getBufferHealth(),
    };
  }
}
