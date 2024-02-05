const express = require('express');
const router = express.Router();

const tweetsService = require('../services/tweets.services');

router.get('/livefeed', tweetsService.getLiveTweets);
router.get('/:id', tweetsService.getTweetById);
router.put('/edit/:id', tweetsService.editTweetById);
router.delete('/delete/:id', tweetsService.deleteTweetById);
router.get('/followedfeed', tweetsService.getFollowedTweets);
router.post('/tweet', tweetsService.postTweet);
router.put('/poll/vote', tweetsService.registerVote);

module.exports = router;