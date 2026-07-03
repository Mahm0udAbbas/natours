/* eslint-disable */

import axios from 'axios';
import { showAlert } from './alerts';

const logout = async () => {
  try {
    const response = await axios.post('/api/v1/users/logout');

    if (response.data.status === 'success') {
      window.location.assign('/');
    }
  } catch {
    showAlert('error', 'Unable to log out. Please try again.');
  }
};

const initializeLogout = () => {
  const logoutButton = document.querySelector('.nav__el--logout');
  if (!logoutButton) return;

  logoutButton.addEventListener('click', logout);
};

export default initializeLogout;
