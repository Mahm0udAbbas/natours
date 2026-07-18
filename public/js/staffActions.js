import apiClient from './apiClient';
import { showAlert } from './alerts';

const reloadAfter = async (request, message) => {
  try {
    await request();
    showAlert('success', message);
    window.setTimeout(() => window.location.reload(), 500);
  } catch (error) {
    showAlert('error', error.response?.data?.message || 'Action failed');
  }
};

const initializeStaffActions = () => {
  const tourForm = document.querySelector('#tour-create');
  if (tourForm) {
    tourForm.addEventListener('submit', (event) => {
      event.preventDefault();
      reloadAfter(
        () =>
          apiClient.post('/api/v1/tours', {
            name: document.querySelector('#tour-name').value,
            duration: Number(document.querySelector('#tour-duration').value),
            maxGroupSize: Number(
              document.querySelector('#tour-group-size').value,
            ),
            difficulty: document.querySelector('#tour-difficulty').value,
            price: Number(document.querySelector('#tour-price').value),
            summary: document.querySelector('#tour-summary').value,
            description: document.querySelector('#tour-description').value,
            startLocation: {
              type: 'Point',
              coordinates: [
                Number(document.querySelector('#tour-longitude').value),
                Number(document.querySelector('#tour-latitude').value),
              ],
              description: document.querySelector('#tour-location').value,
            },
          }),
        'Tour created',
      );
    });
  }
  const userForm = document.querySelector('#user-create');
  if (userForm) {
    userForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const password = document.querySelector('#staff-user-password').value;
      reloadAfter(
        () =>
          apiClient.post('/api/v1/users', {
            name: document.querySelector('#staff-user-name').value,
            email: document.querySelector('#staff-user-email').value,
            password,
            passwordConfirm: password,
            role: document.querySelector('#staff-user-role').value,
          }),
        'User created',
      );
    });
  }
  const departureForm = document.querySelector('#departure-create');
  if (departureForm) {
    departureForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const tourId = document.querySelector('#departure-tour').value;
      reloadAfter(
        () =>
          apiClient.post(`/api/v1/tours/${tourId}/departures`, {
            startDate: document.querySelector('#departure-date').value,
            capacity: Number(
              document.querySelector('#departure-capacity').value,
            ),
          }),
        'Departure created',
      );
    });
  }
  document.querySelectorAll('.staff-user-role').forEach((select) => {
    select.addEventListener('change', () =>
      reloadAfter(
        () =>
          apiClient.patch(`/api/v1/users/${select.dataset.id}`, {
            role: select.value,
          }),
        'Role updated',
      ),
    );
  });
  document.querySelectorAll('.staff-save-tour').forEach((button) => {
    button.addEventListener('click', () => {
      const input = document.querySelector(
        `.staff-tour-price[data-id="${button.dataset.id}"]`,
      );
      reloadAfter(
        () =>
          apiClient.patch(`/api/v1/tours/${button.dataset.id}`, {
            price: Number(input.value),
          }),
        'Tour updated',
      );
    });
  });
  const actions = [
    [
      '.staff-refund',
      (el) => apiClient.post(`/api/v1/booking/${el.dataset.id}/refund`),
      'Booking refunded',
    ],
    [
      '.staff-delete-review',
      (el) => apiClient.delete(`/api/v1/reviews/${el.dataset.id}`),
      'Review deleted',
    ],
    [
      '.staff-delete-tour',
      (el) => apiClient.delete(`/api/v1/tours/${el.dataset.id}`),
      'Tour deleted',
    ],
    [
      '.staff-delete-departure',
      (el) =>
        apiClient.delete(
          `/api/v1/tours/${el.dataset.tourId}/departures/${el.dataset.id}`,
        ),
      'Departure deleted',
    ],
  ];
  actions.forEach(([selector, request, message]) => {
    document.querySelectorAll(selector).forEach((element) => {
      element.addEventListener('click', () => {
        if (window.confirm('Continue with this action?')) {
          reloadAfter(() => request(element), message);
        }
      });
    });
  });
};

export default initializeStaffActions;
