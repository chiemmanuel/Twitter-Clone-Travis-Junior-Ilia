const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    recipient_email: {
        type: String,
        required: true,
    },
    content: {
        type: Text,
        required: true,
    },
    isRead: {
        type: Boolean,
        default: false,
    },
    },
    { timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        },
    });