const pool = require('../boot/database/mysql_db_connect.js');
const { logger } = require('../middleware/winston.js');
const statusCodes = require('../constants/statusCodes.js');
const tweetModel = require('../models/tweetModel.js');
const pollModel = require('../models/pollModel.js');

const tweet_limit = 20;

/**
 * TODO: Add socket.io to emit a tweet-created event to active clients
 * 
 * This function creates a new tweet and saves it to the database using the tweetModel schema
 * @param {*} req: The request object
 * @param {*} res: The response object
 * @returns: The res object with a status code and a message
 */
const postTweet = async (req, res) => {
    let poll_id = null;
    if (req.body.poll) {
        poll_id = await createPoll(req.body.poll.title, req.body.poll.duration_seconds, req.body.poll.options);
        if (poll_id === null) {
            logger.error(`Error creating poll: ${error}`);
            return res.status(statusCodes.queryError).json({ message: 'Error creating poll' });
        }
    }
    const newTweet = new tweetModel({
        author_email: req.user,
        author_name: req.body.author_name,
        profile_img: req.body.profile_img,
        content: req.body.content,
        media: req.body.media,
        poll_id: poll_id,
        retweet_id: req.body.retweet_id,
        hashtags: req.body.hashtags,
    });
    try {
        const tweet = await newTweet.save();
        logger.info(`Successfully created tweet with id: ${tweet._id}`);
        return res.status(statusCodes.success).json({ message: 'Successfully created tweet' });
    } catch (error) {
        logger.error(`Error creating tweet: ${error}`);
        return res.status(statusCodes.queryError).json({ message: 'Error creating tweet' });
    }
}

/**
 * This function creates a new poll and saves it to the database using the pollModel schema and values passed to it from the postTweet function
 * @param {String} title: The title of the poll
 * @param {Number} duration_seconds: The duration of the poll in seconds
 * @param {Array} options: The options for the poll
 * @returns: The id of the newly created poll, or null if an error occurs
 * 
 */
const createPoll = async (title, duration_seconds, options) => {
    const newPoll = new pollModel({
        title: title,
        duration_seconds: duration_seconds,
        options: options
    });
    try {
        const poll = await newPoll.save();
        logger.info(`Successfully created poll with id: ${poll._id}`);
        setTimeout(closePoll, duration_seconds * 1000, poll._id);
        return poll._id;
    } catch (error) {
        logger.error(`Error creating poll: ${error}`);
        return null;
    }
}

/**
 * TODO: Add socket.io to emit a poll-created event to the client
 *
 * This function closes a poll by updating the isClosed field to true and emitting a poll-closed event to the client
 * @param {String} poll_id: The id of the poll to be closed
 * @returns: Nothing
 */
const closePoll = async (poll_id) => {
    try {
        const poll = await pollModel.findByIdAndUpdate(poll_id, { isClosed: true });
        logger.info(`Successfully closed poll with id: ${poll_id}`);
        return;
    } catch (error) {
        logger.error(`Error closing poll: ${error}`);
        return;
    }
}

/**
 * This function adds a new vote to a poll by updating the num_votes field of the option and adding the user's email to the voter_ids array
 * @param {*} req The request object
 * @param {*} res The response object
 * @returns: The res object with a status code and a message
 */
const registerVote = async (req, res) => {
    poll_id = req.body.poll_id;
    option_index = req.body.option_index;
    user_email = req.user;
    try {
        const poll = await pollModel.findById(poll_id);
        if (poll.isClosed) {
            logger.error(`Error registering vote: Poll with id ${poll_id} is closed`);
            return res.status(statusCodes.badRequest).json({ message: 'Error registering vote: Poll is closed' });
        }
        // Check if the user has already voted for an option in the poll
        for (let i = 0; i < poll.options.length; i++) {
            if (poll.options[i].voter_ids.includes(user_email)) {
                logger.error(`Error registering vote: User with email ${user_email} has already voted for an option in poll with id ${poll_id}`);
                return res.status(statusCodes.badRequest).json({ message: 'Error registering vote: User has already voted for an option in this poll' });
            }
        }
        poll.options[option_index].num_votes += 1;
        poll.options[option_index].voter_ids.push(user_email);
        await poll.save();
        logger.info(`Successfully registered vote for poll with id: ${poll_id}`);
        return res.status(statusCodes.success).json({ message: 'Successfully registered vote' });
    } catch (error) {
        logger.error(`Error registering vote: ${error}`);
        return res.status(statusCodes.queryError).json({ message: 'Error registering vote' });
    }
}

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
    followed_users = [];
    try {
        // Find the users that the current user follows
        const [followed] = await pool.query('SELECT following_id FROM follows WHERE follower_id = ?', [user_email]);
        followed.forEach(user => {
            followed_users.push(user.following_id);
        });
    } catch (error) {
        logger.error(`Error fetching followed users from the database: ${error}`);
        return res.status(statusCodes.queryError).json({ message: 'Error fetching followed users from the database' });
    }
    if (last_tweet_id) {
        try {
            // Find tweets from the users that the current user follows that have an _id less than the last_tweet_id
            const tweets = await tweetModel.aggregate([
                { $match: { author_email: { $in: followed_users }, _id: { $lt: last_tweet_id } } },
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
                { $match: { author_email: { $in: followed_users } } },
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
    postTweet,
    getLiveTweets,
    getFollowedTweets,
    registerVote,
}
