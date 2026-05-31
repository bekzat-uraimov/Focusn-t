const STORAGE_STATE_KEY = "focusntMirrorState";
const NOTIFICATION_THROTTLE_MS = 30_000;
const ALERT_STATUSES = new Set(["questionable", "distracted", "away"]);
const ACTIVE_SESSION_STATES = new Set(["running", "active"]);
const INACTIVE_SESSION_STATES = new Set(["idle", "completed", "failed", "stopped"]);

let mirrorState = createMirrorState();
let hydrated = false;

chrome.runtime.onInstalled.addListener(() => {
  clearBadge();
});

chrome.runtime.onStartup.addListener(() => {
  hydrateState().then(() => {
    if (mirrorState.active) {
      updateBadge(mirrorState.score);
    } else {
      clearBadge();
    }
  });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const handledTypes = new Set([
    "GET_STATE",
    "WEBAPP_SESSION_UPDATE",
    "WEBAPP_SESSION_STOP"
  ]);

  if (!message || !handledTypes.has(message.type)) return false;

  (async () => {
    await hydrateState();

    if (message.type === "GET_STATE") {
      return getState();
    }

    if (message.type === "WEBAPP_SESSION_STOP") {
      await applyWebAppUpdate({
        sessionState: "idle",
        origin: sender.origin || sender.url || mirrorState.origin
      });
      return { success: true };
    }

    await applyWebAppUpdate({
      ...message.payload,
      origin: message.origin || sender.origin || sender.url || null
    });
    return { success: true };
  })()
    .then((response) => sendResponse(response))
    .catch((error) => {
      console.error("Focusn't mirror error:", error);
      sendResponse({ success: false, error: error.message || String(error) });
    });

  return true;
});

function createMirrorState(overrides = {}) {
  return {
    active: false,
    sessionState: "idle",
    score: 0,
    status: "idle",
    warnings: [],
    mode: null,
    origin: null,
    startedAt: null,
    updatedAt: null,
    lastNotificationTime: 0,
    ...overrides
  };
}

async function hydrateState() {
  if (hydrated) return;

  const stored = await chrome.storage.local.get(STORAGE_STATE_KEY);
  if (stored[STORAGE_STATE_KEY]) {
    mirrorState = createMirrorState(stored[STORAGE_STATE_KEY]);
  }

  hydrated = true;
}

async function applyWebAppUpdate(payload = {}) {
  const sessionState = normalizeSessionState(payload.sessionState, payload.active);
  const active = sessionState
    ? ACTIVE_SESSION_STATES.has(sessionState)
    : Boolean(payload.active ?? mirrorState.active);
  const score = clampScore(payload.score ?? payload.attentionScore ?? mirrorState.score);
  const status = normalizeStatus(payload.status ?? payload.focusStatus ?? mirrorState.status, score, active);
  const warnings = normalizeWarnings(payload.warnings ?? payload.activeWarnings ?? mirrorState.warnings);
  const now = Date.now();

  mirrorState = createMirrorState({
    ...mirrorState,
    active,
    sessionState: active ? "running" : (sessionState || "idle"),
    score: active ? score : 0,
    status: active ? status : "idle",
    warnings: active ? warnings : [],
    mode: payload.mode ?? mirrorState.mode,
    origin: payload.origin ?? mirrorState.origin,
    startedAt: active ? (payload.startedAt ?? mirrorState.startedAt ?? now) : null,
    updatedAt: now
  });

  if (mirrorState.active) {
    updateBadge(mirrorState.score);
    await maybeNotify(mirrorState.status, mirrorState.warnings);
  } else {
    clearBadge();
  }

  await chrome.storage.local.set({ [STORAGE_STATE_KEY]: mirrorState });
}

function getState() {
  return {
    success: true,
    active: mirrorState.active,
    sessionState: mirrorState.sessionState,
    score: mirrorState.score,
    status: mirrorState.status,
    warnings: mirrorState.warnings,
    mode: mirrorState.mode,
    origin: mirrorState.origin,
    startedAt: mirrorState.startedAt,
    updatedAt: mirrorState.updatedAt
  };
}

function updateBadge(score) {
  const color =
    score >= 75 ? "#34d399" :
    score >= 50 ? "#fbbf24" :
    "#f87171";

  chrome.action.setBadgeText({ text: String(Math.round(score)) });
  chrome.action.setBadgeBackgroundColor({ color });
}

function clearBadge() {
  chrome.action.setBadgeText({ text: "" });
}

async function maybeNotify(status, warnings) {
  if (!mirrorState.active || !ALERT_STATUSES.has(status)) return;

  const now = Date.now();
  if (now - mirrorState.lastNotificationTime < NOTIFICATION_THROTTLE_MS) return;

  try {
    const focusedWindow = await chrome.windows.getLastFocused();
    if (focusedWindow?.focused) return;

    mirrorState.lastNotificationTime = now;
    const title = notificationTitle(status);
    const reason = warnings[0] || notificationReason(status);

    await chrome.notifications.create({
      type: "basic",
      iconUrl: "icons/icon48.png",
      title,
      message: `Score ${Math.round(mirrorState.score)}%. ${reason}`,
      priority: status === "questionable" ? 1 : 2
    });
  } catch (error) {
    console.warn("Unable to create notification:", error);
  }
}

function notificationTitle(status) {
  if (status === "away") return "Focusn't: away";
  if (status === "questionable") return "Focusn't: drifting";
  return "Focusn't: distracted";
}

function notificationReason(status) {
  if (status === "away") return "Your face is not visible.";
  if (status === "questionable") return "Your attention is starting to drift.";
  return "Your session needs attention.";
}

function normalizeSessionState(sessionState, active) {
  const raw = String(sessionState || "").toLowerCase();
  if (ACTIVE_SESSION_STATES.has(raw) || INACTIVE_SESSION_STATES.has(raw)) return raw;
  if (active === true) return "running";
  if (active === false) return "idle";
  return null;
}

function normalizeStatus(status, score, active) {
  const raw = String(status || "").toLowerCase();
  if (!active) return "idle";
  if (["focused", "questionable", "distracted", "away", "recovering"].includes(raw)) {
    return raw;
  }
  if (score >= 75) return "focused";
  if (score >= 50) return "questionable";
  return "distracted";
}

function normalizeWarnings(warnings) {
  if (!Array.isArray(warnings)) return [];

  return warnings
    .map((warning) => String(warning || "").trim())
    .filter(Boolean)
    .slice(0, 5);
}

function clampScore(score) {
  const numericScore = Number(score);
  if (!Number.isFinite(numericScore)) return 0;
  return Math.max(0, Math.min(100, Math.round(numericScore)));
}
