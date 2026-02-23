function todayKey() {
  return new Date().toISOString().split("T")[0];
}

function last7Days() {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().split("T")[0]);
  }
  return days;
}

function minutesToHours(min) {
  return `${Math.floor(min / 60)}h ${min % 60}m`;
}

chrome.storage.local.get(null, (data) => {
  // TODAY
  const today = data[todayKey()];
  let total = 0;

  if (today?.sites) {
    Object.values(today.sites).forEach(m => total += m);
  }

  document.getElementById("todayStats").textContent =
    total ? minutesToHours(total) : "No activity yet";

  // TOP SITES
  const topSites = document.getElementById("topSites");
  if (today?.sites) {
    Object.entries(today.sites)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .forEach(([site, min]) => {
        const li = document.createElement("li");
        li.textContent = `${site} – ${minutesToHours(min)}`;
        topSites.appendChild(li);
      });
  }

  // WEEKLY
  const weekly = document.getElementById("weekly");
  last7Days().forEach(day => {
    const mins = data[day]?.sites
      ? Object.values(data[day].sites).reduce((a, b) => a + b, 0)
      : 0;

    const li = document.createElement("li");
    li.textContent = `${day}: ${minutesToHours(mins)}`;
    weekly.appendChild(li);
  });
});
