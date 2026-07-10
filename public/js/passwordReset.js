/* eslint-env browser */
/* eslint-disable */

import apiClient from './apiClient';
import { showAlert } from './alerts';

const requestPasswordReset = async (email) => {
  try {
    const res = await apiClient({
      method: 'POST',
      url: '/api/v1/users/forgotPassword',
      data: { email },
    });

    if (res.data.status === 'success') {
      showAlert('success', 'Password reset link sent to your email');
    }
  } catch (err) {
    showAlert(
      'error',
      err.response?.data?.message || 'Unable to send password reset email',
    );
  }
};

const resetPassword = async (token, password, passwordConfirm) => {
  try {
    const res = await apiClient({
      method: 'PATCH',
      url: `/api/v1/users/resetPassword/${token}`,
      data: {
        password,
        passwordConfirm,
      },
    });

    if (res.data.status === 'success') {
      showAlert('success', 'Password reset successfully');
      window.setTimeout(() => {
        window.location.assign('/');
      }, 1500);
    }
  } catch (err) {
    showAlert('error', err.response?.data?.message || 'Unable to reset password');
  }
};

export const initializeForgotPassword = () => {
  const forgotPasswordForm = document.querySelector('.form--forgot-password');
  if (!forgotPasswordForm) return;

  forgotPasswordForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const email = document.getElementById('email').value;
    requestPasswordReset(email);
  });
};

export const initializeResetPassword = () => {
  const resetPasswordForm = document.querySelector('.form--reset-password');
  if (!resetPasswordForm) return;

  resetPasswordForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const { token } = resetPasswordForm.dataset;
    const password = document.getElementById('password').value;
    const passwordConfirm = document.getElementById('passwordConfirm').value;
    resetPassword(token, password, passwordConfirm);
  });
};
