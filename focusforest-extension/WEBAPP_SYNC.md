# Web App Sync

The extension mirrors state from the Focusn't web app. It does not start its own
camera session, run Gemini, or analyze history.

Add this effect in `frontend/src/app/page.tsx` after the session, score, status,
warnings, mode, duration, and elapsed state values are available:

```tsx
useEffect(() => {
  const payload = {
    sessionState,
    active: sessionState === "running",
    score: attentionScore,
    status: focusStatus,
    warnings,
    mode: focusMode,
    duration,
    elapsed,
    updatedAt: Date.now(),
  };

  window.postMessage({
    source: "focusnt-webapp",
    type: "FOCUSNT_SESSION_UPDATE",
    payload,
  }, window.location.origin);

  localStorage.setItem("focusnt_extension_state", JSON.stringify(payload));
}, [
  sessionState,
  attentionScore,
  focusStatus,
  warnings,
  focusMode,
  duration,
  elapsed,
]);
```

The content script listens on local development URLs and Vercel preview URLs:

```json
"http://localhost/*",
"http://127.0.0.1/*",
"https://*.vercel.app/*"
```

Add your deployed production domain to `manifest.json` if it is not a Vercel URL.
