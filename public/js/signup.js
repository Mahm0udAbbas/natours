/* eslint-env browser */
/* eslint-disable */

import apiClient from './apiClient';
import { showAlert } from './alerts';

const signup = async (name, email, password, passwordConfirm) => {
  try {
    const res = await apiClient({
      method: 'POST',
      url: '/api/v1/users/signup',
      data: {
        name,
        email,
        password,
        passwordConfirm,
      },
    });

    if (res.data.status === 'success') {
      showAlert('success', 'Account created successfully');
      window.setTimeout(() => {
        window.location.assign('/');
      }, 1500);
    }
  } catch (err) {
    showAlert('error', err.response?.data?.message || 'Unable to sign up');
  }
};

const initializeSignup = () => {
  const signupForm = document.querySelector('.form--signup');
  if (!signupForm) return;

  signupForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const passwordConfirm = document.getElementById('passwordConfirm').value;

    signup(name, email, password, passwordConfirm);
  });
};

export default initializeSignup;
