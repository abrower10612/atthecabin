const reservationController = require('../controllers/reservation');
const propUser = require('../middleware/is-property-user');
const propAdmin = require('../middleware/is-admin');
const express = require('express');
const utils = require('../util/utilities');
const { body } = require('express-validator');
const router = express.Router();

//get by reservation id (in query)
router.get('/:propertyId/:reservationId', propUser, reservationController.getReservation)

//get all reservations for a single property
router.get('/:propertyId', propUser, reservationController.getReservations);

//get all reservations for a single user
router.get('/', reservationController.getUserReservations);

//post a new reservation
router.post('/:propertyId', propUser,
  [
    body('startDate')
      .custom((value, {req}) => {
        if(!utils.isValidDate(new Date(req.body.startDate))) {
          throw new Error('Check-in is an invalid format');
        }
        return true;
      }),
    body('endDate')
      .custom((value, {req}) => {        
        let endDate = new Date(req.body.endDate);
        if(!utils.isValidDate(endDate)) {
          throw new Error('Check-out is an invalid format');
        }
        if(endDate <= new Date(req.body.startDate)) {
          throw new Error('Check-out must be after check-in');
        }
        return true;
      })      
  ], 
  reservationController.postReservation);

//update an existing reservation (date and/or comments)
router.patch('/:propertyId/:reservationId', propUser,
  [
    body('startDate')
      .custom((value, {req}) => {        
        if(!utils.isValidDate(new Date(req.body.startDate))) {
          throw new Error('Check-in is an invalid format');
        }
        return true;
      }),
    body('endDate')
      .custom((value, {req}) => {        
        let endDate = new Date(req.body.endDate);
        if(!utils.isValidDate(endDate)) {
          throw new Error('Check-out is an invalid format');
        }
        if(endDate <= new Date(req.body.startDate)) {
          throw new Error('Check-out must be after check-in');
        }
        return true;
      })       
  ], 
  reservationController.modifyReservation);

//remove a reservation from the system
router.delete('/:reservationId', propUser, reservationController.deleteReservation);

module.exports = router;