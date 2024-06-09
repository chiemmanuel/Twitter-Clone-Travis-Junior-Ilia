const logger = require('../middleware/winston');
const tweetModel = require('../models/tweetModel.js');
const userModel = require('../models/userModel.js');
const statusCodes = require('../constants/statusCodes.js');
const Redis = require('../boot/redis_client');
const crypto = require('crypto');
const redisCacheDurations = require('../constants/redisCacheDurations');

/**
 * This function generates a hash key for caching based on the provided filter
 * @param {*} _filter: The filter object to be hashed
 * @returns: The hash key
 */
const getHashKey = (_filter) => {
    let retKey = '';
    if (_filter) {
      const text = JSON.stringify(_filter);
      retKey = crypto.createHash('sha256').update(text).digest('hex');
    }
    return 'CACHE_ASIDE_' + retKey;
  };

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
    const redisClient = Redis.getRedisClient();
    const requestKey = getHashKey({ hashtag });
    const cachedResults = await redisClient.get(requestKey).catch((err) => {
        logger.error(`Error getting search results from cache: ${err}`);
    });

    if (cachedResults) {
        logger.info(`Cache hit for hashtag search: ${hashtag}`);
        return res.status(statusCodes.success).json({ results: JSON.parse(cachedResults) });
    }
    
    var query_regex = new RegExp("^" + hashtag, 'i');
    try {
        const mostViewedTweets = await tweetModel.find({ hashtags: {$regex: query_regex} })
        .sort({ num_views: -1 })
        .limit(10);
        
        const mostRecentTweets = await tweetModel.find({ hashtags: { $regex: query_regex } })
        .sort({ created_at: -1 })
        .limit(10);

        const results = {
            mostViewedTweets: Array.from(mostViewedTweets),
            mostRecentTweets: Array.from(mostRecentTweets),
        };
        logger.info(`Caching search results for hashtag ${hashtag}`)
        await redisClient.set(requestKey, JSON.stringify(results)).then(
            async () => {
                await redisClient.expire(requestKey, redisCacheDurations.searchResults).catch((err) => {
                    logger.error(`Error setting cache expiration: ${err}`);
                });
            }
        );

        return res.status(statusCodes.success).json({ results: results});

    } catch (error) {
        logger.error(`Error while searching by hashtag ${hashtag}: ${error}`);
        res.status(statusCodes.queryError).json({ error: `Error while searching by hashtag ${hashtag}` });
    }
};

module.exports = { 
    searchByUsername,
    searchByHashtag,
};
