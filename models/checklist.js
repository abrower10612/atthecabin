const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const checkListSchema = new Schema({
    list: [{
        description: {
          type: String,
          required: true,
        }
    }],
    title: {
      type: String,
      required: true
    },
    propertyId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'Property'
    }
  });
   
module.exports = mongoose.model('Checklist', checkListSchema);