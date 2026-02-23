// ------------------ TAB SWITCHING ------------------
document.querySelectorAll(".tab").forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll(".tab, .tab-content")
      .forEach(el => el.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById(btn.dataset.tab).classList.add("active");
  };
});

// ------------------ HELPERS ------------------
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

function format(ms) {
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  const msx = ms % 1000;
  return `${h.toString().padStart(2,"0")}:${m.toString().padStart(2,"0")}:${s.toString().padStart(2,"0")}.${msx}`;
}

// ------------------ LIVE FOCUS TIMER ------------------
let start = Date.now();
setInterval(() => {
  document.getElementById("liveFocus").textContent =
    format(Date.now() - start);
}, 100);

// ------------------ LOAD DATA ------------------
chrome.storage.local.get(null, data => {
  const today = data[todayKey()] || {};

  // BREAK TIME
  const breakMin = today.breakMinutes || 0;
  document.getElementById("breakTime").textContent =
    `${Math.floor(breakMin / 60)}h ${breakMin % 60}m`;

  // TOP SITES
  const top = document.getElementById("topSites");
  Object.entries(today.sites || {})
    .sort((a,b) => b[1] - a[1])
    .slice(0,5)
    .forEach(([site,min]) => {
      const li = document.createElement("li");
      li.textContent = `${site} – ${min}m`;
      top.appendChild(li);
    });

  // TRENDS
  function renderTrends(days) {
    const chart = document.getElementById("chart");
    chart.innerHTML = "";
    let total = 0;

    lastNDays(days).forEach(d => {
      const m = data[d]?.focusMinutes || 0;
      total += m;
      const bar = document.createElement("div");
      bar.className = "bar";
      bar.style.height = `${Math.min(m * 2, 100)}px`;
      chart.appendChild(bar);
    });

    document.getElementById("trendSummary").textContent =
      `You focused ${Math.floor(total/60)}h ${total%60}m in last ${days} days.`;
  }

  renderTrends(7);
  document.getElementById("range").onchange =
    e => renderTrends(+e.target.value);

  // INSIGHTS
  const insights = document.getElementById("insightList");
  insights.innerHTML = `
    <li>You focus best when sessions are longer than 30 minutes.</li>
    <li>Your productivity improves with fewer breaks.</li>
    <li>Consistency matters more than long hours.</li>
  `;
});
