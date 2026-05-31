# focusn't

A focus timer that uses your webcam to detect distraction in real time. When you look away for too long, your session fails and the planet flying toward your galaxy retreats. Complete a session and the planet joins permanently.

No server required. All ML runs in the browser via MediaPipe WASM. Webcam data never leaves the device.

---

## Quick start

```bash
cd frontend
npm install
npm run dev
# → http://localhost:3000
```

---

## Features

### 3D Planet Scene
- Full-screen Three.js canvas (React Three Fiber)
- Planet system on the right — base cluster of 3 orbiting planets
- Each completed session adds a permanent planet to your galaxy (stored in `localStorage`)
- When a session starts, a random planet spawns lower-left and travels along a dotted arc toward the system
- Session complete → planet joins orbit. Session failed → planet retreats
- Day / Night theme toggle — sky blue gradient vs deep space with nebula + stars
- SystemCore glow color tracks your attention score: indigo (focused) → amber (drifting) → red (distracted)

### Focus Detection (browser-only, no backend needed)
Runs three MediaPipe models in a `requestAnimationFrame` loop:

| Model | What it detects |
|-------|----------------|
| FaceLandmarker | Head pose (pitch/yaw), eye blink, gaze direction |
| HandLandmarker | Wrist position — hand in lap = distraction signal |
| ObjectDetector | Phone detection every 10 frames (EfficientDet) |

**Attention score (0–100):**

| Signal | Max penalty |
|--------|-------------|
| Looking sideways (yaw > limit) | 40 pts |
| Pitch out of range | 35 pts |
| Eye blink score > 0.55 | 25 pts |
| Gaze out | 20 pts |
| Hand in lap | 20 pts |
| Phone detected | 40 pts |

Score uses EMA: slow to drop (α=0.12), fast to recover (α=0.25).

**State machine:**
```
focused → questionable (20s countdown) → distracted (10s countdown) → SESSION FAILED
                                                   ↑
                                         score recovers → recovering (3s) → focused
```

Away (face not visible for 3s) → `away` status.

### Focus Modes
- **Coding** — strict yaw ±25°, pitch down -25°
- **Writing** — relaxed yaw ±30°, pitch down adjustable (-20° to -65°) via slider

### HUD Layout
- **Top-left**: Live webcam feed with face mesh overlay (tesselation + eyes + lips + irises drawn on canvas)
- **Top-center**: Distraction alert pill with countdown badge
- **Bottom-right**: Timer card — duration presets, progress bar, attention score badge
- **Bottom-center**: Status bar — `● Focused · 87 · Coding`
- **Center**: Big red countdown number when distracted (10 → 0)
- **Screen edges**: Color vignette — amber (questionable), red pulsing (distracted)

### Live Warnings Panel
Shows below the camera widget when score drops. Explains exactly why:
- `→ looking right`
- `~ eyes closing`
- `📵 phone detected`
- `✋ hand in lap`

---

## Project structure

```
focusn-t/
├── frontend/                    Next.js 14 app
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx         Main page — session state, layout, focus wiring
│   │   │   ├── layout.tsx
│   │   │   └── globals.css
│   │   ├── components/
│   │   │   ├── PlanetScene.tsx  Three.js canvas — planets, orbit path, journey planet
│   │   │   ├── Timer.tsx        HUD timer card
│   │   │   ├── FocusSession.tsx Webcam + face mesh + useFocusDetection hook
│   │   │   └── DistractionAlert.tsx  Status pill with countdown
│   │   └── lib/
│   │       └── focus/           Focus detection engine (copied from focus-detection/)
│   │           ├── types.ts
│   │           ├── useFocusDetection.ts
│   │           ├── headPoseAnalyzer.ts
│   │           ├── attentionScorer.ts
│   │           ├── phoneDetector.ts
│   │           ├── handAnalyzer.ts
│   │           ├── focusStateMachine.ts
│   │           └── index.ts
│   ├── public/models/           GLB planet models
│   ├── next.config.mjs          COOP/COEP headers for SharedArrayBuffer (WASM)
│   └── package.json
│
├── focus-detection/             Standalone focus detection module + test harness
│   ├── test.html                Browser test (no build: python3 -m http.server 8080)
│   └── README.md                Module docs + original backend integration guide
│
└── README.md                    ← you are here
```

---

## Stack

| Layer | Tech |
|-------|------|
| Framework | Next.js 14.1, React 18.2 |
| 3D | Three.js, @react-three/fiber, @react-three/drei |
| ML | @mediapipe/tasks-vision (WASM, runs in browser) |
| Language | TypeScript |

---

## Backend integration

The frontend is self-contained but designed to slot into a FastAPI + WebSocket backend. Two integration points:

### 1. Wire callbacks in `FocusSession.tsx`

```tsx
// In page.tsx — pass these to FocusSession
const handleSessionFailed = () => {
  // existing: triggers giveUp() which makes planet retreat

  // ADD: notify backend
  socket.send(JSON.stringify({
    type: "session_failed",
    user_id: userId,
    room_id: roomId,
  }));
};

const handleStateChange = (s) => {
  // existing: updates local UI state

  // ADD: broadcast focus state
  socket.send(JSON.stringify({
    type: "focus_status",
    user_id: userId,
    room_id: roomId,
    status: s.status,        // "focused" | "questionable" | "distracted" | "away" | "recovering"
    score: s.attentionScore, // 0–100
    timestamp: Date.now(),
  }));
};
```

### 2. Session lifecycle events

```tsx
// Start session
await fetch("/api/sessions", {
  method: "POST",
  body: JSON.stringify({ mode: focusMode, duration, room_id: roomId }),
});

// Complete
await fetch(`/api/sessions/${sessionId}/complete`, { method: "POST" });

// Failed (also fired by focus detection)
await fetch(`/api/sessions/${sessionId}/fail`, { method: "POST" });
```

### FastAPI WebSocket handler

```python
@app.websocket("/ws/{room_id}")
async def room_socket(websocket: WebSocket, room_id: str):
    await manager.connect(room_id, websocket)
    try:
        while True:
            data = await websocket.receive_json()
            if data["type"] == "focus_status":
                await manager.broadcast(room_id, data, exclude=websocket)
                await db.log_focus_event(data)
            elif data["type"] == "session_failed":
                await manager.broadcast(room_id, data, exclude=websocket)
    except WebSocketDisconnect:
        manager.disconnect(room_id, websocket)
```

### Database model

```python
class FocusSession(Base):
    id                    = Column(UUID)
    user_id               = Column(UUID, ForeignKey("users.id"))
    room_id               = Column(UUID, ForeignKey("rooms.id"))
    mode                  = Column(String)   # "coding" | "writing"
    started_at            = Column(DateTime)
    ended_at              = Column(DateTime)
    result                = Column(String)   # "completed" | "failed"
    avg_score             = Column(Float)
    min_score             = Column(Float)
    distraction_count     = Column(Integer)
    total_distracted_secs = Column(Integer)
```

### Key types (TypeScript → backend contract)

```ts
// Status events
type FocusStatus = "focused" | "questionable" | "distracted" | "away" | "recovering";

// What the hook returns — mirror this in your backend schema
interface FocusState {
  status: FocusStatus;
  attentionScore: number;          // 0–100
  activeWarnings: string[];        // ["looking right", "eyes closing", ...]
  countdownRemaining: number|null; // seconds until next state
  recoveryRemaining: number|null;
  pitch: number;
  yaw: number;
  phoneDetected: boolean;
  handInLap: boolean;
  facePresent: boolean;
}
```

### COOP/COEP headers (already set in `next.config.mjs`)

Required for MediaPipe SharedArrayBuffer. Your backend must also send these headers on any page that loads the frontend, or configure your reverse proxy:

```nginx
add_header Cross-Origin-Opener-Policy "same-origin";
add_header Cross-Origin-Embedder-Policy "require-corp";
```

---

## Environment

No `.env` needed for the standalone frontend. When connecting to a backend:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000
```

---

## License

MIT
