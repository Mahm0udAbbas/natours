import apiClient from './apiClient';
import { showAlert } from './alerts';

const setFavoriteState = (button, isFavorite) => {
  button.classList.toggle('is-favorite', isFavorite);
  button.setAttribute('aria-pressed', String(isFavorite));
  button.setAttribute(
    'aria-label',
    isFavorite ? 'Remove from favorites' : 'Add to favorites',
  );
  button.title = isFavorite ? 'Remove from favorites' : 'Add to favorites';
  const text = button.querySelector('.favorite-button__text');
  if (text)
    text.textContent = isFavorite ? 'Saved to favorites' : 'Save to favorites';
};

const updateMatchingButtons = (tourId, isFavorite) => {
  document.querySelectorAll('[data-favorite-button]').forEach((button) => {
    if (button.dataset.tourId === tourId) setFavoriteState(button, isFavorite);
  });
};

const updateEmptyState = () => {
  const grid = document.querySelector('[data-favorites-grid]');
  if (!grid) return;
  const count = grid.querySelectorAll('.card').length;
  const countElement = document.querySelector('[data-favorites-count]');
  const emptyState = document.querySelector('[data-favorites-empty]');
  if (countElement) countElement.textContent = count;
  if (emptyState) emptyState.classList.toggle('is-hidden', count > 0);
};

const initializeFavorites = () => {
  document.addEventListener('click', async (event) => {
    const button = event.target.closest('[data-favorite-button]');
    if (!button) return;

    if (button.dataset.authenticated !== 'true') {
      window.location.assign('/login');
      return;
    }

    const { tourId } = button.dataset;
    const wasFavorite = button.getAttribute('aria-pressed') === 'true';
    button.disabled = true;

    try {
      if (wasFavorite) {
        await apiClient.delete(`/api/v1/users/me/favorites/${tourId}`);
      } else {
        await apiClient.post(`/api/v1/users/me/favorites/${tourId}`);
      }
      updateMatchingButtons(tourId, !wasFavorite);
      if (wasFavorite && button.dataset.removeOnUnfavorite === 'true') {
        button.closest('.card')?.remove();
        updateEmptyState();
      }
      showAlert(
        'success',
        wasFavorite ? 'Removed from favorites' : 'Saved to favorites',
      );
    } catch (error) {
      showAlert(
        'error',
        error.response?.data?.message || 'Could not update favorites',
      );
    } finally {
      button.disabled = false;
    }
  });
};

export default initializeFavorites;
