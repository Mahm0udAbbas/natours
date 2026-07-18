import apiClient from './apiClient';
import { showAlert } from './alerts';

const initializeReviews = () => {
  const form = document.querySelector('.review-form');
  if (form) {
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const payload = {
        review: document.querySelector('#review-text').value,
        rating: Number(document.querySelector('#review-rating').value),
      };
      try {
        const url = form.dataset.reviewId
          ? `/api/v1/reviews/${form.dataset.reviewId}`
          : `/api/v1/tours/${form.dataset.tourId}/reviews`;
        await apiClient({
          method: form.dataset.reviewId ? 'PATCH' : 'POST',
          url,
          data: payload,
        });
        window.location.reload();
      } catch (error) {
        showAlert(
          'error',
          error.response?.data?.message || 'Unable to save review',
        );
      }
    });
  }
  document.querySelectorAll('.delete-review').forEach((button) => {
    button.addEventListener('click', async () => {
      if (!window.confirm('Delete this review?')) return;
      await apiClient.delete(`/api/v1/reviews/${button.dataset.reviewId}`);
      window.location.reload();
    });
  });
};

export default initializeReviews;
