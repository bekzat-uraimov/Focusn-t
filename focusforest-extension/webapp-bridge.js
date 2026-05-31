const WEBAPP_SOURCE = "focusnt-webapp";
const EXTENSION_SOURCE = "focusnt-extension";
const STORAGE_KEY = "focusnt_extension_state";
const ACCEPTED_TYPES = new Set([
  "FOCUSNT_SESSION_UPDATE",
  "FOCUSNT_SESSION_START",
  "FOCUSNT_SESSION_STOP",
  "FOCUSNT_FOCUS_UPDATE"
]);

let lastStorageValue = null;
let storagePoll = null;

window.addEventListener("message", handlePageMessage);
window.addEventListener("pagehide", notifyPageHidden);

postReady();
startStoragePolling();

function handlePageMessage(event) {
  if (event.source !== window) return;

  const data = event.data;
  if (!data || data.source !== WEBAPP_SOURCE || !ACCEPTED_TYPES.has(data.type)) return;

  if (data.type === "FOCUSNT_SESSION_STOP") {
    sendToBackground({ type: "WEBAPP_SESSION_STOP" });
    return;
  }

  sendToBackground({
    type: "WEBAPP_SESSION_UPDATE",
    origin: window.location.origin,
    payload: normalizePayload(data)
  });
}

function normalizePayload(data) {
  const payload = data.payload || data.state || {};

  if (data.type === "FOCUSNT_SESSION_START") {
    return {
      ...payload,
      active: true,
      sessionState: "running"
    };
  }

  if (data.type === "FOCUSNT_FOCUS_UPDATE") {
    return {
      ...payload,
      active: true,
      sessionState: "running"
    };
  }

  return payload;
}

function startStoragePolling() {
  readStorageState();
  storagePoll = window.setInterval(readStorageState, 1_000);
}

function readStorageState() {
  let raw = null;

  try {
    raw = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return;
  }

  if (!raw || raw === lastStorageValue) return;
  lastStorageValue = raw;

  try {
    const payload = JSON.parse(raw);
    sendToBackground({
      type: "WEBAPP_SESSION_UPDATE",
      origin: window.location.origin,
      payload
    });
  } catch {
    // Ignore malformed app-owned state.
  }
}

function notifyPageHidden() {
  if (storagePoll) window.clearInterval(storagePoll);
  sendToBackground({ type: "WEBAPP_SESSION_STOP" });
}

function sendToBackground(message) {
  chrome.runtime.sendMessage(message).catch(() => {});
}

function postReady() {
  window.postMessage({
    source: EXTENSION_SOURCE,
    type: "FOCUSNT_EXTENSION_READY"
  }, window.location.origin);
}
