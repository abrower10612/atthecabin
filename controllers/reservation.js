const Reservation = require('../models/reservation');
const utils = require('../util/utilities');
const { validationResult } = require("express-validator");
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_ACCOUNT, 
    pass: process.env.EMAIL_PWD
  }
});



//find all reservations for the specified property (id in params)
//with a start date <= qeury.endDate 
exports.getReservations = (req, res, next) => {
  try {       
    let startDay = new Date(req.query.startDate);
    let endDay = new Date(req.query.endDate);        
    if(utils.isValidDate(startDay) && utils.isValidDate(endDay)) {          
      Reservation
        .find({ 
          property: req.params.propertyId,
          $or:[
            { startDate: { $gte: startDay, $lte: endDay } }, 
            { endDate: { $gte: startDay, $lte: endDay } }
          ]   
        })  
        .then(reservations => {                               
          res.status(200).json({ reservations });          
        })    
        .catch(err => {          
          const error = new Error(err);
          error.statusCode = 500;
          next(error);
        });   
    } else {              
        const error = new Error("Invalid Date Format");
        error.statusCode = 400;
        throw(error);
    }
  } catch(err) {    
    const error = new Error(err);
    error.statusCode = 500;
    throw(error);
  }
};

//get reservationby a specific reservationId (in params)
//and load that to the edit reservation page
exports.getReservation = (req, res, next) => {         
  Reservation.getReservationById(req.params.reservationId)  
  .then(async (reservation) => {   
    await reservation.populate('property').execPopulate();          
    res.render('users/property', {            
      pageTitle: 'Edit Reservation',
      path: '/reservations',
      property: reservation.property,
      currentUser: req.session.user,
      isAuthenticated: req.session.isLoggedIn,      
      edit: true,
      reservation: reservation
    });                
  })    
  .catch(err => {
    const error = new Error(err);
    error.statusCode = 500;
    next(error);
  });   
};

//get all reservations for a user 
exports.getUserReservations = (req, res, next) => {      
  const today = new Date();     
  Reservation
    .find({
       user: req.session.user,
       endDate: { $gte: today }
     })
    .populate('property')
    .sort('startDate')
    .exec()
    .then(reservations => {              
      res.render('users/reservations', {            
        pageTitle: 'Your Reservations',
        path: '/reservations',                    
        currentUser: req.session.user,
        isAuthenticated: req.session.isLoggedIn,          
        reservations: reservations
      });   
    })    
    .catch(err => {
      const error = new Error(err);
      error.statusCode = 500;
      next(error);
    });   
};

//Add a new reservation
exports.postReservation = (req, res, next) => {     
  //check validation in middleware for valid fields
  const errors = validationResult(req);
  if(!errors.isEmpty()) {
    return res.status(422).json( { errors }); 
  } 
  //check if dates are valid (not reserved and shorter max length but longer than min) in validation.
  const startDate = new Date(req.body.startDate);
  const endDate = new Date(req.body.endDate);
  const user = req.session.user;  
  const property = req.params.propertyId;  
  Reservation.CheckDateAvailability(startDate, endDate, property)
  .then(availability => {    
    //if valid, create:    
    if (!availability) {
      return res.status(409).json({ reservation: null, message: "No availability during selected time." });
    }     
    let reservation = new Reservation({
      user: user,
      property: property,
      comments: req.body.comments,
      status: "pending",
      startDate: startDate,
      endDate: endDate
    });    
    reservation    
      .save()
      .then(result => {
        return res.status(201).json({ reservation: result, message: "Reservation submitted." });
      });
    })          
    .catch(err => {      
      if (!err.statusCode) err.statusCode = 500;
      next(err);    
    });
};

//Modifies reservation dates based on request body
exports.modifyReservation = (req, res, next) => {    
  //check validation in middleware for valid fields
  const errors = validationResult(req);
  if(!errors.isEmpty()) {
    return res.status(422).json( { errors });
  }   
  const startDate = new Date(req.body.startDate);
  const endDate = new Date(req.body.endDate);
  const user = req.session.user;
  const property = req.params.propertyId;     
  Reservation.getReservationById(req.params.reservationId) 
  .then(reservation => {        
    if(reservation.user._id.toString() !== user._id.toString()) {             
      const error = new Error("Unauthorized attempt to modify a reservation.");
      error.statusCode = 401;
      throw error;
    }     
    //check if dates are valid (not reserved and shorter max length but longer than min) in validation.
    Reservation.CheckDateAvailability(startDate, endDate, property, user._id)
    .then(availability => {    
      //if valid, create:       
      if (!availability) {
        return res.status(409).json({ reservation: null, message: "No availability during selected time." });
      }       
      //if valid, update:      
      reservation.startDate = startDate;
      reservation.endDate = endDate;
      reservation.comments = req.body.comments;
      reservation.status = 'pending';
      return reservation.save();
    })    
    .then(result => {
      res.status(200).json({ 
        message: 'Reservation has been modified.', 
        reservation: result
      });
    }); 
  })     
  .catch(err => {    
    if (!err.statusCode) err.statusCode = 500;
    next(err);
  });
};

//Removes a reservation from the table based on the reservationId in the params
exports.deleteReservation = (req, res, next) => {   
  Reservation.getReservationById(req.params.reservationId) 
  .then(reservation => {     
    if(reservation.user._id.toString() !== req.session.user._id.toString()) {           
      const err = new Error("Unauthorized attempt to modify a reservation.");
      err.statusCode = 401;      
      throw err;
    }     
    return Reservation.findByIdAndRemove(req.params.reservationId);
  })
  .then(result => {        
    res.status(200).json({ message: 'Reservation has been canceled.'});
  })
  .catch(err => {
    console.log(err);
    if (!err.statusCode) err.statusCode = 500;
    next(err);
  });
};

