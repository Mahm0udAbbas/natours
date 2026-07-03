/* eslint-env browser */
/* eslint-disable no-alert */
/* eslint-disable */

import axios from 'axios';
import { showAlert } from './alerts';

const login = async (email, password) => {
  try {
    const res = await axios({
      method: 'POST',
      url: '/api/v1/users/login',
      data: {
        email,
        password,
      },
    });
    if (res.data.status === 'success') {
      showAlert('success', 'Logged in successfully');
      window.setTimeout(() => {
        window.location.assign('/');
      }, 1500);
    }
  } catch (err) {
    showAlert('error', err.response?.data?.message || 'Unable to log in');
  }
};

const initializeLogin = () => {
  const loginForm = document.querySelector('.form');
  if (!loginForm) return;

  loginForm.addEventListener('submit', (event) => {
    event.preventDefault();  
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    login(email, password);
  });
};

export default initializeLogin;
