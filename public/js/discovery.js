import apiClient from './apiClient';
import { showAlert } from './alerts';

const initializeDiscovery = () => {
  const button = document.querySelector('#near-me');
  if (!button || !navigator.geolocation) return;
  button.addEventListener('click', () => {
    button.disabled = true;
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const response = await apiClient.get(
            `/api/v1/tours/distances/center/${coords.latitude},${coords.longitude}/unit/km`,
          );
          const distances = new Map(
            response.data.data.data.map((tour) => [tour._id, tour.distance]),
          );
          const container = document.querySelector('.card-container');
          [...container.querySelectorAll('.card')]
            .sort(
              (a, b) =>
                (distances.get(a.dataset.tourId) || Infinity) -
                (distances.get(b.dataset.tourId) || Infinity),
            )
            .forEach((card) => container.append(card));
          showAlert('success', 'Tours sorted by distance from you');
        } catch (error) {
          showAlert(
            'error',
            error.response?.data?.message || 'Location search failed',
          );
        } finally {
          button.disabled = false;
        }
      },
      () => {
        showAlert('error', 'Location permission was not granted');
        button.disabled = false;
      },
    );
  });
};

export default initializeDiscovery;
