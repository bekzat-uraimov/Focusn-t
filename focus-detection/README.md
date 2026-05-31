# focus-detection

Runs entirely in the browser. Uses your webcam to compute a real-time attention score (0–100) using face pose, eye gaze, blink detection, hand position, and phone detection. Built for FocusForest — a social study app where your virtual tree's health reflects how focused you actually are.

No cloud. No server. Everything runs locally with MediaPipe WASM.

---

## How it works

Three MediaPipe models run in parallel:

**FaceLandmarker** — extracts a 4×4 transformation matrix → Euler angles (pitch/yaw). Also outputs 52 face blendshapes including eye blink scores and gaze direction (eyeLookOutLeft, eyeLookDownRight, etc).

**HandLandmarker** — watches wrist position. Wrist below 70% of frame height = hand in lap = distraction signal, even if your face is still pointed at the screen.

**ObjectDetector** (EfficientDet) — scans for phones every 10 frames. Phone detection is treated as confirmed only when hand landmarks also overlap the bounding box, reducing false positives.

### Attention Score (0–100)

All signals combine into one smooth number. Slow to drop, fast to recover (exponential moving average).

| Signal | Max penalty |
|--------|-------------|
| Yaw > limit (looking sideways) | 40 pts |
| Pitch out of range (up or down) | 35 pts |
| Eye blink score > 0.55 | 25 pts |
| Gaze out (eye looking sideways) | 20 pts |
| Hand in lap | 20 pts |
| Phone detected | 40 pts |

### State machine

Score thresholds drive state, not binary pose detection:

```
score ≥ 75  → focused ✓
score 50–70 → questionable  [20s countdown visible]
score < 50  → distracted    [10s countdown — tree dies if it hits 0]

recovery: score ≥ 75 sustained for 3s → back to focused
```

### Gaze arrow

A live arrow is drawn on the video overlay pointing in the direction your eyes are facing. Green at high score, yellow when questionable, red when distracted. Makes the CV work immediately visible during a demo.

### Modes

| Mode | Yaw limit | Pitch down | Notes |
|------|-----------|------------|-------|
| Coding | ±25° | -25° | Keyboard glances allowed |
| Writing | ±30° | adjustable (-40° default) | Notebook angle, slider in test UI |

---

## Test it locally

No build step.

```bash
cd focus-detection
python3 -m http.server 8080
```

Open `http://localhost:8080/test.html` in Chrome. Allow webcam. First load downloads models from CDN (~5s).

The test UI shows: live score ring, tree health emoji, warning pills, gaze arrow overlay, blendshape values, mode toggle, and writing-mode pitch slider.

---

## Integrating with the frontend (Next.js)

**1. Copy the folder**

```
src/lib/focus-detection/
```

**2. Install the dependency**

```bash
npm install @mediapipe/tasks-vision
```

**3. Use the hook**

```tsx
import { useFocusDetection } from "@/lib/focus-detection";

export default function SessionPage() {
  const videoRef = useRef<HTMLVideoElement>(null);

  const { status, attentionScore, activeWarnings, countdownRemaining, recoveryRemaining } =
    useFocusDetection({
      mode: "coding",            // or "writing"
      videoRef,
      onSessionFailed: () => {
        killTree();              // trigger death animation
        endSession("failed");
      },
      onStatusChange: (status) => {
        socket.emit("status_update", { status });
      },
      onScoreChange: (score) => {
        // drive tree health animation directly from score
        setTreeHealth(score);   // 0–100
      },
    });

  return (
    <>
      {/* video must be in DOM but can be hidden */}
      <video ref={videoRef} autoPlay playsInline muted style={{ display: "none" }} />
      <TreeAnimation health={attentionScore} status={status} />
      {activeWarnings.length > 0 && (
        <WarningPills warnings={activeWarnings} />
      )}
      {countdownRemaining !== null && (
        <Countdown seconds={countdownRemaining} status={status} />
      )}
    </>
  );
}
```

**4. `attentionScore` → tree health**

Map score directly to your tree animation. Suggested breakpoints:

```ts
score >= 80  → 🌳 fully grown, green
score 65–79  → 🌿 slightly wilted
score 50–64  → 🍂 browning, questionable state
score 25–49  → 🪵 dying, distracted countdown running
score < 25   → 💀 critical — tree about to die
```

**5. `activeWarnings` → UI hints**

Array of strings telling the user *why* their score is dropping. Show as pills or a toast:

```ts
// possible values:
"looking left" | "looking right" | "looking up" | "looking down"
"eyes closing" | "eyes looking away" | "eyes looking down"
"phone detected" | "hand in lap" | "face not visible"
```

**6. Next.js WASM headers**

MediaPipe needs cross-origin isolation. Add to `next.config.js`:

```js
async headers() {
  return [{
    source: "/(.*)",
    headers: [
      { key: "Cross-Origin-Opener-Policy",   value: "same-origin" },
      { key: "Cross-Origin-Embedder-Policy", value: "require-corp" },
    ],
  }];
},
```

**7. Disable SSR**

MediaPipe uses browser APIs — can't run server-side.

```tsx
const FocusSession = dynamic(() => import("@/components/FocusSession"), { ssr: false });
```

---

## Integrating with the backend (FastAPI + WebSockets)

**What to send on every status change:**

```ts
onStatusChange: (status) => {
  socket.send(JSON.stringify({
    type:      "focus_status",
    user_id:   session.userId,
    room_id:   roomId,
    status,                    // "focused" | "questionable" | "distracted" | "away" | "recovering"
    score:     attentionScore, // 0–100
    timestamp: Date.now(),
  }));
}
```

**FastAPI WebSocket handler:**

```python
@app.websocket("/ws/{room_id}")
async def room_socket(websocket: WebSocket, room_id: str):
    await manager.connect(room_id, websocket)
    try:
        while True:
            data = await websocket.receive_json()
            if data["type"] == "focus_status":
                # broadcast to everyone else in the room
                await manager.broadcast(room_id, data, exclude=websocket)
                # log to DB for session stats + leaderboards
                await db.log_focus_event(data)
    except WebSocketDisconnect:
        manager.disconnect(room_id, websocket)
```

**Session model (what to store in Postgres):**

```python
class FocusSession(Base):
    id              = Column(UUID)
    user_id         = Column(UUID, ForeignKey("users.id"))
    room_id         = Column(UUID, ForeignKey("rooms.id"))
    mode            = Column(String)          # "coding" | "writing"
    started_at      = Column(DateTime)
    ended_at        = Column(DateTime)
    result          = Column(String)          # "completed" | "failed"
    avg_score       = Column(Float)           # average attention score
    min_score       = Column(Float)
    distraction_count = Column(Integer)
    total_distracted_secs = Column(Integer)
```

**Session failed event (tree died):**

```ts
onSessionFailed: async () => {
  await fetch(`/api/sessions/${sessionId}/fail`, { method: "POST" });
  socket.send(JSON.stringify({
    type:    "session_failed",
    user_id: session.userId,
    room_id: roomId,
  }));
}
```

The backend broadcasts `session_failed` → other room members see `John 💀 Failed` in the room panel.

---

## Files

```
focus-detection/
  types.ts              — FocusMode, FocusState, ModeThresholds
  headPoseAnalyzer.ts   — 4×4 matrix → pitch/yaw; blendshape extraction
  attentionScorer.ts    — combines all signals → 0–100 score + activeWarnings[]
  phoneDetector.ts      — ObjectDetector wrapper, returns normalized bbox
  handAnalyzer.ts       — HandLandmarker, wrist Y position, lap detection
  focusStateMachine.ts  — score-threshold state machine, no timers/side-effects
  useFocusDetection.ts  — React hook: rAF loop, blendshapes, all models wired
  index.ts              — barrel export
  test.html             — standalone browser test (no build needed)
```

## Stack

- [@mediapipe/tasks-vision](https://ai.google.dev/edge/mediapipe/solutions/vision/face_landmarker) — FaceLandmarker, HandLandmarker, ObjectDetector
- Runs 100% client-side. No webcam data leaves the browser.
