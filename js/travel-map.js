(async () => {
  const container = document.getElementById('travel-map');
  if (!container || !window.L) return;
  const preview = container.dataset.preview === 'true';
  let data;
  try {
    const response = await fetch('data/flights.json', { cache: 'no-cache' });
    if (!response.ok) throw new Error('Flight data unavailable');
    data = await response.json();
  } catch {
    container.textContent = 'The journey map could not load. Please refresh to try again.';
    return;
  }
  const airports = data.airports;
  const flights = data.flights;
  const count = document.getElementById('flight-count');
  if (count) count.textContent = `Flights · ${flights.length}`;
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  // Spherical interpolation approximates the shortest path, not an actual flight track.
  function greatCircle(start, end) {
    const radians = Math.PI / 180;
    const vector = ([lat, lon]) => [Math.cos(lat * radians) * Math.cos(lon * radians), Math.cos(lat * radians) * Math.sin(lon * radians), Math.sin(lat * radians)];
    const a = vector(start), b = vector(end);
    const angle = Math.acos(Math.max(-1, Math.min(1, a.reduce((sum, v, i) => sum + v * b[i], 0))));
    let previousLongitude = start[1];
    return Array.from({ length: 181 }, (_, i) => {
      const t = i / 180;
      const scaleA = Math.sin((1 - t) * angle) / Math.sin(angle);
      const scaleB = Math.sin(t * angle) / Math.sin(angle);
      const [x, y, z] = a.map((v, j) => scaleA * v + scaleB * b[j]);
      let longitude = Math.atan2(y, x) / radians;
      while (longitude - previousLongitude > 180) longitude -= 360;
      while (longitude - previousLongitude < -180) longitude += 360;
      previousLongitude = longitude;
      return [Math.atan2(z, Math.hypot(x, y)) / radians, longitude];
    });
  }

  container.replaceChildren();
  const map = L.map(container, {
    scrollWheelZoom: false,
    zoomControl: !preview,
    dragging: !preview,
    touchZoom: !preview,
    doubleClickZoom: !preview,
    boxZoom: !preview,
    keyboard: !preview,
    zoomSnap: 0.25,
    minZoom: 1
  }).setView([35, 180], 2);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19
  }).addTo(map);

  const hoverCard = document.createElement('div');
  hoverCard.className = 'flight-hover-card';
  hoverCard.hidden = true;
  hoverCard.setAttribute('role', 'status');
  container.append(hoverCard);
  const allRoutes = L.featureGroup().addTo(map);
  flights.forEach(flight => {
    flight = Object.fromEntries(Object.entries(flight).map(([key, value]) => [key, value == null ? null : escape(value)]));
    const date = new Date(`${flight.date}T12:00:00Z`).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
    const points = greatCircle(airports[flight.from].point, airports[flight.to].point);
    L.polyline(points, { color: '#2474c6', weight: preview ? 2 : 3, opacity: .9, interactive: false }).addTo(allRoutes);
    if (!preview) {
      const detail = `<div class="flight-detail"><strong>${flight.number} · ${flight.airline}</strong><br>${date}<br>${flight.from} → ${flight.to}<dl><dt>Aircraft</dt><dd>${flight.aircraft || 'Not yet verified'}</dd><dt>Registration</dt><dd>${flight.registration || 'Not yet verified'}</dd><dt>Departure</dt><dd>${flight.departure || 'Not yet verified'}</dd><dt>Arrival</dt><dd>${flight.arrival || 'Not yet verified'}</dd>${flight.seat ? `<dt>Seat</dt><dd>${flight.seat}</dd>` : ''}</dl><small>Approximate great-circle path${flight.departure ? ' · Reported actual times' : ''}</small></div>`;
      // A wider invisible path makes the thin route easy to hover, tap, or focus.
      const target = L.polyline(points, { weight: 20, opacity: 0, color: '#2474c6' }).addTo(map);
      const showDetails = () => { hoverCard.innerHTML = detail; hoverCard.hidden = false; };
      const hideDetails = () => { hoverCard.hidden = true; };
      if (window.matchMedia('(hover: hover)').matches) {
        target.on('mouseover', showDetails);
        target.on('mouseout', hideDetails);
      }
      if (window.matchMedia('(hover: none)').matches) target.bindPopup(detail);
      const element = target.getElement();
      element.setAttribute('tabindex', '0');
      element.setAttribute('role', 'button');
      element.setAttribute('aria-label', `Flight ${flight.number}, ${flight.from} to ${flight.to}. Focus for details.`);
      element.addEventListener('focus', showDetails);
      element.addEventListener('blur', hideDetails);
      element.addEventListener('keydown', event => {
        event.stopPropagation();
        if (event.key === 'Escape') { hideDetails(); map.closePopup(); }
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          showDetails();
        }
      });
    }
  });
  Object.entries(airports).forEach(([code, airport]) => {
    const marker = L.circleMarker(airport.point, { radius: preview ? 3 : 5, color: '#2474c6', fillColor: '#fff', fillOpacity: 1, weight: 2, interactive: !preview }).addTo(map);
    if (!preview) marker.bindTooltip(`${airport.name} (${code})`);
  });
  const showAll = () => {
    hoverCard.hidden = true;
    map.closePopup();
    if (!flights.length) { map.setView([30, 180], 2); return; }
    map.fitBounds(allRoutes.getBounds(), { padding: preview ? [25, 25] : [45, 45], maxZoom: 5 });
  };
  document.getElementById('show-all-journeys')?.addEventListener('click', showAll);
  showAll();
})();
