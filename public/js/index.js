import initializeLogin from './login';
import initializeSignup from './signup';
import initializeLogout from './logout';
import initializeMap from './leaflet';
import initializePasswordToggle from './passwordToggle';
import {
  initializeForgotPassword,
  initializeResetPassword,
} from './passwordReset';
import { initializeUpdateSettings } from './updateSettings';
import { initializeUpdatePassword } from './updatePassword';

initializeLogin();
initializeSignup();
initializeLogout();
initializeForgotPassword();
initializeResetPassword();
initializePasswordToggle();
initializeUpdateSettings();
initializeUpdatePassword();
initializeMap();
