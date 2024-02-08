const express = require('express');
const router = express.Router();

const tweetsService = require('../services/tweets.services');

router.get('/livefeed', tweetsService.getLiveTweets);
router.get('/:tweetId', tweetsService.getTweetById);
//router.put('/like/:tweetId', tweetsService.likeTweet);
router.put('/edit/:tweetId', tweetsService.editTweetById);
router.delete('/delete/:tweetId', tweetsService.deleteTweetById);
router.get('/foryoupage', tweetsService.getFollowedTweets);
router.post('/tweet', tweetsService.postTweet);
router.put('/poll/vote', tweetsService.registerVote);

module.exports = router;