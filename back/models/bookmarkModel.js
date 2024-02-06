const mongoose = require('mongoose');

const bookmarkSchema = new mongoose.Schema({
    user_email: {
        type: String,
        required: true,
    },
    tweets: [{
        type: mongoose.Schema.Types.ObjectId,
    }],
    },);

module.exports = mongoose.model('Bookmark', bookmarkSchema);
