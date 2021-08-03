const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const reservationSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'User' 
  },
  property: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'Property' 
  },
  status: {
    type: String,
    required: true    
  }, 
  comments: {
    type: String    
  }, 
  startDate: {
    type: Date,
    required: true    
  }, 
  endDate: {
    type: Date,
    required: true    
  }
});

//gets a reservation by specified id
reservationSchema.statics.getReservationById = function(reservationId) {  
  return this     
    .findById(reservationId)
    .then(reservation => {       
      if (!reservation) {
        const err = new Error('Reservation not found');
        err.statusCode = 404;
        throw err;
      }            
      return reservation;
    });    
}


//Determines if the specified dates are available for a reservation
//If userId is supplied, it states a reservation is available if the userId matches
//the id on an existing reservation if they overlap (you'd want this for modifying an existing reservation);
// otherwise, NO overlaps are allowed (such as when posting a new reservation).
reservationSchema.statics.CheckDateAvailability = function(inDate, outDate, propertyId, userId) {
  //check three possible overlaps
  //request.In is >= existing.in and < existing.out; i.e., existing.in <= request.in && existing.out > request.in
  //request.out is > existing.in and <= existing.out; i.e., existing.in < request.out && existing.out >= request.out
  //request.In < existing.in and request.out > existing.out; i.e., existing.in > request.in && existing.out < request.out
  return this 
    .find({ 
      property: propertyId, 
      $or:[
        { startDate: { $lte: inDate }, endDate: { $gt: inDate } },
        { startDate: { $lt: outDate }, endDate: { $gte: outDate } },
        { startDate: { $gt: inDate }, endDate: { $lt: outDate } }
      ] 
    })
    .then(results => {   
      console.log(results);   
      let available = true; 
      if(!userId) {   //if no userId, assume its a new reservation
        available = results.length === 0;
      } else {
        results.forEach(x => {        
          available = available && (x.user.toString() === userId.toString());                  
        });      
      }
      return available;
    });
};

module.exports = mongoose.model('Reservation', reservationSchema);


