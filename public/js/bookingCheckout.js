import apiClient from './apiClient';
import { showAlert } from './alerts';

const initializeBookTour = () => {
  const button = document.querySelector('#book-tour');
  if (!button) return;
  button.addEventListener('click', async () => {
    button.disabled = true;
    button.textContent = 'Reserving...';
    try {
      const response = await apiClient.post(
        '/api/v1/booking/checkout-session',
        {
          departureId: document.querySelector('#departure').value,
          seats: Number(document.querySelector('#seats').value),
        },
      );
      window.location.assign(response.data.data.url);
    } catch (error) {
      showAlert(
        'error',
        error.response?.data?.message || 'Unable to start checkout',
      );
      button.disabled = false;
      button.textContent = 'Book tour now!';
    }
  });
};

export default initializeBookTour;
