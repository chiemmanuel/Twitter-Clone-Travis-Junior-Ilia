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
    profile_img: {
        type: String,
        required: true,
    },
    content: {
        type: Text,
        required: true,
        max: 140,
    },
    num_likes: {
        type: Number,
        default: 0,
    },
    },
    { timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        },
    });

module.exports = mongoose.model('Comment', commentSchema);