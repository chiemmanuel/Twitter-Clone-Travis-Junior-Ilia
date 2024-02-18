const logger = require('../middleware/winston');
const tweetModel = require('../models/tweetModel.js');
const userModel = require('../models/userModel.js');
const statusCodes = require('../constants/statusCodes.js');

const searchByUsername = async (req, res) => {
    const { query } = req.params

    try {
        var query_regex = new RegExp("^" + query, 'i');
        logger.info(`Searching by username: ${query}`);
        logger.info(`Query regex: ${query_regex}`);
        const results = await userModel.find({ username: { $regex: query_regex } })
        return res.status(statusCodes.success).json({ results: results });
    } catch (error) {
        logger.error(`Error while searching by username ${query}: ${error}`);
        res.status(statusCodes.queryError).json({ error: `Error while searching by username ${query}` });
    }
};
const searchByHashtag = async (req, res) => {
    const { hashtag } = req.params;
    
    var query_regex = new RegExp("^" + hashtag, 'i');
    try {
        const mostViewedTweets = await tweetModel.find({ hashtags: {$regex: query_regex} })
        .sort({ num_views: -1 })
        .limit(10);
        
        const mostRecentTweets = await tweetModel.find({ hashtags: { $regex: query_regex } })
        .sort({ created_at: -1 })
        .limit(10);

        return res.status(statusCodes.success).json({ results: {
            mostViewedTweets: Array.from(mostViewedTweets),
            mostRecentTweets: Array.from(mostRecentTweets), 
        }});

    } catch (error) {
        logger.error(`Error while searching by hashtag ${hashtag}: ${error}`);
        res.status(statusCodes.queryError).json({ error: `Error while searching by hashtag ${hashtag}` });
    }
};

module.exports = { 
    searchByUsername,
    searchByHashtag,
};
