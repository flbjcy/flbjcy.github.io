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
    var audit = read('https://raw.githubusercontent.com/flbjcy/find-my-charlie/main/lib/reviewed-status.json?minute=' + Math.floor(Date.now() / 60000)).then(function (data) {
      var count = data.cumulativeReviewedCount;
      var date = new Date(data.checkedAt);
      if (!reviewed || !Number.isFinite(count) || !Number.isFinite(data.threadCount) || isNaN(date.getTime())) throw new Error('Invalid review status');
      reviewed.textContent = count.toLocaleString();
      reviewed.title = 'Unique Reddit comments reviewed across all saved checks. Repeated checks and edits count once.';
      if (reviewDate) reviewDate.textContent = 'Latest Reddit check: ' + date.toLocaleString('en-US', {timeZone: 'America/New_York', month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit'}) + ' ET · ' + data.reviewedCount + ' comments checked across ' + data.threadCount + ' tracked threads this run. ' + (data.fullCoverage ? 'Full review.' : 'Incremental review; older/deep coverage remains incomplete.');
    }).catch(function () {
      if (reviewDate && reviewed.textContent === '—') reviewDate.textContent = 'Review status is temporarily unavailable; retrying automatically.';
    });
    Promise.all([activity, audit]).finally(function () { pending = false; });
  }
  refresh();
  setInterval(function () { if (!document.hidden) refresh(); }, 60000);
  document.addEventListener('visibilitychange', function () { if (!document.hidden) refresh(); });
})();
