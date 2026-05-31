const elements = {
  connectionDot: document.getElementById("connection-dot"),
  gaugeFill: document.getElementById("gauge-fill"),
  needle: document.getElementById("needle"),
  scoreValue: document.getElementById("score-value"),
  statusLabel: document.getElementById("status-label"),
  speedometer: document.getElementById("speedometer")
};

let pollHandle = null;

document.addEventListener("DOMContentLoaded", () => {
  refresh();
  pollHandle = setInterval(refresh, 1_000);
});

window.addEventListener("unload", () => {
  if (pollHandle) clearInterval(pollHandle);
});

async function refresh() {
  const state = await sendMessage({ type: "GET_STATE" });
  if (!state?.success) {
    renderInactive("Disconnected");
    return;
  }

  if (!state.active) {
    renderInactive("Waiting for web app");
    return;
  }

  renderActive(state);
}

function renderActive(state) {
  const score = clampScore(state.score);
  const rotation = -90 + score * 1.8;

  elements.connectionDot.dataset.active = "true";
  elements.speedometer.dataset.status = state.status;
  elements.gaugeFill.style.strokeDashoffset = String(100 - score);
  elements.needle.style.transform = `translateX(-50%) rotate(${rotation}deg)`;
  elements.scoreValue.textContent = String(score);
  elements.statusLabel.textContent = labelForStatus(state.status);
}

function renderInactive(label) {
  elements.connectionDot.dataset.active = "false";
  elements.speedometer.dataset.status = "idle";
  elements.gaugeFill.style.strokeDashoffset = "100";
  elements.needle.style.transform = "translateX(-50%) rotate(-90deg)";
  elements.scoreValue.textContent = "--";
  elements.statusLabel.textContent = label;
}

function sendMessage(message) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(message, (response) => {
      if (chrome.runtime.lastError) {
        resolve({ success: false, error: chrome.runtime.lastError.message });
        return;
      }

      resolve(response);
    });
  });
}

function labelForStatus(status) {
  const labels = {
    focused: "Focused",
    questionable: "Drifting",
    distracted: "Distracted",
    away: "Away",
    recovering: "Recovering"
  };

  return labels[status] || "Running";
}

function clampScore(score) {
  const numericScore = Number(score);
  if (!Number.isFinite(numericScore)) return 0;
  return Math.max(0, Math.min(100, Math.round(numericScore)));
}
