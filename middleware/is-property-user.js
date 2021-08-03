const Property = require('../models/property');

module.exports = (req, res, next) => {
  Property
    .find({
      _id: req.params.propertyId,
      $or:[
        { members: req.session.user._id }, 
        { admins: req.session.user._id }
      ]   
    })    
    .then(property => {
      if (!property) {
        const error = new Error("Authorization failed.");
        error.statusCode = 401;
        throw error;
      }
      next();
    })
    .catch(err => {
      if (!err.statusCode) err.statusCode = 500;
      next(err);      
    });  
}