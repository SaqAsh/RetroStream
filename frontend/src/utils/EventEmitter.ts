export type EventHandler<T = unknown> = (data: T) => void;

export class EventEmitter<TEvents extends Record<string, unknown> = Record<string, unknown>> {
  private events: Map<keyof TEvents, Set<EventHandler<TEvents[keyof TEvents]>>> = new Map();

  public on<K extends keyof TEvents>(event: K, handler: EventHandler<TEvents[K]>): void {
    if (!this.events.has(event)) {
      this.events.set(event, new Set());
    }
    this.events.get(event)!.add(handler as EventHandler<TEvents[keyof TEvents]>);
  }

  public off<K extends keyof TEvents>(event: K, handler: EventHandler<TEvents[K]>): void {
    const handlers = this.events.get(event);
    if (handlers) {
      handlers.delete(handler as EventHandler<TEvents[keyof TEvents]>);
      if (handlers.size === 0) {
        this.events.delete(event);
      }
    }
  }

  public emit<K extends keyof TEvents>(event: K, data: TEvents[K]): void {
    const handlers = this.events.get(event);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`Error in event handler for '${String(event)}':`, error);
        }
      });
    }
  }

  public once<K extends keyof TEvents>(event: K, handler: EventHandler<TEvents[K]>): void {
    const onceHandler: EventHandler<TEvents[K]> = (data) => {
      handler(data);
      this.off(event, onceHandler);
    };
    this.on(event, onceHandler);
  }

  public removeAllListeners<K extends keyof TEvents>(event?: K): void {
    if (event) {
      this.events.delete(event);
    } else {
      this.events.clear();
    }
  }

  public listenerCount<K extends keyof TEvents>(event: K): number {
    return this.events.get(event)?.size || 0;
  }

  public hasListeners<K extends keyof TEvents>(event: K): boolean {
    return this.listenerCount(event) > 0;
  }
}
