import { useEffect, useRef, useState } from 'react';

const WS_URL = 'ws://localhost:8000/api/ws';

/**
 * Connects to the backend WebSocket and calls onMessage with parsed events.
 * Automatically reconnects on disconnect.
 *
 * @param {(event: { type: string, data: object }) => void} onMessage
 * @returns {{ connected: boolean }}
 */
export function useWebSocket(onMessage) {
  const [connected, setConnected] = useState(false);
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  useEffect(() => {
    let ws;
    let reconnectTimer;
    let unmounted = false;

    const connect = () => {
      if (unmounted) return;
      ws = new WebSocket(WS_URL);

      ws.onopen = () => {
        if (!unmounted) setConnected(true);
      };

      ws.onclose = () => {
        if (!unmounted) {
          setConnected(false);
          reconnectTimer = setTimeout(connect, 3000);
        }
      };

      ws.onerror = () => ws.close();

      ws.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          onMessageRef.current(parsed);
        } catch {
          // ignore malformed frames
        }
      };
    };

    connect();

    return () => {
      unmounted = true;
      clearTimeout(reconnectTimer);
      ws?.close();
    };
  }, []);

  return { connected };
}
