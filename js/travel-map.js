(() => {
  const container = document.getElementById('travel-map');
  if (!container || !window.L) return;

  container.replaceChildren();
  const map = L.map(container, {
    scrollWheelZoom: false,
    minZoom: 1,
    maxBounds: [[-85, -180], [85, 180]],
    maxBoundsViscosity: 1
  });
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
    noWrap: true
  }).addTo(map);
  map.fitBounds([[-55, -170], [75, 180]], { padding: [8, 8] });

  // Journey routes will be added once the travel history is supplied.
})();
