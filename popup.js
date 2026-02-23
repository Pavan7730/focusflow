/*******************************
 * FocusFlow – popup.js (FINAL)
 *******************************/

/* ---------- HELPERS ---------- */
function format(ms) {
  ms = Number(ms);
  if (!ms || ms < 0) ms = 0;

  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  const x = ms % 1000;

  return `${h.toString().padStart(2, "0")}:${m
    .toString()
    .padStart(2, "0")}:${s
    .toString()
    .padStart(2, "0")}.${x.toString().padStart(3, "0")}`;
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
document.querySelectorAll(".tab").forEach(btn => {
  btn.addEventListener("click", () => {
    document
      .querySelectorAll(".tab, .tab-content")
      .forEach(el => el.classList.remove("active"));

    btn.classList.add("active");
    document.getElementById(btn.dataset.tab).classList.add("active");
  });
});

/* ---------- SAVE DAILY GOAL ---------- */
const saveBtn = document.getElementById("saveGoal");
if (saveBtn) {
  saveBtn.onclick = () => {
    const h = Number(document.getElementById("goalHours")?.value || 0);
    const m = Number(document.getElementById("goalMinutes")?.value || 0);
    const goalMs = (h * 60 + m) * 60000;

    chrome.storage.local.set({ focusGoalMs: goalMs });
  };
}

/* ---------- MAIN REFRESH LOOP ---------- */
function refresh() {
  chrome.storage.local.get(null, data => {
    const todayData = data[todayKey()] || {};

    const storedFocus = Number(todayData.focusMs) || 0;
    const storedBreak = Number(todayData.breakMs) || 0;
    const sites = todayData.sites || {};

    chrome.runtime.sendMessage("getLiveState", live => {
      // MV3 safety: background may be asleep
      if (chrome.runtime.lastError || !live) return;

      let focusMs = storedFocus;
      let breakMs = storedBreak;

      if (live.focusRunning && typeof live.focusSince === "number") {
        focusMs += Date.now() - live.focusSince;
      }

      if (live.breakRunning && typeof live.breakSince === "number") {
        breakMs += Date.now() - live.breakSince;
      }

      /* ---------- TODAY TAB ---------- */
      const focusEl = document.getElementById("liveFocus");
      const breakEl = document.getElementById("breakTime");
      if (focusEl) focusEl.textContent = format(focusMs);
      if (breakEl) breakEl.textContent = format(breakMs);

      /* ---------- MOST USED SITES ---------- */
      const ul = document.getElementById("topSites");
      if (ul) {
        ul.innerHTML = "";
        Object.entries(sites)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .forEach(([site, ms]) => {
            const li = document.createElement("li");
            li.textContent = `${site} – ${format(ms)}`;
            ul.appendChild(li);
          });
      }

      /* ---------- TRENDS TAB ---------- */
      const chart = document.getElementById("chart");
      const range = document.getElementById("range");
      if (chart && range) {
        chart.innerHTML = "";
        lastNDays(Number(range.value)).forEach(day => {
          const dayFocus = Number(data[day]?.focusMs) || 0;
          const bar = document.createElement("div");
          bar.className = "bar";
          bar.style.height = `${Math.min(
            (dayFocus / 60000) * 2,
            100
          )}px`;
          chart.appendChild(bar);
        });
      }

      /* ---------- GOALS TAB ---------- */
      const goalMs = Number(data.focusGoalMs) || 0;
      const fill = document.getElementById("progressFill");
      const goalText = document.getElementById("goalText");
      const goalStatus = document.getElementById("goalStatus");

      if (goalMs > 0 && fill && goalText && goalStatus) {
        const percent = Math.min((focusMs / goalMs) * 100, 100);
        fill.style.width = percent + "%";
        goalText.textContent = `${format(focusMs)} / ${format(goalMs)}`;
        goalStatus.textContent =
          percent >= 100 ? "Goal achieved 🎉" : "You're on track 👍";
      }
    });
  });
}

/* ---------- REAL-TIME UPDATE ---------- */
setInterval(refresh, 100);
