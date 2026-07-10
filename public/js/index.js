import initializeLogin from './login';
import initializeSignup from './signup';
import initializeLogout from './logout';
import initializeMap from './leaflet';
import { initializeUpdateSettings } from './updateSettings';
import { initializeUpdatePassword } from './updatePassword';

initializeLogin();
initializeSignup();
initializeLogout();
initializeUpdateSettings();
initializeUpdatePassword();
initializeMap();
