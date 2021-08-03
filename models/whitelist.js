const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// for list of logged in tokens to ensure token
// cannot be used for access if logged out before 
// token expires
// deleted from db collection on logout
const whitelistSchema = new Schema({
    token: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        expires: 3600
    }
});
 
module.exports = mongoose.model('Whitelist', whitelistSchema);