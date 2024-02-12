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
    options: {
        type: [{
        option_value: {
            type: String,
            required: true,
        },
        num_votes: {
            type: Number,
            default: 0,
        },
        voter_ids: [{
            type: mongoose.Schema.Types.ObjectId,
            }],
        }],
        required: true,
        validate: [assertMinOptions, 'Polls must have at least 2 options'],
        validate: [assertMaxOptions, 'Polls must have at most 4 options'],
    }, 
    }, {
    timestamps: {
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

module.exports = mongoose.model('Poll', pollSchema);

