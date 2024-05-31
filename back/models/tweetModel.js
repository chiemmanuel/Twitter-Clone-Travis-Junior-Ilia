const mongoose = require('mongoose');

// NEW SCHEMA
 const tweetSchema = new mongoose.Schema({
    author_id: {
        type: String,
        required: true,
    },
    author_email: {
        type: String,
        required: true,
    },
    author_username: {
        type: String,
        required: true,
    },
    author_profile_img: {
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
    poll: {
        title: {
            type: String,
        },
        duration_seconds: {
            type: Number,
            min: 60,
        },
        isClosed: {
            type: Boolean,
        },
        options: {
            type: [{
            option_value: {
                type: String,
            },
            num_votes: {
                type: Number,
                default: 0,
            },
            voter_ids: [{
                type: mongoose.Schema.Types.ObjectId,
                }],
            }],
            validate: [assertMinOptions, 'Polls must have at least 2 options'],
            validate: [assertMaxOptions, 'Polls must have at most 4 options'],
        },
        default: {}, 
        },
    retweet_id: {
        type: mongoose.Schema.Types.ObjectId,
    },
    hashtags: [{
        type: String,
    }],
    num_likes: {
        type: Number,
        default: 0,
    },
    num_comments: {
        type: Number,
        default: 0,
    },
    num_bookmarks: {
        type: Number,
        default: 0,
    },
    num_retweets: {
        type: Number,
        default: 0,
    },
    num_views: {
        type: Number,
        default: 0,
    }}, { timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    }
    });
    
    function assertMaxOptions(value) {
        return value.length <= 4;
    }
    
    function assertMinOptions(value) {
        return value.length >= 2;
    }
    
// OLD SCHEMA
// const tweetSchema = new mongoose.Schema({
//     author_id: {
//         type: mongoose.Schema.Types.ObjectId,
//         required: true,
//     },
//     author_email: {
//         type: String,
//         required: true,
//     },
//     content: {
//         type: String,
//         required: true,
//         max: 140,
//     },
//     media: {
//         type: String,
//     },
//     poll_id: {
//         type: mongoose.Schema.Types.ObjectId,
//     },
//     retweet_id: {
//         type: mongoose.Schema.Types.ObjectId,
//     },
//     hashtags: [{
//         type: String,
//     }],
//     num_comments: {
//         type: Number,
//         default: 0,
//     },
//     liked_by:[{
//         type: mongoose.Schema.Types.ObjectId,
//     }],
//     num_bookmarks: {
//         type: Number,
//         default: 0,
//     },
//     num_retweets: {
//         type: Number,
//         default: 0,
//     },
//     num_views: {
//         type: Number,
//         default: 0,
//     },
// }, { timestamps: { 
//     createdAt: 'created_at',
//     updatedAt: 'updated_at',
//  },
// });

module.exports = mongoose.model('Tweet', tweetSchema);
