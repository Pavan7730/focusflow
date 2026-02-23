let currentDomain = null;
let focusStart = null;
let breakStart = null;

function todayKey() {
  return new Date().toISOString().split("T")[0];
}

function getDomain(url) {
  try { return new URL(url).hostname; } catch { return null; }
}

async function getDay() {
  const key = todayKey();
  const data = await chrome.storage.local.get(key);
  return data[key] || {
    sites: {},
    focusMs: 0,
    breakMs: 0
  };
}

async function saveDay(day) {
  await chrome.storage.local.set({ [todayKey()]: day });
}

async function saveFocus(ms) {
  if (!currentDomain || ms <= 0) return;
  const day = await getDay();
  day.focusMs += ms;
  day.sites[currentDomain] = (day.sites[currentDomain] || 0) + ms;
  await saveDay(day);
}

async function saveBreak(ms) {
  if (ms <= 0) return;
  const day = await getDay();
  day.breakMs += ms;
  await saveDay(day);
}

async function startFocus(url) {
  if (breakStart) {
    await saveBreak(Date.now() - breakStart);
    breakStart = null;
  }
  currentDomain = getDomain(url);
  focusStart = Date.now();
}

async function stopFocus() {
  if (focusStart) {
    await saveFocus(Date.now() - focusStart);
    focusStart = null;
  }
}

// TAB EVENTS
chrome.tabs.onActivated.addListener(async ({ tabId }) => {
  const tab = await chrome.tabs.get(tabId);
  if (tab?.url) await startFocus(tab.url);
});

chrome.tabs.onUpdated.addListener((_, info, tab) => {
  if (info.url) startFocus(info.url);
});

// IDLE = BREAK
chrome.idle.setDetectionInterval(60);
chrome.idle.onStateChanged.addListener(async state => {
  if (state !== "active") {
    await stopFocus();
    breakStart = Date.now();
  } else {
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
      if (tab?.url) startFocus(tab.url);
    });
  }
});

// MESSAGE FOR LIVE DATA
chrome.runtime.onMessage.addListener((msg, _, send) => {
  if (msg === "getLiveState") {
    send({
      focusRunning: !!focusStart,
      focusSince: focusStart,
      breakRunning: !!breakStart,
      breakSince: breakStart
    });
  }
});
