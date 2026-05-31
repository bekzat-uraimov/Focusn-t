"use client";

import { useEffect, useState, useRef } from "react";
import { api, RoomResponse, RoomMemberResponse } from "@/lib/api";
import { useRoomSocket } from "@/lib/useRoomSocket";
import type { RoomMember } from "@/lib/useRoomSocket";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
}

type View = "list" | "create" | "room";

const STATUS_COLOR: Record<string, string> = {
  focused: "#34d399", questionable: "#fbbf24", distracted: "#f87171",
  away: "#94a3b8", recovering: "#34d399", idle: "#64748b",
};

function formatScheduled(iso: string | null) {
  if (!iso) return "Anytime";
  return new Date(iso).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function RoomsModal({ isOpen, onClose, isDark }: Props) {
  const [view, setView]           = useState<View>("list");
  const [rooms, setRooms]         = useState<RoomResponse[]>([]);
  const [loading, setLoading]     = useState(false);
  const [activeRoom, setActiveRoom] = useState<RoomResponse | null>(null);
  const [members, setMembers]     = useState<RoomMember[]>([]);

  // Create form state
  const [name, setName]             = useState("");
  const [isPrivate, setIsPrivate]   = useState(false);
  const [scheduledAt, setScheduledAt] = useState("");
  const [creating, setCreating]     = useState(false);
  const [inviteInput, setInviteInput] = useState("");
  const [invitePromptId, setInvitePromptId] = useState<string | null>(null);
  const [scheduleError, setScheduleError] = useState("");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [minTime, setMinTime] = useState("");

  // Room WebSocket
  const { connected, sendFocusUpdate } = useRoomSocket(
    activeRoom?.id ?? null,
    (updated) => setMembers(updated)
  );

  // Live clock for the create form — display only, updates every second.
  useEffect(() => {
    if (!isOpen || view !== "create") return;
    const tick = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(tick);
  }, [isOpen, view]);

  // Compute earliest selectable time (now + 10 min) once when the create view opens.
  useEffect(() => {
    if (!isOpen || view !== "create") return;
    const p = (n: number) => String(n).padStart(2, "0");
    const d = new Date(Date.now() + 10 * 60 * 1000);
    setMinTime(`${p(d.getHours())}:${p(d.getMinutes())}`);
  }, [isOpen, view]);

  const t         = (dark: string, light: string) => isDark ? dark : light;
  const overlay   = t("rgba(3,3,10,0.78)", "rgba(10,30,80,0.55)");
  const cardBg    = t("rgba(10,10,22,0.85)", "rgba(255,255,255,0.72)");
  const border    = `1px solid ${t("rgba(255,255,255,0.08)","rgba(0,0,0,0.09)")}`;
  const textStrong = t("rgba(255,255,255,0.9)", "rgba(0,0,0,0.82)");
  const textMid   = t("rgba(255,255,255,0.6)", "rgba(0,0,0,0.58)");
  const textFaint = t("rgba(255,255,255,0.35)", "rgba(0,0,0,0.35)");
  const itemBg    = t("rgba(255,255,255,0.04)", "rgba(0,0,0,0.04)");
  const inputBg   = t("rgba(255,255,255,0.05)", "rgba(0,0,0,0.05)");
  const inputBorder = `1px solid ${t("rgba(255,255,255,0.1)","rgba(0,0,0,0.1)")}`;

  useEffect(() => {
    if (!isOpen) return;
    loadRooms();
  }, [isOpen]);

  function loadRooms() {
    setLoading(true);
    api.rooms.list()
      .then(setRooms)
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  async function handleJoin(room: RoomResponse) {
    if (room.is_private) {
      setInvitePromptId(room.id);
      return;
    }
    await doJoin(room, undefined);
  }

  async function doJoin(room: RoomResponse, code?: string) {
    try {
      await api.rooms.join(room.id, code);
      const m = await api.rooms.members(room.id);
      setMembers(m.map((mr: RoomMemberResponse) => ({
        user_id: mr.user_id,
        username: mr.username,
        status: mr.focus_status,
        score: mr.attention_score,
      })));
      setActiveRoom(room);
      setInvitePromptId(null);
      setInviteInput("");
      setView("room");
    } catch (e: unknown) {
      alert((e as Error).message ?? "Could not join room");
    }
  }

  async function handleCreate() {
    if (!name.trim()) return;
    let scheduledIso: string | undefined;
    if (scheduledAt) {
      const [h, m] = scheduledAt.split(":").map(Number);
      const scheduled = new Date();
      scheduled.setHours(h, m, 0, 0);
      const diff = scheduled.getTime() - Date.now();
      if (diff < 10 * 60 * 1000) {
        setScheduleError("Must be at least 10 minutes from now");
        return;
      }
      scheduledIso = scheduled.toISOString();
    }
    setScheduleError("");
    setCreating(true);
    try {
      const room = await api.rooms.create(name.trim(), isPrivate, scheduledIso);
      setRooms((r) => [room, ...r]);
      await doJoin(room, room.invite_code ?? undefined);
      setName(""); setIsPrivate(false); setScheduledAt("");
    } catch (e: unknown) {
      alert((e as Error).message ?? "Could not create room");
    } finally {
      setCreating(false);
    }
  }

  function handleLeave() {
    setActiveRoom(null);
    setMembers([]);
    setView("list");
    loadRooms();
  }

  if (!isOpen) return null;

  const inputStyle: React.CSSProperties = {
    background: inputBg, border: inputBorder, borderRadius: 12,
    padding: "10px 14px", color: textStrong, fontSize: 14,
    outline: "none", width: "100%", boxSizing: "border-box",
  };

  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{
        position: "fixed", inset: 0, zIndex: 50,
        background: overlay, backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: '-apple-system, BlinkMacSystemFont, "Inter", sans-serif',
        WebkitFontSmoothing: "antialiased",
      }}
    >
      <div style={{
        width: "min(580px, 96vw)", maxHeight: "84vh",
        background: cardBg, backdropFilter: "blur(40px)", WebkitBackdropFilter: "blur(40px)",
        border, borderRadius: 24,
        boxShadow: t("0 32px 80px rgba(0,0,0,0.8)","0 24px 60px rgba(30,80,180,0.2)"),
        display: "flex", flexDirection: "column", overflow: "hidden",
        animation: "float-in 0.35s cubic-bezier(0.16,1,0.3,1) both",
      }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "24px 28px 20px", borderBottom: border }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {view !== "list" && (
              <button onClick={() => { if (view === "room") handleLeave(); else setView("list"); }} style={{
                background: itemBg, border, borderRadius: 8, padding: "4px 12px",
                color: textMid, fontSize: 13, cursor: "pointer",
              }}>← Back</button>
            )}
            <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.03em", color: textStrong }}>
              {view === "list" ? "Focus Rooms" : view === "create" ? "New Room" : activeRoom?.name ?? "Room"}
            </div>
            {view === "room" && (
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: connected ? "#34d399" : "#94a3b8", boxShadow: connected ? "0 0 8px #34d399" : "none" }} />
            )}
          </div>
          <button onClick={onClose} style={{
            width: 32, height: 32, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
            background: itemBg, border, color: textMid, fontSize: 18, cursor: "pointer",
          }}>×</button>
        </div>

        <div style={{ overflowY: "auto", padding: "20px 28px 28px", flex: 1 }}>

          {/* ── LIST VIEW ── */}
          {view === "list" && (
            <>
              {loading ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {[0,1,2].map((i) => (
                    <div key={i} style={{ height: 72, borderRadius: 14, background: itemBg, border, animation: "pulse-dot 1.5s infinite" }} />
                  ))}
                </div>
              ) : rooms.length === 0 ? (
                <div style={{ textAlign: "center", padding: "32px 0", color: textFaint, fontSize: 14 }}>
                  No public rooms yet. Create the first one!
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
                  {rooms.map((room) => (
                    <div key={room.id} style={{ background: itemBg, border, borderRadius: 14, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: textStrong }}>{room.name}</div>
                        <div style={{ fontSize: 12, color: textFaint, marginTop: 2 }}>
                          by {room.owner.username} · {room.member_count} {room.member_count === 1 ? "member" : "members"} · {formatScheduled(room.scheduled_at)}
                        </div>
                      </div>
                      {room.is_private && (
                        <span style={{ fontSize: 11, color: "#fbbf24", background: "rgba(251,191,36,0.12)", border: "1px solid rgba(251,191,36,0.25)", borderRadius: 6, padding: "2px 8px" }}>Private</span>
                      )}
                      {invitePromptId === room.id ? (
                        <div style={{ display: "flex", gap: 6 }}>
                          <input
                            placeholder="Invite code"
                            value={inviteInput}
                            onChange={(e) => setInviteInput(e.target.value)}
                            style={{ ...inputStyle, width: 120, padding: "6px 10px", fontSize: 12 }}
                          />
                          <button onClick={() => doJoin(room, inviteInput)} style={{
                            background: "rgba(99,102,241,0.18)", border: "1px solid rgba(99,102,241,0.35)",
                            borderRadius: 8, padding: "6px 12px", color: textStrong, fontSize: 12, cursor: "pointer",
                          }}>Join</button>
                        </div>
                      ) : (
                        <button onClick={() => handleJoin(room)} style={{
                          background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.3)",
                          borderRadius: 10, padding: "7px 16px", color: "#818cf8",
                          fontSize: 13, fontWeight: 600, cursor: "pointer",
                        }}>Join</button>
                      )}
                    </div>
                  ))}
                </div>
              )}
              <button onClick={() => setView("create")} className="focus-btn" style={{
                width: "100%", padding: "12px", borderRadius: 14,
                fontSize: 14, fontWeight: 600, cursor: "pointer",
              }}>
                + Create Room
              </button>
            </>
          )}

          {/* ── CREATE VIEW ── */}
          {view === "create" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 500, color: textMid, letterSpacing: "0.04em" }}>ROOM NAME</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Morning focus crew"
                  style={inputStyle}
                  onFocus={(e) => (e.target.style.borderColor = "rgba(99,102,241,0.6)")}
                  onBlur={(e) => (e.target.style.borderColor = t("rgba(255,255,255,0.1)","rgba(0,0,0,0.1)"))}
                />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <label style={{ fontSize: 12, fontWeight: 500, color: textMid, letterSpacing: "0.04em" }}>START TIME TODAY (optional)</label>
                  <span style={{ fontSize: 12, color: textFaint, fontFamily: "'SF Mono','JetBrains Mono',monospace" }}>
                    {currentTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                  </span>
                </div>
                <input
                  type="time"
                  value={scheduledAt}
                  min={minTime}
                  max="23:59"
                  onChange={(e) => { setScheduledAt(e.target.value); setScheduleError(""); }}
                  style={{ ...inputStyle, colorScheme: isDark ? "dark" : "light" }}
                />
                {scheduleError && (
                  <span style={{ fontSize: 12, color: "#f87171" }}>{scheduleError}</span>
                )}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, background: itemBg, border, borderRadius: 12, padding: "12px 16px" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: textStrong }}>Private room</div>
                  <div style={{ fontSize: 12, color: textFaint, marginTop: 2 }}>Only joinable with invite code</div>
                </div>
                <button
                  onClick={() => setIsPrivate((p) => !p)}
                  style={{
                    width: 44, height: 24, borderRadius: 12, cursor: "pointer",
                    background: isPrivate ? "rgba(99,102,241,0.5)" : t("rgba(255,255,255,0.1)","rgba(0,0,0,0.1)"),
                    border: `1px solid ${isPrivate ? "rgba(99,102,241,0.4)" : t("rgba(255,255,255,0.15)","rgba(0,0,0,0.15)")}`,
                    position: "relative", transition: "background 0.2s",
                  }}
                >
                  <div style={{
                    position: "absolute", top: 2, left: isPrivate ? 22 : 2,
                    width: 18, height: 18, borderRadius: "50%",
                    background: isPrivate ? "#818cf8" : t("rgba(255,255,255,0.5)","rgba(0,0,0,0.4)"),
                    transition: "left 0.2s, background 0.2s",
                  }} />
                </button>
              </div>
              <button
                onClick={handleCreate}
                disabled={creating || !name.trim()}
                className="focus-btn"
                style={{ padding: "12px", borderRadius: 14, fontSize: 14, fontWeight: 600, cursor: creating ? "not-allowed" : "pointer", opacity: creating || !name.trim() ? 0.6 : 1 }}
              >
                {creating ? "Creating…" : "Create Room"}
              </button>
            </div>
          )}

          {/* ── ROOM VIEW ── */}
          {view === "room" && activeRoom && (
            <div>
              {activeRoom.invite_code && (
                <div style={{ background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.2)", borderRadius: 12, padding: "12px 16px", marginBottom: 16 }}>
                  <div style={{ fontSize: 11, color: "#fbbf24", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 4 }}>Invite code</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: "#fbbf24", fontFamily: "monospace", letterSpacing: "0.1em" }}>
                    {activeRoom.invite_code}
                  </div>
                </div>
              )}
              <div style={{ fontSize: 11, color: textFaint, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 12 }}>
                Members ({members.length})
              </div>
              {members.length === 0 ? (
                <div style={{ textAlign: "center", padding: "24px 0", color: textFaint, fontSize: 13 }}>
                  Waiting for members to connect…
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {members.map((m) => {
                    const dot = STATUS_COLOR[m.status] ?? "#64748b";
                    return (
                      <div key={m.user_id} style={{ background: itemBg, border, borderRadius: 14, padding: "14px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                          <div style={{ width: 8, height: 8, borderRadius: "50%", background: dot, boxShadow: `0 0 8px ${dot}`, flexShrink: 0 }} />
                          <span style={{ fontSize: 14, fontWeight: 600, color: textStrong, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.username}</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontSize: 12, color: textMid, textTransform: "capitalize" }}>{m.status}</span>
                          <span style={{
                            fontSize: 13, fontWeight: 700,
                            color: m.score >= 75 ? "#34d399" : m.score >= 50 ? "#fbbf24" : "#f87171",
                            fontFamily: "monospace",
                          }}>{Math.round(m.score)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
