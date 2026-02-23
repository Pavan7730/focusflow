let currentDomain = null;
let startTime = null;

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

async function saveTime(domain, ms) {
  if (!domain || ms <= 0) return;

  const minutes = Math.round(ms / 60000);
  const key = todayKey();

  const data = await chrome.storage.local.get(key);
  const day = data[key] || { sites: {} };

  day.sites[domain] = (day.sites[domain] || 0) + minutes;

  await chrome.storage.local.set({ [key]: day });
}

async function switchDomain(url) {
  const now = Date.now();
  if (currentDomain && startTime) {
    await saveTime(currentDomain, now - startTime);
  }
  currentDomain = getDomain(url);
  startTime = now;
}

chrome.tabs.onActivated.addListener(async ({ tabId }) => {
  const tab = await chrome.tabs.get(tabId);
  if (tab?.url) switchDomain(tab.url);
});

chrome.tabs.onUpdated.addListener((tabId, info, tab) => {
  if (info.url) switchDomain(info.url);
});

chrome.idle.setDetectionInterval(60);
chrome.idle.onStateChanged.addListener(async (state) => {
  if (state !== "active") {
    if (currentDomain && startTime) {
      await saveTime(currentDomain, Date.now() - startTime);
    }
    startTime = null;
  }
});
