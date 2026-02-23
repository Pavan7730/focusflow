// FocusFlow background.js (FINAL – Correct Break Logic)

let lastTick = Date.now();
let lastActiveTime = Date.now();
let currentDomain = null;
let chromeWindowFocused = true;

const BREAK_THRESHOLD = 20000; // 20 seconds

/* ---------- HELPERS ---------- */
function todayKey() {
  return new Date().toISOString().split("T")[0];
}

function getDomain(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

async function getDay() {
  const key = todayKey();
  const data = await chrome.storage.local.get(key);
  return data[key] || {
    focusMs: 0,
    breakMs: 0,
    sites: {}
  };
}

async function saveDay(day) {
  await chrome.storage.local.set({ [todayKey()]: day });
}

/* ---------- TRACK ACTIVE TAB ---------- */
chrome.tabs.onActivated.addListener(async ({ tabId }) => {
  const tab = await chrome.tabs.get(tabId);
  if (tab?.url) {
    currentDomain = getDomain(tab.url);
    lastActiveTime = Date.now();
  }
});

chrome.tabs.onUpdated.addListener((_, info, tab) => {
  if (info.url) {
    currentDomain = getDomain(info.url);
    lastActiveTime = Date.now();
  }
});

/* ---------- TRACK USER ACTIVITY ---------- */
chrome.idle.setDetectionInterval(15);
chrome.idle.onStateChanged.addListener(state => {
  if (state === "active") {
    lastActiveTime = Date.now();
  }
});

/* ---------- TRACK CHROME WINDOW FOCUS ---------- */
chrome.windows.onFocusChanged.addListener(windowId => {
  chromeWindowFocused = windowId !== chrome.windows.WINDOW_ID_NONE;
});

/* ---------- MAIN TIMER (EVERY SECOND) ---------- */
setInterval(async () => {
  const now = Date.now();
  const delta = now - lastTick;
  lastTick = now;

  const day = await getDay();
  const isIdle = now - lastActiveTime > BREAK_THRESHOLD;

  if (isIdle && chromeWindowFocused) {
    // ✅ REAL BREAK: user idle while Chrome is focused
    day.breakMs += delta;
  } 
  else if (!isIdle && chromeWindowFocused) {
    // ✅ REAL FOCUS: user active inside Chrome
    day.focusMs += delta;

    if (currentDomain) {
      day.sites[currentDomain] =
        (day.sites[currentDomain] || 0) + delta;
    }
  }
  // ❌ User active outside Chrome → ignore completely

  await saveDay(day);
}, 1000);
