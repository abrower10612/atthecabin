const Cabin = require('../models/property');
const Reservation = require('../models/reservation');
const User = require('../models/user');
const ChecklistMaster = require('../models/checklist-master');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const ROOTURL = process.env.HEROKU_ORIGIN || "http://localhost:5000";
const { validationResult } = require("express-validator");
const { name } = require('ejs');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_ACCOUNT, 
    pass: process.env.EMAIL_PWD
  }
});

// open admin dashboard
exports.getAdminDash = (req, res, next) => {
  const images = [{"imageUrl": '/images/lake.jpg'}, {"imageUrl": '/images/log.jpg'}, {"imageUrl": '/images/log-cabin.jpg'}, {"imageUrl": '/images/cabin.jpg'}, {"imageUrl": '/images/dawn.jpg'}];
  Cabin.findById(req.params.propertyId)
    .then(property => {
      res.render('admin/admin-index', {
        pageTitle: 'Admin Dashboard',
        path: '/admin/admin-dash',
        currentUser: req.session.user_id,
        isAdmin: true,
        isAuthenticated: req.session.isLoggedIn,
        images: images,
        name: property.name,
        location: property.location,
        propertyId: property._id
      })
    })
}

// open create new property
exports.getCreateProperty = (req, res, next) => {
  res.render('admin/add-property', {
    pageTitle: 'Create New Property',
    path: '/admin/add-property',
    errorMessage: '',
    validationErrors: [],
    currentUser: req.session.user._id,
    property: null,
    edit: false
  })
}

// open property list for admins
exports.getAdminProperties = (req, res, next) => {
  const address = '/admin/admin-index/'
  Cabin
      .find({ 
        admins: req.session.user._id
      })
      .then(properties => {
          res.render('properties', {
            pageTitle: 'Property List',
            path: '/properties',        
            currentUser: req.session.user._id,
            isAdmin: true,
            isAuthenticated: req.session.isLoggedIn,
            properties: properties,
            address: address
          });
      })
};

//open a list of pending reservations to approve/reject
exports.manageReservations = (req, res, next) => {              
  Cabin.find({ 
    admins: req.session.user._id      
  })    
  .then(properties => {    
    return ids = properties.map(x => x._id);
  })
  .then(pIds => {    
    return Reservation.find({
      status: "pending",
      property: { $in: pIds }
    })    
    .populate('property')
    .populate('user')
    .sort('startDate')
    .exec()   
  })       
  .then(reservations => {      
    res.render('admin/reservations', {            
      pageTitle: 'Manage Reservations',
      path: '/admin',
      reservations: reservations,        
      isAuthenticated: req.session.isLoggedIn,      
      isAdmin: true        
    });  
  })
  .catch(err => {      
    const error = new Error(err);
    error.statusCode = 500;
    next(error);
  });   
};

//get properties managed by this user
exports.getProperties = (req, res, next) => {        
  try {    
    Cabin
      .find({ 
        admins: req.session.user._id     
      })  
      .then(properties => {                               
        res.status(200).json({ properties });          
      })      
      .catch(err => {
        const error = new Error(err);
        error.statusCode = 500;
        next(error);
      });   
  } catch(err) {
    console.log(err);
    const error = new Error(err);
    error.statusCode = 500;
    throw(error);
  }  
};

//create a new property
exports.postProperty = (req, res, next) => {
  //check validation in middleware for valid fields
  const errors = validationResult(req);   
  if(!errors.isEmpty()) {
    return res.status(422).render('admin/add-property', {
      pageTitle: 'Create New Property',
      path: '/admin/add-property',
      errorMessage: errors.array()[0].msg,
      validationErrors: errors.array(),
      currentUser: req.session.user._id,        
      property: {
        name: req.body.name,
        location: req.body.location,
        admins: [req.session.user._id],
        members: [],
        imageUrls: req.body.imageUrls || []
      },
      edit: false
    });
  } 
  let cabin = new Cabin({    
    name: req.body.name,
    location: req.body.location,
    admins: [req.session.user._id],
    members: [],
    imageUrls: req.body.imageUrls || []
  });  
  cabin
    .save()
    .then(result => {      
      res.status(200).redirect('/admin/properties');
    })
    .catch(err => {  
      console.log(err);         
      if (!err.statusCode) err.statusCode = 500;
      next(err);    
    });
};


//fetch a property by the property id
exports.getProperty = (req, res, next) => {
  Cabin.getPropertyById(req.params.propertyId, req.session.user._id)
  .then(cabin => {
    res.render('admin/add-property', {
      pageTitle: 'Edit Property',
      path: '/admin/edit-property',
      errorMessage: '',
      validationErrors: [],
      currentUser: req.session.user._id,
      property: cabin,
      edit: true
    })
  })
  .catch(err => {
    const error = new Error(err);
    error.statusCode = 500;
    next(error);
  });
};

//updates an existing property
exports.updateProperty = (req, res, next) => {          
  const errors = validationResult(req);  
  if(!errors.isEmpty()) {        
    return res.status(422).render('admin/add-property', {
      pageTitle: 'Edit Property',
      path: '/admin/edit-property',
      errorMessage: errors.array()[0].msg,
      validationErrors: errors.array(),
      currentUser: req.session.user._id,        
      property: {
        _id: req.params.propertyId,
        name: req.body.name,
        location: req.body.location,
        admins: [req.session.user._id],
        members: [],
        imageUrls: req.body.imageUrls || []
      },
      edit: true
    }); 
  }        
  Cabin.getPropertyById(req.params.propertyId, req.session.user._id)
  .then(cabin => {    
    cabin.name = req.body.name;
    cabin.location = req.body.location;  
    //this imageUrls bit probably needs some work
    cabin.imageUrls = req.body.imageUrls || [];       
    return cabin.save();
  })
  .then(result => {    
    res.status(200).redirect(`/admin/admin-index/${req.params.propertyId}`);
  })
  .catch(err => {
    console.log(err);
    if (!err.statusCode) err.statusCode = 500;
    next(err);    
  });
};

//remove a property
exports.deleteProperty = (req, res, next) => {  
  Cabin.getPropertyById(req.params.propertyId, req.session.user._id)
  .then(cabin => {    
    const idx = cabin.admins.indexOf(req.session.user._id);
    console.log(idx);
    if(idx > -1) {
      cabin.admins.splice(idx, 1);
    }
    if (cabin.admins.length > 0) { //update
      return cabin.save();        
    } else { //no admins left, so delete
      return Cabin.findByIdAndDelete(cabin._id);
    }
  })
  .then(result => {
    res.status(200).redirect('/admin/properties');
  })
  .catch(err => {
    if (!err.statusCode) err.statusCode = 500;
    next(err);    
  });
}


//show page to invite a new user
exports.inviteUser = (req, res, next) => {
  try {
    const errors = validationResult(req);     
    if(!errors.isEmpty()) {
      throw new Error("Unauthorized access"); 
    } 
    Cabin.getPropertyById(req.params.propertyId, req.session.user._id)
    .then(cabin => {          
      res.render('admin/invite', {
        pageTitle: 'Invite User',
        path: '/admin/invite',
        errorMessage: '',
        validationErrors: [],
        currentUser: req.session.user._id,
        email: '',
        property: cabin
      })
    })
    .catch(err => {      
      if (!err.statusCode) err.statusCode = 500;
      next(err);
    });
  } catch (err) {    
    if (!err.statusCode) err.statusCode = 500;
    next(err);
  }
}

//invite a new user
exports.sendInvite = (req, res, next) => {
  //ensure valid inputs through validation  
  const pId = req.params.propertyId;
  const userId = req.session.user._id;
  const email = req.body.email;
  const cabin = req.body.cabin;
  const errors = validationResult(req);  
  if(!errors.isEmpty()) {
    return res.status(422).render('admin/invite', {
      pageTitle: 'Invite User',
      path: '/admin/invite',
      errorMessage: errors.array()[0].msg,
      validationErrors: errors.array(),
      currentUser: req.session.user._id,
      email: '',
      property: {name: cabin, _id: pId }
    });
  }
  crypto.randomBytes(32, (err, buffer) => {
    if(err) {
      throw err;      
    }        
    let propertyName;
    let userName;        
    Cabin.getPropertyById(pId, userId)
    .then(cabin => {      
      propertyName = cabin.name;
      cabin.invites.push(email);      
      return cabin.save();
    })
    .then(result => {      
      return User.findById(userId);
    })
    .then(user => {      
      if (!user) {
        const err = new Error('User not found');
        err.statusCode = 404;
        throw error;
      }      
      userName = `${user.firstName} ${user.lastName}`;                  
      //send email to specified address with a new invite token      
      transporter.sendMail({
        to: email,
        from: 'invites@atTheCabin.com',
        subject: `${userName} invites you to their cabin.'`,
        html: `<p>${userName} has invited you to join their group on 
        <a href='${ROOTURL}'>@theCabin</a> for their property entitled
        ${propertyName}. <br><a href='${ROOTURL}user/invites'>Click here to accept their invitation</a>.</p>`
      });      
      res.status(200).redirect(`/admin/admin-index/${pId}`);
    })
    .catch(err => {
      if (!err.statusCode) err.statusCode = 500;
      next(err);    
    });        
  });
}

//remove a user from the property
exports.removeUser = (req, res, next) => {
  Cabin.getPropertyById(req.params.propertyId, req.session.user._id)
  .then(cabin => {
    const idx = cabin.members.indexOf(req.params.userId);
    if(idx > -1) {
      cabin.members.splice(idx, 1);      
    } 
    return cabin.save();
  })
  .then(result => {
    res.status(200).json({
      message: 'Property has been updated.',
      cabin: result
    });
  })
  .catch(err => {
    if (!err.statusCode) err.statusCode = 500;
    next(err);   
  });
}

//Approves or rejects(and deletes) a reservation based on the reservationId in the params
exports.manageReservation = (req, res, next) => {  
  const errors = validationResult(req);
  if(!errors.isEmpty()) {
    return res.status(422).json( { errors });
  }    
  const status = req.body.status;
  let myReservation;
  Reservation.findById(req.params.reservationId)
    .populate('user')
    .populate('property')
    .exec()
    .then(reservation => {
      if(!reservation) {
        const err = new Error('Reservation not found');
        err.statusCode = 404;
        throw error;
      }
      myReservation = reservation;         
      if (status === 'confirmed') {
        reservation.status = status;        
        return reservation.save();
      } else if (req.body.status === 'declined') {
        return Reservation.findByIdAndRemove(req.params.reservationId);
      } else {
        const error = new Error("Invalid reservation status received.");
        error.statusCode = 422;
        throw error;
      } 
    })    
    .then(result => {
      //send result      
      res.status(200).json({ 
        message: `Your reservation has been ${status}.`, 
        reservation: result
      });
      //notify user of status
      transporter.sendMail({
        to: myReservation.user.email,
        from: 'reservations@atTheCabin.com',
        subject: `Your reservation request has been ${status}`,
        html: `<p>Your reservation request for property ${myReservation.property.name}, ${myReservation.property.location} has been ${status} for the following dates:
        ${myReservation.startDate.toLocaleDateString()} to ${myReservation.endDate.toLocaleDateString()}.`        
      });
    })    
    .catch(err => {
      if (!err.statusCode) err.statusCode = 500;
      next(err);
    });
};
//add an invited user to the property
exports.addUser = (req, res, next) => {
  const token = req.params.inviteToken;  
  Cabin 
  .findOne({ 
    invites: token      
  })
  .then(cabin => {
    if (!cabin) {    
      const err = new Error('Property not found');
      err.statusCode = 404;
      throw error;
    }              
    cabin.members.push(req.params.newUserId);  
    const idx = cabin.invites.indexOf(token); //remove token
    console.log(idx);          
    if(idx > -1) {
      cabin.invites.splice(idx, 1);      
    }  
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

//checklist auth

exports.postAddChecklist = (req, res, next) => {
  const title = req.body.title;
  const description = req.body.description;
  res.render('admin/edit-checklist', {
      pageTitle: 'Add New Task',
      path: '/admin/edit-checklist',
      editing: false,
      isAuthenticated: req.session.LoggedIn,
      currentUser: req.session.user
  });
  const checklist = new ChecklistMaster({
      title: title, 
      description: description 
  });
  Cabin.getPropertyById(req.params.propertyId, req.userId)
    .save()
    .then(cabin => {
          cabin.checklist.push(checklist);
          console.log('New Task Created');
          res.redirect('/checklists/checklist')
      })
      .catch(err => {
          console.log(err);
      });

};

exports.getChecklist = (req, res, next) => {
  const editMode = req.query.edit;
  // if (!editMode) {
  //   return res.redirect('/');
  // }
  const propId = req.params.propertyId;
  Cabin.findById(propId)
    .then(checklist => {
      // if (!checklist) {
      //   return res.redirect('/');
      // }
      res.render('admin/edit-checklist', {
        pageTitle: 'Edit Checklist',
        path: '/admin/edit-checklist',
        currentUser: req.session.user,
        isAuthenticated: req.session.LoggedIn,
        editing: editMode
      });
    })
    .catch(err => console.log(err));
};

exports.getPropertyChecklist = (req, res, next) => {
  let propertyName;
  const propId = req.params.propertyId;
  Cabin.findById(propId)
    .then(property => {
      if (!property) {
        const error = new Error('Property not found');
        error.statusCode = 500;
        throw error;
      }
      return property.name;
    })
    .then( (propName) => {
      propertyName = propName;
      return ChecklistMaster.find({
        property: propId
      })
      .then(checklist => {
        console.log('1');
        // if (!checklist) {
        //   return res.redirect('/');
        // }
        res.render('admin/checklist-list', {
          pageTitle: 'Property Checklist',
          path: '/admin/edit-checklist',
          currentUser: req.session.user,
          isAuthenticated: req.session.LoggedIn,
          isAdmin: true,
          checklist: checklist,
          propertyName: propertyName,
          propertyId: propId
        });
      })
      .catch(err => {
        if (!err.statusCode) {
          err.statusCode = 500;
        }
        next(err);
      })
    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    })
};
exports.getChecklistJSON = (req, res, next) => {
  const editMode = req.query.edit;
  // if (!editMode) {
  //   return res.redirect('/');
  // }
  const propId = req.params.propertyId;
  Cabin.findById(propId)
    .then(checklist => {
      // if (!checklist) {
      //   return res.redirect('/');
      // }
      
    })
    .catch(err => console.log(err));
};

exports.createChecklist = (req, res, next) => {
  const propId = req.params.propertyId;
  Cabin.findById(propId)
    .then(checklist => {
      res.render('admin/edit-checklist', {
        pageTitle: 'Add New Checklist',
        path: '/admin/edit-checklist',
        isAuthenticated: req.session.LoggedIn,
        checklist: {
          listTitle: '',
          property: propId,
          task: []
        }
      })
      
    })
    .catch(err => console.log(err));
};

// save editied checklist
exports.postEditChecklist = (req, res, next) => {
  const propId = req.body.propertyId;
  const updatedTitle = req.body.title;
  const updatedDesc = req.body.description;
  
    res.status(422).render('admin/edit-checklist', {
      pageTitle: 'Edit Checklist',
      path: '/admin/edit-checklist',
      editing: true,
      currentUser: req.session.user,
      isAuthenticated: req.session.LoggedIn,
      checklist: {
        title: updatedTitle,
        description: updatedDesc,
        _id: propId
      }
    });
  Cabin.findById(propId)
    .then(checklist => {
      checklist.title = updatedTitle;
      checklist.description = updatedDesc;
      return checklist.save().then(result => {
        console.log('Checklist has been updated!');
        res.redirect('/admin/edit-chechlist');
      });
    })
    .catch(err => console.log(err));
};
