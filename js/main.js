(function () {
  var root = document.documentElement;
  var toggle = document.getElementById('themeToggle');
  var stored = null;
  try { stored = localStorage.getItem('theme'); } catch (e) {}
  if (stored === 'light' || stored === 'dark') {
    root.setAttribute('data-theme', stored);
  }

  if (toggle) {
    toggle.addEventListener('click', function () {
      var current = root.getAttribute('data-theme');
      var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      var isDark = current ? current === 'dark' : prefersDark;
      var next = isDark ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem('theme', next); } catch (e) {}
    });
  }

  var burger = document.getElementById('burger');
  var menu = document.getElementById('mobileMenu');
  if (burger && menu) {
    burger.addEventListener('click', function () {
      menu.classList.toggle('open');
    });
    menu.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { menu.classList.remove('open'); });
    });
  }

  var year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();
})();

(function () {
  var views = document.getElementById('charlie-views');
  var reports = document.getElementById('charlie-reports');
  if (!views || !reports) return;
  var base = 'https://charlie-card-hunt-boston.warmmaple17.chatgpt.site';
  var reviewed = document.getElementById('charlie-reviewed');
  var reviewDate = document.getElementById('charlie-review-date');
  fetch('https://raw.githubusercontent.com/flbjcy/find-my-charlie/main/lib/reviewed-status.json', {cache: 'no-store'}).then(function (r) { if (!r.ok) throw new Error('Unavailable'); return r.json(); }).then(function (data) {
    var count = data.lastExpandedAccessibleCount;
    var stamp = data.lastExpandedReviewAt;
    if (!reviewed || !Number.isFinite(count) || !stamp) return;
    reviewed.textContent = count.toLocaleString();
    reviewed.title = 'Accessible comments checked in the latest expanded review; incremental checks may cover fewer comments.';
    var date = new Date(stamp);
    if (reviewDate && !isNaN(date.getTime())) reviewDate.textContent = 'Latest expanded Reddit review: ' + date.toLocaleString('en-US', {timeZone: 'America/New_York', month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit'}) + ' ET. Statistics update when this page loads.';
  }).catch(function () {});
  function read(path) { return fetch(base + path).then(function (r) { if (!r.ok) throw new Error('Unavailable'); return r.json(); }); }
  read('/api/traffic').then(function (data) {
    if (!Array.isArray(data.rows)) return;
    var count = data.rows.reduce(function (sum, row) { return sum + (Number(row.views) || 0); }, 0);
    views.textContent = count.toLocaleString();
  }).catch(function () {});
  read('/api/reports').then(function (data) {
    if (!Array.isArray(data.reports)) return;
    reports.textContent = data.reports.filter(function (r) { return r.source === 'community'; }).length.toLocaleString();
  }).catch(function () {});
})();
