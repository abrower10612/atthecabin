const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userChecklistSchema = new Schema({
    list: [{
        description: {
          type: String,
          required: true,
        },
        completed: {
            type: Boolean,
            required: true
        }
    }],
    propertyId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'Property'
    },
    listId: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'Checklist'
    },
    userId: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    }
  }, { 
    timestamps: true 
  });
   
module.exports = mongoose.model('UserChecklist', userChecklistSchema);
