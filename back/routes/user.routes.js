const express = require('express');
const router = express.Router();

const userServices = require('../services/user.services');

router.post('/follow/:followed_user', userServices.followUser);
router.delete('/unfollow/:followed_user', userServices.unfollowUser);