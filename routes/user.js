const userController = require('../controllers/user');
const isAuth = require('../middleware/is-auth');
const isUser = require('../middleware/is-property-user');

const express = require('express');
const router = express.Router();

//get all user properties
router.get('/list', isAuth, userController.getUserProperties);

//get all invites for current user
router.get('/invites', isAuth, userController.getInvites);

//accept an invite to a property
router.post('/invites/:propertyId/accept', isAuth, userController.acceptInvite);

//accept an invite to a property
router.post('/invites/:propertyId/decline', isAuth, userController.removeInvite);

module.exports = router;