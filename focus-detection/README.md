# focus-detection

Runs in the browser. Uses your webcam to detect if you're actually paying attention — not just "is your phone away" but "are you looking at your screen."

Built for FocusForest: a social study app where your virtual tree dies if you get distracted. This module handles all the computer vision.

---

## How it works

Three MediaPipe models running locally, no server needed:

**FaceLandmarker** extracts a 4×4 transformation matrix from your face and converts it to pitch/yaw angles. Pitch tells us if you're looking down, yaw tells us if you've turned away.

**HandLandmarker** watches wrist position. If your hand drops below 70% of the frame (into your lap), that's a distraction signal even if your face is still pointed at the screen.

**ObjectDetector** (EfficientDet) scans for phones every 10 frames. If a phone shows up AND hand landmarks overlap its bounding box, that's a confirmed detection — not just a false positive from a water bottle.

### State machine

```
focused → questionable [20s countdown]
              ↓ (if countdown expires)
          distracted [10s countdown]
              ↓ (if countdown expires)
          session failed 🌳💀

questionable/distracted → recovering [3s hold]
              ↓ (if 3s clean)
          focused ✓
```

### Modes

| Mode | Yaw limit | Pitch up | Pitch down | Notes |
|------|-----------|----------|------------|-------|
| Coding | ±25° | 20° | -25° | Allows looking at keyboard |
| Writing | ±30° | 20° | adjustable (-40° default) | Slide to match your desk angle |

---

## Test it locally

No build step needed.

```bash
cd focus-detection
python3 -m http.server 8080
```

Open `http://localhost:8080/test.html` in Chrome. Allow webcam access. Models load from CDN — first load takes ~5 seconds.

The test page shows live pitch/yaw numbers, state transitions in a log, and a slider to tune the writing-mode look-down angle.

---

## Integrating with the frontend (Next.js)

**1. Copy the folder**

Drop `focus-detection/` into your Next.js project under `src/lib/focus-detection/`.

**2. Install the dependency**

```bash
npm install @mediapipe/tasks-vision
```

**3. Use the hook**

```tsx
import { useFocusDetection } from "@/lib/focus-detection";

export default function SessionPage() {
  const videoRef = useRef<HTMLVideoElement>(null);

  const { status, countdownRemaining, recoveryRemaining } = useFocusDetection({
    mode: "coding",           // or "writing"
    videoRef,
    onSessionFailed: () => {
      // kill the tree, end session, notify backend
    },
    onStatusChange: (newStatus) => {
      // send to WebSocket room so teammates see your status
      socket.emit("status_update", { status: newStatus });
    },
  });

  return (
    <>
      <video ref={videoRef} autoPlay playsInline muted />
      <StatusBadge status={status} countdown={countdownRemaining} recovery={recoveryRemaining} />
    </>
  );
}
```

**4. MediaPipe WASM headers (Next.js config)**

MediaPipe needs cross-origin isolation for the WASM threads. Add this to `next.config.js`:

```js
async headers() {
  return [
    {
      source: "/(.*)",
      headers: [
        { key: "Cross-Origin-Opener-Policy",   value: "same-origin" },
        { key: "Cross-Origin-Embedder-Policy", value: "require-corp" },
      ],
    },
  ];
},
```

**5. Disable SSR for the hook**

MediaPipe uses browser APIs — it can't run on the server.

```tsx
import dynamic from "next/dynamic";

const FocusSession = dynamic(() => import("@/components/FocusSession"), {
  ssr: false,
});
```

---

## Integrating with the backend (FastAPI + WebSockets)

The detection module fires `onStatusChange` every time state changes. Send that to your WebSocket room so the backend can broadcast to other users.

**Frontend → Backend (send on every status change)**

```ts
onStatusChange: (status) => {
  socket.send(JSON.stringify({
    type: "focus_status",
    user_id: session.userId,
    room_id: roomId,
    status,           // "focused" | "questionable" | "distracted" | "away" | "recovering"
    timestamp: Date.now(),
  }));
}
```

**Backend (FastAPI WebSocket handler)**

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
                # optionally log to DB for session stats
                await db.log_focus_event(data)
    except WebSocketDisconnect:
        manager.disconnect(room_id, websocket)
```

**What the backend needs to store per session:**

```
session_id
user_id
room_id
started_at
ended_at
result: "completed" | "failed"
distraction_count
total_distracted_seconds
```

`onSessionFailed` fires once when the tree dies — use that to mark the session as failed and tell the backend:

```ts
onSessionFailed: async () => {
  await fetch(`/api/sessions/${sessionId}/fail`, { method: "POST" });
  socket.send(JSON.stringify({ type: "session_failed", user_id: session.userId }));
}
```

---

## Files

```
focus-detection/
  types.ts              — FocusMode, FocusState, thresholds per mode
  headPoseAnalyzer.ts   — 4×4 matrix → pitch/yaw Euler angles
  phoneDetector.ts      — ObjectDetector wrapper, returns bbox for hand correlation
  handAnalyzer.ts       — HandLandmarker, wrist position, hand-in-lap detection
  focusStateMachine.ts  — pure state machine, no timers or side effects
  useFocusDetection.ts  — React hook that wires everything + rAF loop
  index.ts              — barrel export
  test.html             — standalone browser test, no build needed
```

## Stack

- [@mediapipe/tasks-vision](https://ai.google.dev/edge/mediapipe/solutions/vision/face_landmarker) — FaceLandmarker, HandLandmarker, ObjectDetector
- Runs 100% in-browser, no cloud, no data leaves the device
