import initializeLogin from './login';
import initializeLogout from './logout';
import initializeMap from './leaflet';
import { initializeUpdateSettings } from './updateSettings';

initializeLogin();
initializeLogout();
initializeUpdateSettings();
initializeMap();
