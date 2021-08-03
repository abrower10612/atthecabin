const adminController = require('../controllers/admin');
const express = require('express');
const { body } = require('express-validator');
const isAdmin = require('../middleware/is-admin');
const router = express.Router();

//get admin dashboard
router.get('/admin-index/:propertyId', isAdmin, adminController.getAdminDash)

//get create new property page
router.get('/property', adminController.getCreateProperty)

//get all admin properties
router.get('/properties', adminController.getAdminProperties);

//get a single admin property
router.get('/properties/:propertyId', adminController.getProperty);

//manage reservations
router.get('/reservations', adminController.manageReservations);

//update an existing property
router.post('/properties/update/:propertyId', 
  [
    body('name', 'Property name must be between 3 and 20 characters')
      .isString()
      .trim()
      .isLength( { min: 3, max: 20 }),
    body('location', 'Property location must be between 3 and 20 characters')
      .isString()
      .trim()
      .isLength( { min: 3, max: 20 })
  ],
  isAdmin, adminController.updateProperty);

//remove a property
router.post('/properties/delete/:propertyId', isAdmin, adminController.deleteProperty);

router.get('/properties/:propertyId/invite', isAdmin, adminController.inviteUser);

//posts an invite to a new user to a property
router.post('/properties/:propertyId/invite', 
  [
    body('email')
      .isEmail()
      .withMessage('Please enter a valid email address.')
      .normalizeEmail()      
  ], isAdmin, adminController.sendInvite);

//remove a user from a property
router.delete('/properties/:propertyId/remove/:userId', isAdmin, adminController.removeUser);

//post a new property
router.post('/properties', 
  [
    body('name', 'Property name must be between 3 and 20 characters')
      .isString()
      .trim()
      .isLength( { min: 3, max: 20 }),
    body('location', 'Property location must be between 3 and 20 characters')
      .isString()
      .trim()
      .isLength( { min: 3, max: 20 })
  ],
  adminController.postProperty);

//update the approval status of a reservation request
router.patch('/manage-reservation/:propertyId/:reservationId', isAdmin, adminController.manageReservation);


//Loads initial checklist page
router.get('/edit-checklist/:checklistId', adminController.getChecklist);

router.get('/add-checklist/:propertyId', adminController.createChecklist);

//Loads checklists linked to a property
router.get('/checklist/:propertyId', adminController.getPropertyChecklist);

//Endpoint returning checklists as JSON
router.get('/checklist', adminController.getChecklistJSON);

//Endpoint to edit the checklist
router.post('/edit-checklist/:checklistId', adminController.postEditChecklist);

module.exports = router;