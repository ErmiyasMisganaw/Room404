import { useEffect, useRef, useState } from 'react';
import { API_BASE_URL } from '../services/api';

function toWebSocketBaseUrl(value) {
  return `${value || ''}`
    .trim()
    .replace(/^http:\/\//i, 'ws://')
    .replace(/^https:\/\//i, 'wss://')
    .replace(/\/+$/, '');
}

const configuredWsUrl = `${import.meta.env.VITE_WS_URL || ''}`.trim();
const WS_URL = configuredWsUrl || `${toWebSocketBaseUrl(API_BASE_URL)}/api/ws`;

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
    let reconnectDelayMs = 1000;

    const connect = () => {
      if (unmounted) return;
      ws = new WebSocket(WS_URL);

      ws.onopen = () => {
        reconnectDelayMs = 1000;
        if (!unmounted) setConnected(true);
      };

      ws.onclose = () => {
        if (!unmounted) {
          setConnected(false);
          reconnectTimer = setTimeout(connect, reconnectDelayMs);
          reconnectDelayMs = Math.min(reconnectDelayMs * 2, 15000);
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
