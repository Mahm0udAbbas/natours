import apiClient from './apiClient';
import { showAlert } from './alerts';

const initializeAccountActions = () => {
  const button = document.querySelector('#deactivate-account');
  if (!button) return;
  button.addEventListener('click', async () => {
    if (!window.confirm('Deactivate your account? This cannot be undone here.'))
      return;
    try {
      await apiClient.delete('/api/v1/users/deleteMe');
      await apiClient.post('/api/v1/users/logout');
      window.location.assign('/');
    } catch (error) {
      showAlert(
        'error',
        error.response?.data?.message || 'Unable to deactivate account',
      );
    }
  });
};

export default initializeAccountActions;
