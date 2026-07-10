/* eslint-env browser */
/* eslint-disable */

const initializePasswordToggle = () => {
  document.querySelectorAll('[data-password-toggle]').forEach((button) => {
    const inputId = button.dataset.passwordToggle;
    const input = document.getElementById(inputId);
    if (!input) return;

    button.addEventListener('click', () => {
      const isHidden = input.type === 'password';
      input.type = isHidden ? 'text' : 'password';
      button.classList.toggle('password-toggle--active', isHidden);
      button.setAttribute(
        'aria-label',
        isHidden ? 'Hide password' : 'Show password',
      );
    });
  });
};

export default initializePasswordToggle;
