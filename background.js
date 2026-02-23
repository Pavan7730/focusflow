// FocusFlow background.js (STABLE VERSION)

let lastTick = Date.now();
let lastActiveTime = Date.now();
let currentDomain = null;

const BREAK_THRESHOLD = 20000; // 20 seconds

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

// Track active tab
chrome.tabs.onActivated.addListener(async ({ tabId }) => {
  const tab = await chrome.tabs.get(tabId);
  currentDomain = getDomain(tab?.url);
  lastActiveTime = Date.now();
});

chrome.tabs.onUpdated.addListener((_, info, tab) => {
  if (info.url) {
    currentDomain = getDomain(info.url);
    lastActiveTime = Date.now();
  }
});

// Detect user activity
chrome.idle.setDetectionInterval(15);
chrome.idle.onStateChanged.addListener(state => {
  if (state === "active") {
    lastActiveTime = Date.now();
  }
});

// MAIN TIMER (EVERY SECOND)
setInterval(async () => {
  const now = Date.now();
  const delta = now - lastTick;
  lastTick = now;

  const day = await getDay();

  // BREAK LOGIC
  if (now - lastActiveTime > BREAK_THRESHOLD) {
    day.breakMs += delta;
  } else {
    day.focusMs += delta;
    if (currentDomain) {
      day.sites[currentDomain] =
        (day.sites[currentDomain] || 0) + delta;
    }
  }

  await saveDay(day);
}, 1000);
