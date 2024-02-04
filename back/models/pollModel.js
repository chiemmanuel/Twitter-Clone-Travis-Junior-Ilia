const mongoose = require('mongoose');

const pollSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    duration_seconds: {
        type: Number,
        required: true,
        min: 60,
    },
    isClosed: {
        type: Boolean,
        default: false,
    },
    options: [{
        option_value: {
            type: String,
            required: true,
        },
        num_votes: {
            type: Number,
            default: 0,
        },
        voter_ids: [{
            type: String,
            }],
        }], 
    });

module.exports = mongoose.model('Poll', pollSchema);

