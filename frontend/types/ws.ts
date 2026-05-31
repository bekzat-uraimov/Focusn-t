export type FocusStatus = "focused" | "distracted" | "away";
export type SessionEndStatus = "completed" | "failed" | "abandoned";
export type TreeType = "common" | "uncommon" | "epic" | "arcane" | "diamond";
export type TreeStage = "small" | "medium" | "large";

// Client → Server
export interface FocusUpdateMsg {
  type: "focus_update";
  status: FocusStatus;
}

// Server → Client
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

export interface SessionStartedMsg {
  type: "session_started";
  user_id: string;
  duration_secs: number;
  session_id: string;
}

export interface SessionDeadMsg {
  type: "session_dead";
  user_id: string;
}

export type ServerMessage =
  | RoomStateMsg
  | MemberUpdateMsg
  | MemberJoinedMsg
  | MemberLeftMsg
  | SessionEndBroadcast
  | SessionStartedMsg
  | SessionDeadMsg;
