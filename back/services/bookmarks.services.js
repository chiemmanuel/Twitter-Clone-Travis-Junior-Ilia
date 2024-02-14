const logger = require('../middleware/winston');
const statusCodes = require('../constants/statusCodes.js');
const tweetModel = require('../models/tweetModel.js');
const userModel = require("../models/userModel.js");
const { sendMessage } = require('../boot/socketio/socketio_connection');

const getBookmarks = async (req, res) => {
    const userId = req.user._id;

    try {
        const user = await userModel.findById(userId);
        return res.status(statusCodes.success).json({ bookmarks: user.bookmarked_tweets });

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
        
        sendMessage(null, 'bookmark', { _id: tweet_id, user_id: userId, deleted: false})
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
