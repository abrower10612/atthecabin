const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const checkListMasterSchema = new Schema({
    listTitle: {
        type: String,
        required: true
    },
    property: {
        type: Schema.Types.ObjectId,
        ref: 'Property',
        required: true
    },
    task: [{
        title: {
            type: String,
            required: true
        },
        description: {
            type: String,
            required: true
        }
    }]
})

module.exports = mongoose.model('CheckList-Master', checkListMasterSchema);
