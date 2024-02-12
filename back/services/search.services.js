const logger = require('../middleware/winston');
const tweetModel = require('../models/tweetModel.js');
const statusCodes = require('../constants/statusCodes.js');

const searchByUsername = async (req, res) => {
    const { username } = req.params;

    try {
        return res.redirect(`/user/get/${username}`);
    } catch (error) {
        logger.error(`Error while searching by username ${username}: ${error}`);
        res.status(statusCodes.queryError).json({ error: `Error while searching by username ${username}` });
    }
};

const searchByHashtag = async (req, res) => {
    const { hashtag } = req.params;

    try {
        const mostViewedTweets = await tweetModel.find({ hashtags: hashtag })
        .sort({ num_views: -1 })
        .limit(10);

        const mostRecentTweets = await tweetModel.find({ hashtags: hashtag })
        .sort({ created_at: -1 })
        .limit(10);

        return res.status(statusCodes.success).json({ 
            mostViewedTweets: Array.from(mostViewedTweets),
            mostRecentTweets: Array.from(mostRecentTweets), 
        });

    } catch (error) {
        logger.error(`Error while searching by hashtag ${hashtag}: ${error}`);
        res.status(statusCodes.queryError).json({ error: `Error while searching by hashtag ${hashtag}` });
    }
};

module.exports = { 
    searchByUsername,
    searchByHashtag,
};
