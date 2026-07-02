/* eslint-env browser */
/* global L */

const mapElement = document.getElementById('map');

if (mapElement) {
  const locations = JSON.parse(mapElement.dataset.locations || '[]');

  if (locations.length > 0) {
    const map = L.map(mapElement, {
      scrollWheelZoom: false,
      closePopupOnClick: false,
    });

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    const bounds = L.latLngBounds();
    const tourMarker = L.divIcon({
      className: 'marker',
      iconSize: [32, 40],
      iconAnchor: [16, 40],
      popupAnchor: [0, -40],
    });

    locations.forEach((location) => {
      const [longitude, latitude] = location.coordinates;
      const point = [latitude, longitude];

      const popup = document.createElement('p');
      popup.textContent = `Day ${location.day}: ${location.description}`;

      L.marker(point, {
        icon: tourMarker,
        title: location.description,
        alt: location.description,
      })
        .addTo(map)
        .bindPopup(popup, {
          autoOpen: true,
          // closeButton: false,
          closeOnClick: false,
        })
        .openPopup();
      bounds.extend(point);
    });

    map.fitBounds(bounds, {
      padding: [80, 80],
      maxZoom: 12,
    });
  }
}
