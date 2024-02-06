const { ObjectId } = require('mongodb');
const logger = require('../middleware/winston');
const statusCodes = require('../constants/statusCodes.js');
const bookmarkModel = require("../models/bookmarkModel.js");

const getBookmarks = async (req, res) => {
    const { email } = req.user;

    try {
        const bookmarks = await bookmarkModel.findOne({ user_email: email} ).exec();
        return res.status(statusCodes.success).json({ bookmarks: bookmarks });

    } catch (error) {
        logger.error(`Error while fetching bookmarks: ${error}`);
        res.status(statusCodes.queryError).send('Error while fetching bookmarks');
    }
};

const addBookmark = async (req, res) => {
    const { tweet_id } = req.params;
    const { email } = req.user;

    try {
        const bookmarks = await bookmarkModel.findOne({ user_email: email }).exec();

        if (bookmarks) {
            bookmarks.tweets.push(new ObjectId(tweet_id));
            await bookmarks.save();
        } else {
            const bookmarks = new bookmarkModel({
                user_email: email,
                tweets: [new ObjectId(tweet_id)],
            });
            await bookmarks.save();
        }
        return res.status(statusCodes.success).json({ message: 'Added new bookmark' });

    } catch (error) {
        logger.error(`Error while adding a bookmark: ${error}`);
        return res.status(statusCodes.queryError).json({ error: 'Error while adding a bookmark' });
    }
};

const deleteBookmark = async (req, res) => {
    const { tweet_id } = req.params;
    const { email } = req.user;

    try {
        await bookmarkModel.findOneAndUpdate(
            { user_email: email },
            { $pull: { tweets: new ObjectId(tweet_id) } }
        );
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
