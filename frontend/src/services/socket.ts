type ListenerCallback = (data: any) => void;

class RealtimeClient {
  private ws: WebSocket | null = null;
  private listeners = new Map<string, Set<ListenerCallback>>();
  private reconnectTimer: any = null;
  private currentEventId: string | null = null;
  private currentClubId: string | null = null;
  private isConnected = false;

  connect() {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/ws`;

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.isConnected = true;
        console.log('[WebSocket] Connected to ClubOps Realtime Hub');
        if (this.currentEventId) {
          this.subscribeEvent(this.currentEventId, this.currentClubId || undefined);
        }
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.emit(data.type, data.payload);
        } catch {
          // ignore parsing error
        }
      };

      this.ws.onclose = () => {
        this.isConnected = false;
        this.scheduleReconnect();
      };

      this.ws.onerror = () => {
        this.ws?.close();
      };
    } catch {
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, 3000);
  }

  subscribeEvent(eventId: string, clubId?: string) {
    this.currentEventId = eventId;
    if (clubId) this.currentClubId = clubId;

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'SUBSCRIBE_EVENT',
        eventId,
        clubId,
      }));
    }
  }

  on(eventType: string, callback: ListenerCallback) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(callback);

    return () => {
      this.listeners.get(eventType)?.delete(callback);
    };
  }

  private emit(eventType: string, payload: any) {
    const callbacks = this.listeners.get(eventType);
    if (callbacks) {
      callbacks.forEach(cb => cb(payload));
    }
  }
}

export const realtimeClient = new RealtimeClient();
