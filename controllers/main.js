const fetch = require('node-fetch');
const { json } = require('body-parser');

const Property = require('../models/property');

exports.getIndex = (req, res, next) => {
    const images = [{"imageUrl": '/images/lake.jpg'}, {"imageUrl": '/images/log.jpg'}, {"imageUrl": '/images/log-cabin.jpg'}, {"imageUrl": '/images/cabin.jpg'}, {"imageUrl": '/images/dawn.jpg'}]
    res.render('index', {
        pageTitle: 'Home',
        path: '/home',
        images: images,
        isAuthenticated: req.session.isLoggedIn
    })
// res.render('properties', {
//     // res.render('reservations/calendar', {
//         pageTitle: 'Property List',
//         path: '/',        
//         currentUser: req.userId
//     });
};

// loads calendar for current month
// will need to add way to highlight unavailable dates
exports.getDashboard = (req, res, next) => {
    // this will need to reworked to dynamically create this array
    const images = ['/images/landscape3.jpeg', '/images/2021-06-10EclipseFlybywm1066.jpeg', '/images/landscape2.jpeg', '/images/AuroraClouds_Boffelli_1080.jpeg', '/images/landscape1.jpeg']
    
    const propId =  req.params.propertyId; // "60d407a452435a4be8d17391";
    Property
        .findById(propId)
        .then(property => {
            const imageUrls = [Property.imageUrls];
            res.render('users/property', {            
                pageTitle: 'Make a Reservation',
                path: '/dashboard',
                property: property,            
                currentUser: req.session.user,
                isAuthenticated: req.session.isLoggedIn,
                edit: false,
                reservation: null,
                imageUrls: imageUrls
            });        
        })
        .catch(err => {
            err.statusCode = 500;
            next(err);    
        });    
}
  