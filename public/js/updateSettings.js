/* eslint-disable */

import axios from 'axios';
import { showAlert } from './alerts';

const updateData = async (data) => {
  try {
    const res = await axios({
      url: '/api/v1/users/updateMe',
      method: 'PATCH',
      data,
    });

    if (res.data.status === 'success') {
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
    const email = document.getElementById('email').value;
    const name = document.getElementById('name').value;
    updateData({ email, name });
  });
};
