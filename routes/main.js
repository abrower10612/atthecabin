const mainController = require('../controllers/main');
const express = require('express');
const router = express.Router();
const isAuth = require('../middleware/is-auth');

router.get('/', mainController.getIndex);

router.get('/dashboard/:propertyId', mainController.getDashboard);

module.exports = router;