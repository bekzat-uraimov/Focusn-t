// Shared WebSocket message types — owned by this file.
// Both frontend-agent and webcam-agent import from here.

export type FocusStatus = "focused" | "distracted" | "away";
export type SessionEndStatus = "completed" | "failed";
export type TreeType = "common" | "uncommon" | "epic" | "arcane" | "diamond";

// ─── Client → Server ────────────────────────────────────────────────────────

export interface FocusUpdateMsg {
  type: "focus_update";
  status: FocusStatus;
}

export interface SessionEndMsg {
  type: "session_end";
  status: SessionEndStatus;
  elapsed_secs: number; // send via REST PATCH, not WS — kept here for reference
}

export type ClientMessage = FocusUpdateMsg | SessionEndMsg;

// ─── Server → Client ────────────────────────────────────────────────────────

export interface RoomStateMember {
  user_id: string;
  name: string;
  status: FocusStatus;
  tree_alive: boolean;
}

export interface RoomStateMsg {
  type: "room_state";
  members: RoomStateMember[];
}

export interface MemberUpdateMsg {
  type: "member_update";
  user_id: string;
  name: string;
  status: FocusStatus;
  tree_alive: boolean;
}

export interface MemberJoinedMsg {
  type: "member_joined";
  user_id: string;
  name: string;
}

export interface MemberLeftMsg {
  type: "member_left";
  user_id: string;
}

export interface SessionEndBroadcast {
  type: "session_end";
  user_id: string;
  status: SessionEndStatus;
  tree_alive: boolean;
  tree_type: TreeType;
  in_forest: boolean;
}

export type ServerMessage =
  | RoomStateMsg
  | MemberUpdateMsg
  | MemberJoinedMsg
  | MemberLeftMsg
  | SessionEndBroadcast;
