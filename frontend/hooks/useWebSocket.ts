"use client";
import { useEffect, useRef, useCallback } from "react";
import { wsUrl } from "@/lib/api";
import type { ServerMessage, FocusStatus } from "@/types/ws";

export function useWebSocket(roomId: string, onMessage: (msg: ServerMessage) => void) {
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const ws = new WebSocket(wsUrl(`/ws/rooms/${roomId}`));
    wsRef.current = ws;

    ws.onmessage = (e) => {
      try { onMessage(JSON.parse(e.data)); } catch { /* ignore malformed */ }
    };

    ws.onerror = () => console.error("WS error");

    return () => {
      ws.close();
      wsRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  const sendFocusUpdate = useCallback((status: FocusStatus) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "focus_update", status }));
    }
  }, []);

  return { sendFocusUpdate };
}
