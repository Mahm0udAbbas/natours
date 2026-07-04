import initializeLogin from './login';
import initializeLogout from './logout';
import initializeMap from './leaflet';
import { initializeUpdateSettings } from './updateSettings';
import { initializeUpdatePassword } from './updatePassword';

initializeLogin();
initializeLogout();
initializeUpdateSettings();
initializeUpdatePassword();
initializeMap();
