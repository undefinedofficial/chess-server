type EventMap = Record<string | number, any>;

type EventKey<T extends EventMap> = (string | number) & keyof T;
type EventReceiver<T> = (params: T) => boolean | void;

type OffHandle = () => void;

interface Emitter<T extends EventMap> {
  on<K extends EventKey<T>>(eventName: K, fn: EventReceiver<T[K]>): OffHandle;
  off<K extends EventKey<T>>(eventName: K, fn: EventReceiver<T[K]>): void;
  emit<K extends EventKey<T>>(eventName: K, params: T[K]): void;
}

export { EventReceiver };

/**
 *
 * @returns emitter object
 */
function EventEmitter<T extends EventMap>(): Emitter<T> {
  const listeners: {
    [K in keyof EventMap]?: Array<EventReceiver<EventMap[K]>>;
  } = {};

  return {
    on(key, fn): OffHandle {
      listeners[key] = listeners[key]?.concat(fn);
      return () => {
        listeners[key] = (listeners[key] || []).filter((f) => f !== fn);
      };
    },
    off(key, fn) {
      listeners[key] = (listeners[key] || []).filter((f) => f !== fn);
    },
    emit(key, data) {
      const reseivers = listeners[key];
      if (!reseivers) return;

      for (const reseiver of reseivers) if (reseiver(data)) return;
    },
  };
}
export default EventEmitter;
