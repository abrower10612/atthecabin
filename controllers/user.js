const Cabin = require('../models/property');

//gets all properties for the current user
exports.getUserProperties = (req, res, next) => {
  const address = '/main/dashboard/'
  Cabin
      .find({ 
        $or: [{members: req.session.user._id},
          { admins: req.session.user._id }]
      })
      .then(properties => {
        // if 0 or more than 1 property, route to properties page for selection
        if(properties.length !== 1) {
          res.render('properties', {
            pageTitle: 'Property List',
            path: '/',        
            currentUser: req.session.user._id,
            isAdmin: false,
            isAuthenticated: req.session.isLoggedIn,
            properties: properties,
            address: address
          });
        } else {
          // if only one property, automatically route to add reservation page
          // will need to be updated with correct route after routes set up
          res.redirect('../main/dashboard/' + properties[0]._id);
        }
        
      })
    .catch(err => {
        const error = new Error(err);
        error.statusCode = 500;
        next(error);
    }); 
}

//gets all invites for the current user
exports.getInvites = (req, res, next) => {  
  Cabin
    .find({ 
      invites: req.session.user.email
    })
    .populate('admins', "displayName")
    .exec()
    .then(invites => {
      if (!invites) {
        invites = [];
      }
      res.render('users/invites', {
        pageTitle: 'Property Invitations',
        path: '/invites', 
        isAuthenticated: req.session.isLoggedIn,                       
        invites: invites
       });
    })
    .catch(err => {
      const error = new Error(err);
      error.statusCode = 500;
      next(error);
    });  
}

//add an invited user to the property
exports.acceptInvite = (req, res, next) => {  
  Cabin.findById(req.params.propertyId)  
  .then(cabin => {
    if (!cabin) {    
      const err = new Error('Property not found');
      err.statusCode = 404;
      throw error;
    }  
    const idx = cabin.invites.indexOf(req.session.user.email);
    if (idx < 0 ) {
      const err = new Error('Valid invite not found');
      err.statusCode = 401;
      throw error;
    }                
    cabin.members.push(req.session.user._id);          
    cabin.invites.splice(idx, 1);          
    return cabin.save();
  })
  .then(result => {
    res.status(200).json({
      message: 'User added to property.',
      cabin: result
    });
  })
  .catch(err => {
    if (!err.statusCode) err.statusCode = 500;
    next(err);   
  });
}

//removes an invite to a property for the current user
exports.removeInvite = (req, res, next) => {  
  Cabin.findById(req.params.propertyId)  
  .then(cabin => {
    if (!cabin) {    
      const err = new Error('Property not found');
      err.statusCode = 404;
      throw error;
    }  
    const idx = cabin.invites.indexOf(req.session.user.email);    
    if (idx > -1) {    
      cabin.invites.splice(idx, 1);
    }          
    return cabin.save();    
  })
  .then(result => {
    res.status(200).json({
      message: 'Invite removed.',
      cabin: null
    });
  })
  .catch(err => {
    console.log(err);
    if (!err.statusCode) err.statusCode = 500;
    next(err);   
  });
}