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
  var reviewed = document.getElementById('charlie-reviewed');
  var reviewDate = document.getElementById('charlie-review-date');
  var status = document.getElementById('charlie-stats-status');
  if (!views || !reports) return;
  var base = 'https://charlie-card-hunt-boston.flbjcy.chatgpt.site';
  var pending = false;
  function read(url) {
    return fetch(url, {cache: 'no-store'}).then(function (r) {
      if (!r.ok) throw new Error('Unavailable');
      return r.json();
    });
  }
  function refresh() {
    if (pending) return;
    pending = true;
    var activity = read(base + '/api/stats/hourly').then(function (data) {
      if (!Array.isArray(data.hours) || !data.hours.length) throw new Error('Unavailable');
      var totals = data.hours.reduce(function (sum, hour) {
        if (!Number.isFinite(hour.views) || !Number.isFinite(hour.communityReports)) throw new Error('Unavailable');
        sum.views += hour.views;
        sum.reports += hour.communityReports;
        return sum;
      }, {views: 0, reports: 0});
      views.textContent = totals.views.toLocaleString();
      reports.textContent = totals.reports.toLocaleString();
      reports.title = 'Total community submissions, including historical and withdrawn reports.';
      if (status) status.textContent = 'Live totals · updated ' + new Date().toLocaleTimeString('en-US', {hour: 'numeric', minute: '2-digit'}) + ' · refreshes every minute while this page is visible.';
    }).catch(function () {
      if (status) status.textContent = views.textContent === '—' ? 'Live totals are temporarily unavailable.' : 'Showing the last loaded totals; retrying automatically.';
    });
    var audit = read('https://raw.githubusercontent.com/flbjcy/find-my-charlie/main/lib/reviewed-status.json').then(function (data) {
      var count = data.lastExpandedAccessibleCount;
      var date = new Date(data.lastExpandedReviewAt);
      if (!reviewed || !Number.isFinite(count) || isNaN(date.getTime())) return;
      reviewed.textContent = count.toLocaleString();
      reviewed.title = 'Accessible comments in the latest expanded Reddit review. Incremental checks may cover fewer comments.';
      if (reviewDate) reviewDate.textContent = 'Latest expanded Reddit review: ' + date.toLocaleString('en-US', {timeZone: 'America/New_York', month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit'}) + ' ET.';
    }).catch(function () {});
    Promise.all([activity, audit]).finally(function () { pending = false; });
  }
  refresh();
  setInterval(function () { if (!document.hidden) refresh(); }, 60000);
  document.addEventListener('visibilitychange', function () { if (!document.hidden) refresh(); });
})();
