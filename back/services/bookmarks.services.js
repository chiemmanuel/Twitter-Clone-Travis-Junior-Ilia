const logger = require('../middleware/winston');
const statusCodes = require('../constants/statusCodes.js');
const tweetModel = require('../models/tweetModel.js');
const userModel = require("../models/userModel.js");
const { sendMessage } = require('../boot/socketio/socketio_connection');

const getBookmarks = async (req, res) => {
    const userId = req.user._id;

    try {
        const user = await userModel.findById(userId);

        var query = [
            { $lookup: { from: 'users', localField: 'author_id', foreignField: '_id', as: 'author' } },
            { $unwind: { path: '$author'}},
            { $lookup: { from: 'polls', localField: 'poll_id', foreignField: '_id', as: 'poll' } },
            { $unwind: { path: '$poll', preserveNullAndEmptyArrays: true } },
            { $lookup: { from: 'tweets', localField: 'retweet_id', foreignField: '_id', as: 'retweet' } },
            { $unwind: { path: '$retweet', preserveNullAndEmptyArrays: true } },
            { $lookup: { from : 'users', localField: 'retweet.author_email', foreignField: 'email', as: 'retweet_author' } },
            { $unwind: { path: '$retweet_author', preserveNullAndEmptyArrays: true}},
            { $project: {
                "author_email": 1,
                "content": 1,
                "media": 1,
                "poll": 1,
                "retweet": 1,
                "hashtags": 1,
                "num_comments": 1,
                "liked_by": 1,
                "num_retweets": 1,
                "num_views": 1,
                "num_bookmarks": 1,
                "created_at": 1,
                "updated_at": 1,
                "author.username": 1,
                "author.profile_img": 1,
                "retweet_author.username": 1,
                "retweet_author.profile_img": 1,
            } },
        ];;
        if (query[0].$match) {
            query[0].$match._id = { $in: user.bookmarked_tweets };
        } else {
        query.unshift({ $match: { _id: { $in: user.bookmarked_tweets } } });
        }
        const bookmarked_tweets = await tweetModel.aggregate(query);
        return res.status(statusCodes.success).json({ bookmarks: user.bookmarked_tweets , bookmarked_tweets: bookmarked_tweets});

    } catch (error) {
        logger.error(`Error while fetching bookmarks: ${error}`);
        res.status(statusCodes.queryError).send('Error while fetching bookmarks');
    }
};
    

const addBookmark = async (req, res) => {
    const { tweet_id } = req.params;
    const userId = req.user._id;

    try {
        const user = await userModel.findById(userId);
        const tweet = await tweetModel.findById(tweet_id);

        if (user.bookmarked_tweets.includes(tweet_id)) {
            res.status(statusCodes.success).json({ message: 'This tweet is already bookmarked' });
        } else {
            user.bookmarked_tweets.push(tweet_id);
            tweet.num_bookmarks += 1;
            await user.save();
            await tweet.save();
        }
        sendMessage(null, 'bookmark', { _id: tweet_id, user_id: userId, deleted: false})
        return res.status(statusCodes.success).json({ message: 'Added new bookmark' });

    } catch (error) {
        logger.error(`Error while adding a bookmark: ${error}`);
        return res.status(statusCodes.queryError).json({ error: 'Error while adding a bookmark' });
    }
};

const deleteBookmark = async (req, res) => {
    const { tweet_id } = req.params;
    const userId = req.user._id;

    try {
        const user = await userModel.findById(userId);
        const tweet = await tweetModel.findById(tweet_id);

        user.bookmarked_tweets.pull(tweet_id);
        tweet.num_bookmarks -= 1;
        await user.save();
        await tweet.save();
        
        sendMessage(null, 'bookmark', { _id: tweet_id, user_id: userId, deleted: true})
        return res.status(statusCodes.success).json({ message: 'Bookmark deleted' });
    
    } catch (error) {
        logger.error(`Error while deleting a bookmark: ${error}`);
        res.status(statusCodes.queryError).json({ error: 'Error while deleting a bookmark' });
    }
};

module.exports = {
    addBookmark,
    getBookmarks,
    deleteBookmark,
};
