/* eslint-disable */

import apiClient from './apiClient';
import { showAlert } from './alerts';

const updateData = async (data) => {
  try {
    const res = await apiClient({
      url: '/api/v1/users/updateMe',
      method: 'PATCH',
      data,
    });

    if (res.data.status === 'success') {
      const { user } = res.data.data;
      const photoUrl = `/img/users/${user.photo}`;
      const accountPhoto = document.querySelector('.form__user-photo');
      const navPhoto = document.querySelector('.nav__user-img');

      if (accountPhoto) accountPhoto.src = photoUrl;
      if (navPhoto) navPhoto.src = photoUrl;

      showAlert('success', 'Data updated successfully');
    }
  } catch (err) {
    showAlert('error', err.response.data.message || 'Error updating data');
  }
};

export const initializeUpdateSettings = () => {
  const userDataForm = document.querySelector('.form-user-data');
  if (!userDataForm) return;
  userDataForm.addEventListener('submit', (event) => {
    event.preventDefault();

    const form = new FormData();
    const photoInput = document.getElementById('photo');

    form.append('email', document.getElementById('email').value);
    form.append('name', document.getElementById('name').value);
    if (photoInput.files.length > 0) {
      form.append('photo', photoInput.files[0]);
    }

    updateData(form);
  });
};
