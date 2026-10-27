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
