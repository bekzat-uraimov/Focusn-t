"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { WS_BASE } from "./api";

export interface RoomMember {
  user_id: string;
  username: string;
  status: string;
  score: number;
}

export function useRoomSocket(
  roomId: string | null,
  onMemberUpdate?: (members: RoomMember[]) => void
): {
  members: RoomMember[];
  connected: boolean;
  sendFocusUpdate: (status: string, score: number) => void;
} {
  const [members, setMembers] = useState<RoomMember[]>([]);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const membersRef = useRef<Map<string, RoomMember>>(new Map());

  const sendFocusUpdate = useCallback((status: string, score: number) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "focus_update", status, score }));
    }
  }, []);

  useEffect(() => {
    if (!roomId) return;

    const token = localStorage.getItem("focusnt_access_token");
    if (!token) return;

    const ws = new WebSocket(`${WS_BASE}/rooms/ws/${roomId}`);
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: "join_room", token }));
      setConnected(true);
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      const map = membersRef.current;

      if (data.type === "member_joined") {
        map.set(data.user_id, {
          user_id: data.user_id,
          username: data.username,
          status: "idle",
          score: 100,
        });
      } else if (data.type === "member_update") {
        map.set(data.user_id, {
          user_id: data.user_id,
          username: data.username,
          status: data.status,
          score: data.score,
        });
      } else if (data.type === "member_left") {
        map.delete(data.user_id);
      }

      const updated = Array.from(map.values());
      setMembers(updated);
      onMemberUpdate?.(updated);
    };

    ws.onclose = () => {
      setConnected(false);
    };

    return () => {
      ws.close();
      wsRef.current = null;
      membersRef.current = new Map();
      setMembers([]);
      setConnected(false);
    };
  }, [roomId]); // eslint-disable-line react-hooks/exhaustive-deps

  return { members, connected, sendFocusUpdate };
}
