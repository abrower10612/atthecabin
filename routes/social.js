const socialController = require('../controllers/social');
const express = require('express');
const router = express.Router();
const isAuth = require('../middleware/is-auth');
const isAdmin = require('../middleware/is-admin')

//get photo upload page
router.get('/add-post/:propertyId', isAuth, isAdmin, socialController.getAddPhoto);

// post new photo
router.post('/postPhoto', isAuth, isAdmin, socialController.postPhoto)

// //get all photos
// router.get('/photos', socialController.getPhotos);

// //get single photo
// router.get('/:photoId', socialController.getPhoto);

module.exports = router;