const pool = require('../boot/database/mysql_db_connect.js');
const { logger } = require('../middleware/winston.js');
const statusCodes = require('../constants/statusCodes.js');
const tweetModel = require('../models/tweetModel.js');
const pollModel = require('../models/pollModel.js');

const tweet_limit = 20;

/**
 * This function fetches the next set of tweets from the database in chronological order
 * @param {*} req: The request object
 * @param {*} res: The response object
 * @returns: A JSON object containing the fetched tweets and the id of the last tweet fetched
 */
const getLiveTweets = async (req, res) => {
    if(req.query.last_tweet_id) {
        last_tweet_id = req.query.last_tweet_id;
    } else {
        last_tweet_id = null;
    }
    if (last_tweet_id) {
        try {
            // Find tweets that have an _id less than the last_tweet_id (older than the last tweet fetched by the client)
            const tweets = await tweetModel.aggregate([
                { $match: { _id: { $lt: last_tweet_id } } },
                { $sort: { _id: -1 } },
                { $limit: tweet_limit },
                // Join the tweets with the polls and retweets they reference
                { $lookup: { from: pollModel.collection.name, localField: 'poll_id', foreignField: '_id', as: 'poll' } },
                { $unwind: { path: '$poll', preserveNullAndEmptyArrays: true } },
                { $lookup: { from: tweetModel.collection.name, localField: 'retweet_id', foreignField: '_id', as: 'retweet' } },
                { $unwind: { path: '$retweet', preserveNullAndEmptyArrays: true } }
            ]);
            logger.info(`Successfully fetched tweets from the database`);
            return res.status(statusCodes.success).json({tweets: tweets, last_tweet_id: tweets[tweets.length - 1]._id});
        } catch (error) {
            logger.error(`Error fetching tweets from the database: ${error}`);
            return res.status(statusCodes.queryError).json({ message: 'Error fetching tweets from the database' });
        }
    } else {
        try {
            const tweets = await tweetModel.aggregate([
                // If no last_tweet_id is provided, fetch the most recent tweets
                { $sort: { _id: -1 } },
                { $limit: tweet_limit },
                // Join the tweets with the polls and retweets they reference
                { $lookup: { from: 'polls', localField: 'poll_id', foreignField: '_id', as: 'poll' } },
                { $unwind: { path: '$poll', preserveNullAndEmptyArrays: true } },
                { $lookup: { from: 'tweets', localField: 'retweet_id', foreignField: '_id', as: 'retweet' } },
                { $unwind: { path: '$retweet', preserveNullAndEmptyArrays: true } }
            ]);
            if (tweets.length > 0) {
                logger.info(`Successfully fetched tweets from the database`);
                return res.status(statusCodes.success).json({tweets: tweets, last_tweet_id: tweets[tweets.length - 1]._id});
            } else {
                logger.info(`No more tweets to fetch from the database`);
                return res.status(statusCodes.success).json({tweets: [], last_tweet_id: null});
            }
        } catch (error) {
            logger.error(`Error fetching tweets from the database: ${error}`);
            return res.status(statusCodes.queryError).json({ message: 'Error fetching tweets from the database' });
        }
    }
}

/**
 * This function fetches the next set of tweets from followed users in chronological order
 * @param {*} req: The request object
 * @param {*} res: The response object
 * @returns: A JSON object containing the fetched tweets and the id of the last tweet fetched
 */
const getFollowedTweets = async (req, res) => {
    user_email = req.user;
    last_tweet_id = req.query.last_tweet_id;
    follwed_users = [];
    try {
        // Find the users that the current user follows
        const [followed] = await pool.query('SELECT following_id FROM follows WHERE follower_id = ?', [user_email]);
        followed.forEach(user => {
            follwed_users.push(user.following_id);
        });
    } catch (error) {
        logger.error(`Error fetching followed users from the database: ${error}`);
        return res.status(statusCodes.queryError).json({ message: 'Error fetching followed users from the database' });
    }
    if (last_tweet_id) {
        try {
            // Find tweets from the users that the current user follows that have an _id less than the last_tweet_id
            const tweets = await tweetModel.aggregate([
                { $match: { author_email: { $in: follwed_users }, _id: { $lt: last_tweet_id } } },
                { $sort: { _id: -1 } },
                { $limit: tweet_limit },
                // Join the tweets with the polls and retweets they reference
                { $lookup: { from: 'polls', localField: 'poll_id', foreignField: '_id', as: 'poll' } },
                { $unwind: { path: '$poll', preserveNullAndEmptyArrays: true } },
                { $lookup: { from: 'tweets', localField: 'retweet_id', foreignField: '_id', as: 'retweet' } },
                { $unwind: { path: '$retweet', preserveNullAndEmptyArrays: true } }
            ]);
            logger.info(`Successfully fetched tweets from the database`);
            return res.status(statusCodes.success).json({tweets: tweets, last_tweet_id: tweets[tweets.length - 1]._id});
        } catch (error) {
            logger.error(`Error fetching tweets from the database: ${error}`);
            return res.status(statusCodes.queryError).json({ message: 'Error fetching tweets from the database' });
        }
    } else {
        try {
            // Find tweets from the users that the current user follows
            const tweets = await tweetModel.aggregate([
                { $match: { author_email: { $in: follwed_users } } },
                { $sort: { _id: -1 } },
                { $limit: tweet_limit },
                // Join the tweets with the polls and retweets they reference
                { $lookup: { from: 'polls', localField: 'poll_id', foreignField: '_id', as: 'poll' } },
                { $unwind: { path: '$poll', preserveNullAndEmptyArrays: true } },
                { $lookup: { from: 'tweets', localField: 'retweet_id', foreignField: '_id', as: 'retweet' } },
                { $unwind: { path: '$retweet', preserveNullAndEmptyArrays: true } }
            ]);
            logger.info(`Successfully fetched tweets from the database`);
            return res.status(statusCodes.success).json({tweets: tweets, last_tweet_id: tweets[tweets.length - 1]._id});
        } catch (error) {
            logger.error(`Error fetching tweets from the database: ${error}`);
            return res.status(statusCodes.queryError).json({ message: 'Error fetching tweets from the database' });
        }
    }
}

module.exports = {
    getLiveTweets,
    getFollowedTweets
}
