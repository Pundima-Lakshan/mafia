interface SendArg {
  description?: RTCSessionDescription | null;
  candidate?: RTCIceCandidate | null;
}

type OnMessage = (arg: {
  data: { description: RTCSessionDescription; candidate: RTCIceCandidate };
}) => Promise<void>;

export class SignalingChannel {
  private socket: WebSocket | null = null;
  private url: string;
  private isConnected: boolean = false;
  onmessage: OnMessage | null = null;

  constructor(url: string) {
    this.url = url;
  }

  connect(): void {
    this.socket = new WebSocket(this.url);

    this.socket.onopen = () => {
      this.isConnected = true;
      console.log("WebSocket connected");
    };

    this.socket.onmessage = (event: MessageEvent) => {
      this.handleMessage(event.data);
    };

    this.socket.onerror = (error: Event) => {
      console.error("WebSocket error:", error);
    };

    this.socket.onclose = () => {
      this.isConnected = false;
      console.log("WebSocket disconnected");
    };
  }

  send(arg: SendArg) {
    if (this.socket && this.isConnected) {
      const jsonString = JSON.stringify(arg);
      this.socket.send(jsonString);
    } else {
      console.warn("WebSocket is not connected. Message not sent.");
    }
  }

  private handleMessage(data: string): void {
    try {
      const parsed = JSON.parse(data);
      this.onmessage?.(parsed);
    } catch (e) {
      console.error("Failed to parse incoming message as JSON:", data, e);
    }
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.close();
    }
  }
}
