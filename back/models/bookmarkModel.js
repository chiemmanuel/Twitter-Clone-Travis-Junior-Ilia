const mongoose = require('mongoose');

const bookmarkSchema = new mongoose.Schema({
    user_email: {
        type: String,
        required: true,
    },
    tweets: [{
        type: mongoose.Schema.Types.ObjectId,
    }],
    },
    { timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        },
    });

module.exports = mongoose.model('Bookmark', bookmarkSchema);
