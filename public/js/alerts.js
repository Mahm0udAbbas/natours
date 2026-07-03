/* eslint-disable */

export const hideAlert = () => {
  const alertElement = document.querySelector('.alert');
  if (alertElement) alertElement.parentElement.removeChild(alertElement);
};

export const showAlert = (type, message, time = 5) => {
  hideAlert();
  const markup = `<div class="alert alert--${type}">${message}</div>`;
  document.querySelector('body').insertAdjacentHTML('afterbegin', markup);
  window.setTimeout(hideAlert, time * 1000);
};
