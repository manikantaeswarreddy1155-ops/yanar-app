type MessageCallback = (data: { conversationId: string; message: unknown }) => void;
type SignalCallback = (data: { fromUserId: string; signal: unknown }) => void;

const getWsUrl = () => {
  if (import.meta.env.VITE_WS_URL) {
    return import.meta.env.VITE_WS_URL;
  }
  const apiUrl = import.meta.env.VITE_API_URL;
  if (apiUrl) {
    return apiUrl.replace(/^http:\/\//, 'ws://').replace(/^https:\/\//, 'wss://').replace(/\/+$/, '');
  }
  return 'ws://127.0.0.1:5000';
};

class SocketService {
  private ws: WebSocket | null = null;
  private currentUserId: string | null = null;
  private messageListeners: Set<MessageCallback> = new Set();
  private signalListeners: Set<SignalCallback> = new Set();
  private isConnecting = false;

  connect(userId: string) {
    this.currentUserId = userId;
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      this.send({ type: 'register', userId });
      return;
    }

    if (this.isConnecting) return;
    this.isConnecting = true;

    try {
      this.ws = new WebSocket(getWsUrl());

      this.ws.onopen = () => {
        this.isConnecting = false;
        console.log('Connected to YANAR Real-Time WebSocket Server');
        this.send({ type: 'register', userId });
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'chat_message') {
            this.messageListeners.forEach((cb) => cb(data));
          } else if (data.type === 'webrtc_signal') {
            this.signalListeners.forEach((cb) => cb(data));
          }
        } catch (e) {
          console.warn('Socket message parse error', e);
        }
      };

      this.ws.onclose = () => {
        this.isConnecting = false;
        // Attempt reconnect after 3 seconds
        setTimeout(() => {
          if (this.currentUserId) this.connect(this.currentUserId);
        }, 3000);
      };

      this.ws.onerror = () => {
        this.isConnecting = false;
      };
    } catch {
      this.isConnecting = false;
    }
  }

  send(data: unknown) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  sendChatMessage(recipientId: string, message: unknown, conversationId: string) {
    this.send({
      type: 'chat_message',
      recipientId,
      conversationId,
      message,
    });
  }

  sendWebRTCSignal(targetUserId: string, signal: unknown) {
    this.send({
      type: 'webrtc_signal',
      targetUserId,
      signal,
    });
  }

  onChatMessage(cb: MessageCallback) {
    this.messageListeners.add(cb);
    return () => this.messageListeners.delete(cb);
  }

  onWebRTCSignal(cb: SignalCallback) {
    this.signalListeners.add(cb);
    return () => this.signalListeners.delete(cb);
  }
}

export const socketService = new SocketService();
