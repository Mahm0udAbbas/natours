/* eslint-disable */

import { loadStripe } from '@stripe/stripe-js';
import apiClient from './apiClient';
import { showAlert } from './alerts';

const stripePromise = loadStripe(
  'pk_test_51Trht5Ryf6AEIVxoolwNj0HJghmxfYN5LkmbDzaliZIRYY6jqWcTW5F2UBYHZYhTpdzBmrKCKi3QTWQXdzBDyxkJ00BjR410Xc',
);

const bookTour = async (tourId) => {
  // 1) get the session from the api endpoint
  try {
    const stripe = await stripePromise;
    const res = await apiClient({
      method: 'GET',
      url: `/api/v1/booking/checkout-session/${tourId}`,
    });

    if (res.data.status === 'success') {
      window.location.href = res.data.session.url;
    }
  } catch (err) {
    console.log(err);

    showAlert(
      'error',
      err.response?.data?.message || 'Unable to start checkout',
    );
  }
};

const initializeBookTour = () => {
  const bookTourBtn = document.querySelector('#book-tour');

  if (!bookTourBtn) return;

  bookTourBtn.addEventListener('click', async (event) => {
    event.preventDefault();
    event.target.textContent = 'Processing...';
    const { tourId } = event.target.dataset;

    await bookTour(tourId);
    event.target.textContent = 'Book tour now!';
  });
};

export default initializeBookTour;
