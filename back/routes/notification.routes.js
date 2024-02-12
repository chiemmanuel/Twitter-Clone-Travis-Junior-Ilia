const express = require('express');
const router = express.Router();

const notificationServices = require('../services/notification.services');

router.get('/', notificationServices.getNotifications);
router.post('/create', notificationServices.createNotification);

module.exports = router;