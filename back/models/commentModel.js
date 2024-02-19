const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
    tweet_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
    },
    author_name: {
        type: String,
        required: true,
    },
    profile_image: {
        type: String,
        required: true,
    },
    content: {
        type: String,
        required: true,
        max: 140,
    },
    media: {
        type: String,
    },
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
    }],
    },
    { timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        },
    });

module.exports = mongoose.model('Comment', commentSchema);