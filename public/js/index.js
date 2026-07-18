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
import initializeBookTour from './bookingCheckout';
import initializeAccountActions from './accountActions';
import initializeReviews from './reviews';
import initializeDiscovery from './discovery';
import initializeStaffActions from './staffActions';
import initializeNavigation from './navigation';
import initializeReviewsCarousel from './reviewsCarousel';

initializeLogin();
initializeSignup();
initializeLogout();
initializeForgotPassword();
initializeResetPassword();
initializePasswordToggle();
initializeUpdateSettings();
initializeUpdatePassword();
initializeMap();
initializeBookTour();
initializeAccountActions();
initializeReviews();
initializeDiscovery();
initializeStaffActions();
initializeNavigation();
initializeReviewsCarousel();
