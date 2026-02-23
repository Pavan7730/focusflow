/*********************************
 * FocusFlow popup.js – FINAL
 *********************************/

/* ---------- HELPERS ---------- */
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

function lastNDays(n) {
  return [...Array(n)].map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (n - 1 - i));
    return d.toISOString().split("T")[0];
  });
}

/* ---------- TAB SWITCHING ---------- */
document.addEventListener("DOMContentLoaded", () => {
  const tabs = document.querySelectorAll(".tab");
  const contents = document.querySelectorAll(".tab-content");

  tabs.forEach(tab => {
    tab.onclick = () => {
      tabs.forEach(t => t.classList.remove("active"));
      contents.forEach(c => c.classList.remove("active"));
      tab.classList.add("active");
      document.getElementById(tab.dataset.tab).classList.add("active");
    };
  });
});

/* ---------- SAVE GOAL ---------- */
document.getElementById("saveGoal")?.addEventListener("click", () => {
  const h = Number(goalHours.value || 0);
  const m = Number(goalMinutes.value || 0);
  chrome.storage.local.set({
    focusGoalMs: (h * 60 + m) * 60000
  });
});

/* ---------- STATE ---------- */
let cachedDay = { focusMs: 0, breakMs: 0, sites: {} };
let lastFetch = 0;

/* ---------- FETCH STORAGE (EVERY 1s) ---------- */
function fetchData() {
  chrome.storage.local.get(null, data => {
    cachedDay = data[todayKey()] || { focusMs: 0, breakMs: 0, sites: {} };
    cachedDay.goalMs = data.focusGoalMs || 0;
  });
}
setInterval(fetchData, 1000);
fetchData();

/* ---------- SMOOTH UI RENDER ---------- */
function render() {
  // TODAY
  liveFocus.textContent = format(cachedDay.focusMs);
  breakTime.textContent = format(cachedDay.breakMs);

  // MOST USED SITES
  topSites.innerHTML = "";
  Object.entries(cachedDay.sites || {})
    .sort((a,b) => b[1] - a[1])
    .slice(0,5)
    .forEach(([site, ms]) => {
      const li = document.createElement("li");
      li.textContent = `${site} – ${format(ms)}`;
      topSites.appendChild(li);
    });

  // TRENDS
  if (chart && range) {
    chart.innerHTML = "";
    lastNDays(Number(range.value)).forEach(d => {
      const bar = document.createElement("div");
      bar.className = "bar";
      bar.style.height =
        Math.min(((cachedDay.focusMs || 0) / 60000) * 2, 100) + "px";
      chart.appendChild(bar);
    });
  }

  // GOALS
  if (cachedDay.goalMs > 0) {
    const p = Math.min(
      (cachedDay.focusMs / cachedDay.goalMs) * 100,
      100
    );
    progressFill.style.width = p + "%";
    goalText.textContent =
      `${format(cachedDay.focusMs)} / ${format(cachedDay.goalMs)}`;
    goalStatus.textContent =
      p >= 100 ? "Goal achieved 🎉" : "You're on track 👍";
  }

  requestAnimationFrame(render);
}

requestAnimationFrame(render);
