// FocusFlow popup.js (READ-ONLY DASHBOARD)

function format(ms) {
  ms = Math.max(0, Number(ms) || 0);
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${h.toString().padStart(2,"0")}:${m
    .toString().padStart(2,"0")}:${s
    .toString().padStart(2,"0")}`;
}

function todayKey() {
  return new Date().toISOString().split("T")[0];
}

function refresh() {
  chrome.storage.local.get(todayKey(), data => {
    const day = data[todayKey()] || { focusMs: 0, breakMs: 0, sites: {} };

    document.getElementById("liveFocus").textContent =
      format(day.focusMs);

    document.getElementById("breakTime").textContent =
      format(day.breakMs);

    const ul = document.getElementById("topSites");
    ul.innerHTML = "";

    Object.entries(day.sites)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .forEach(([site, ms]) => {
        const li = document.createElement("li");
        li.textContent = `${site} – ${format(ms)}`;
        ul.appendChild(li);
      });
  });
}

setInterval(refresh, 1000);
refresh();
