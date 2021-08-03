const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const propertySchema = new Schema({
  name: {
    type: String,
    required: true
  },
  location: {
    type: String,
    required: true
  },
  admins: [ 
    { 
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'User' 
    }
  ],  
  members: [
    {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'User' 
    }
  ],   
  imageUrls: [{
    type: String,
    required: true
  }],
  invites: [{ 
      type: String     
  }] 
});

//finds a property that matches the property id 
// AND the user id is in the list of valid admins
propertySchema.statics.getPropertyById = function(propertyId, userId) {
  return this 
      .findOne({ 
        _id: propertyId, 
        admins: userId
      })
      .then(result => {
        if (!result) {
          const err = new Error('Property not found');
          err.statusCode = 404;
          throw err;
        }      
        return result;
      });
};

module.exports = mongoose.model('Property', propertySchema);


