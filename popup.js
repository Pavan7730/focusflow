/* ---------- HELPERS ---------- */
function format(ms) {
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  const x = ms % 1000;
  return `${h.toString().padStart(2,"0")}:${m.toString().padStart(2,"0")}:${s.toString().padStart(2,"0")}.${x}`;
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

/* ---------- TABS ---------- */
document.querySelectorAll(".tab").forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll(".tab,.tab-content")
      .forEach(e => e.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById(btn.dataset.tab).classList.add("active");
  };
});

/* ---------- SAVE GOAL ---------- */
document.getElementById("saveGoal").onclick = () => {
  const h = +goalHours.value || 0;
  const m = +goalMinutes.value || 0;
  chrome.storage.local.set({ focusGoalMs: (h * 60 + m) * 60000 });
};

/* ---------- LIVE REFRESH ---------- */
function refresh() {
  chrome.storage.local.get(null, data => {
    const today = data[todayKey()] || { focusMs: 0, breakMs: 0, sites: {} };

    chrome.runtime.sendMessage("getLiveState", live => {
      let focusMs = today.focusMs;
      let breakMs = today.breakMs;

      if (live.focusRunning) focusMs += Date.now() - live.focusSince;
      if (live.breakRunning) breakMs += Date.now() - live.breakSince;

      liveFocus.textContent = format(focusMs);
      breakTime.textContent = format(breakMs);

      topSites.innerHTML = "";
      Object.entries(today.sites)
        .sort((a,b) => b[1] - a[1])
        .slice(0,5)
        .forEach(([s,ms]) => {
          const li = document.createElement("li");
          li.textContent = `${s} – ${format(ms)}`;
          topSites.appendChild(li);
        });

      /* TRENDS */
      chart.innerHTML = "";
      lastNDays(+range.value).forEach(d => {
        const bar = document.createElement("div");
        bar.className = "bar";
        bar.style.height = `${Math.min((data[d]?.focusMs || 0)/60000*2,100)}px`;
        chart.appendChild(bar);
      });

      /* GOAL */
      const goal = data.focusGoalMs || 0;
      if (goal > 0) {
        const p = Math.min((focusMs / goal) * 100, 100);
        progressFill.style.width = p + "%";
        goalText.textContent = `${format(focusMs)} / ${format(goal)}`;
        goalStatus.textContent = p >= 100 ? "Goal achieved 🎉" : "You're on track 👍";
      }
    });
  });
}

setInterval(refresh, 100);
