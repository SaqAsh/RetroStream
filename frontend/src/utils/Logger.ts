export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARNING = 2,
  ERROR = 3,
}

export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  message: string;
  data?: unknown;
}

export class Logger {
  private logs: LogEntry[] = [];
  private maxLogs = 100;
  private logLevel = LogLevel.INFO;
  private logContainer?: HTMLElement;

  constructor() {
    this.setupLogContainer();
  }

  private setupLogContainer(): void {
    // Wait for DOM to be ready
    const setup = () => {
      this.logContainer = document.getElementById('log-container');
    };

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', setup);
    } else {
      setup();
    }
  }

  private log(level: LogLevel, message: string, data?: unknown): void {
    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      message,
      data,
    };

    this.logs.push(entry);
    
    // Maintain max log size
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Console output
    if (level >= this.logLevel) {
      const timestamp = entry.timestamp.toLocaleTimeString();
      const levelStr = LogLevel[level];
      const consoleMessage = `[${timestamp}] ${levelStr}: ${message}`;
      
      switch (level) {
        case LogLevel.DEBUG:
          console.debug(consoleMessage, data);
          break;
        case LogLevel.INFO:
          console.info(consoleMessage, data);
          break;
        case LogLevel.WARNING:
          console.warn(consoleMessage, data);
          break;
        case LogLevel.ERROR:
          console.error(consoleMessage, data);
          break;
      }
    }

    // UI output
    this.updateLogDisplay(entry);
  }

  private updateLogDisplay(entry: LogEntry): void {
    if (!this.logContainer) return;

    const logElement = document.createElement('div');
    logElement.className = `log-entry ${LogLevel[entry.level].toLowerCase()}`;
    
    const timestamp = entry.timestamp.toLocaleTimeString();
    const prefix = this.getLogPrefix(entry.level);
    logElement.textContent = `${timestamp} ${prefix} ${entry.message}`;

    this.logContainer.appendChild(logElement);

    // Remove old entries if too many
    while (this.logContainer.children.length > 50) {
      this.logContainer.removeChild(this.logContainer.firstChild!);
    }

    // Auto-scroll to bottom
    this.logContainer.scrollTop = this.logContainer.scrollHeight;
  }

  private getLogPrefix(level: LogLevel): string {
    switch (level) {
      case LogLevel.DEBUG: return '[DBG]';
      case LogLevel.INFO: return '[INF]';
      case LogLevel.WARNING: return '[WRN]';
      case LogLevel.ERROR: return '[ERR]';
      default: return '[LOG]';
    }
  }

  public debug(message: string, data?: unknown): void {
    this.log(LogLevel.DEBUG, message, data);
  }

  public info(message: string, data?: unknown): void {
    this.log(LogLevel.INFO, message, data);
  }

  public warning(message: string, data?: unknown): void {
    this.log(LogLevel.WARNING, message, data);
  }

  public error(message: string, data?: unknown): void {
    this.log(LogLevel.ERROR, message, data);
  }

  public setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  public getLogs(): LogEntry[] {
    return [...this.logs];
  }

  public clearLogs(): void {
    this.logs = [];
    if (this.logContainer) {
      this.logContainer.innerHTML = '<div class="log-entry">> System initialized</div>';
    }
  }
}
