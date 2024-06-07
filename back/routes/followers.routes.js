const express = require('express');
const router = express.Router();

const followerServices = require('../services/followers.services');

router.get('/followers/:user_email', followerServices.getFollowers);
router.get('/following/:user_email', followerServices.getFollowing);
router.post('/follow/:user_email', followerServices.followUser);
router.delete('/unfollow/:user_email', followerServices.unfollowUser);

module.exports = router;