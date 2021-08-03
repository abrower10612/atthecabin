const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const inventorySchema = new Schema({
  list: [{
      description: {
        type: String,
        required: true,
      },
      amount: {
        type: Number,
        required: true
      }
  }],
  propertyId: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'Property'
  }
});


module.exports = mongoose.model('Inventory', inventorySchema);