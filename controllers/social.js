const Cabin = require('../models/property');
const Photo = require('../models/social-post');
const { validationResult } = require('express-validator');

// get page to upload an image
exports.getAddPhoto = (req, res, next) => {
  const propertyId = req.params.propertyId;
  res.render('social/add-post', {
    path: '/add-post',
    pageTitle: 'Add Photo',
    isAuthenticated: req.session.isLoggedIn,
    propertyId: propertyId,
    errorMessage: ''
  });
};

// post new photo
exports.postPhoto = (req, res, next) => {
  const image = req.file;
  const description = req.body.description;
  const errors = validationResult(req);
  const propertyId = req.body.propertyId;
  const imageUrl = image.path;

  Cabin.findById(propertyId)
  .then(cabin => {
    const imageArray = cabin.imageUrls;
    if (!cabin) {
      const error = new Error('Property not found');
      error.statusCode = 404;
      throw error;
    }
    imageArray.map(url => {
      if (url == imageUrl) {
        const error = new Error('Image already exists for this property')
        error.statusCode = 500;
        throw error;
      }
    })
    cabin.imageUrls.push(imageUrl);
    return cabin.save();
  })

  if (!errors.isEmpty()) {
    return res.status(422).render('social/add-post/:propertyId', {
      path: 'add-post/:propertyId',
      pageTitle: 'Add Photo',
      editing: false,
      hasError: true,
      photo: {
        description: description
      },
      errorMessage: errors.array()[0].msg,
      validationErrors: errors.array(),
      propertyId: propertyId
    });
  }

  if (errors.isEmpty()) {
        res.render('social/add-post', {
          path: `/add-post/${propertyId}`,
          pageTitle: 'Add Photo',
          isAuthenticated: req.session.isLoggedIn,
          propertyId: propertyId,
          errorMessage: ''
        });
  }
}