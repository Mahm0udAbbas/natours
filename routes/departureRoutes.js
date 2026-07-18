const express = require('express');
const { protect, restrictTo } = require('../controllers/authController');
const controller = require('../controllers/departureController');
const validators = require('../validators/departureValidators');

const router = express.Router({ mergeParams: true });

router
  .route('/')
  .get(validators.validateDepartureParams, controller.listDepartures)
  .post(
    protect,
    restrictTo('admin', 'lead-guide'),
    validators.validateCreateDeparture,
    controller.createDeparture,
  );
router
  .route('/:departureId')
  .patch(
    protect,
    restrictTo('admin', 'lead-guide'),
    validators.validateUpdateDeparture,
    controller.updateDeparture,
  )
  .delete(
    protect,
    restrictTo('admin', 'lead-guide'),
    validators.validateDepartureParams,
    controller.deleteDeparture,
  );

module.exports = router;
