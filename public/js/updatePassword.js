/* eslint-disable */

import apiClient from './apiClient';
import { showAlert } from './alerts';

const updatePassword = async (
  currentPassword,
  newPassword,
  confirmPassword,
) => {
  try {
    const res = await apiClient({
      method: 'PATCH',
      url: '/api/v1/users/updatePassword',
      data: {
        currentPassword,
        password: newPassword,
        passwordConfirm: confirmPassword,
      },
    });

    if (res.data.status === 'success') {
      showAlert('success', 'Password updated successfully');
      return true;
    }
  } catch (err) {
    showAlert(
      'error',
      err.response?.data?.message || 'Error updating password',
    );
  }

  return false;
};

export const initializeUpdatePassword = () => {
  const updatePasswordForm = document.querySelector('.form-user-settings');

  if (!updatePasswordForm) return;

  updatePasswordForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    document.querySelector('.btn--save-password').textContent = 'Updating...';
    const currentPassword = document.getElementById('password-current').value;
    const newPassword = document.getElementById('password').value;
    const passwordConfirm = document.getElementById('password-confirm').value;
    const updated = await updatePassword(
      currentPassword,
      newPassword,
      passwordConfirm,
    );
    console.log(updated);

    if (updated) updatePasswordForm.reset();
    document.querySelector('.btn--save-password').textContent = 'save pasword';
  });
};
