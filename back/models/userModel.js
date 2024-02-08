const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
    },
    username: {
        type: String,
        required: true,
        unique: true,
    },
    profile_img: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
    bio: {
        type: String,
        max: 140,
    },
    gender: {
        type: String,
    },
    dob: {
        type: Date,
    },
    contact: {
        type: String,
    },
    followers: [{
        type: mongoose.Schema.Types.ObjectId,
    }],
    following: [{
        type: mongoose.Schema.Types.ObjectId,
    }],
    bookmarked_tweets: [{
        type: mongoose.Schema.Types.ObjectId,
    }],
    liked_tweets: [{
        type: mongoose.Schema.Types.ObjectId,
    }],
    blocked_users: [{
        type: mongoose.Schema.Types.ObjectId,
    }],

}, { timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    },
});

module.exports = mongoose.model('User', userSchema);
