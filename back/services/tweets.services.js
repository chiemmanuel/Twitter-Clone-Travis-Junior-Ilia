const logger = require("../middleware/winston");
const statusCodes = require('../constants/statusCodes.js');
const tweetModel = require('../models/tweetModel.js');
const pollModel = require('../models/pollModel.js');
const userModel = require('../models/userModel.js');
const ObjectId = require('mongoose').Types.ObjectId;
const fetch_feed_query = require ('../constants/fetchFeedConstants.js').fetch_feed_query;

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
    if (req.body.poll) {
        pollResult = await createPoll(req.body.poll.title, req.body.poll.duration_seconds, req.body.poll.options);
        console.log(pollResult);
        if (pollResult.error) {
            logger.error(`Error creating poll: ${pollResult.error}`);
            return res.status(statusCodes.queryError).json({ message: 'Error creating poll' });
        }
    } else {
        pollResult = { id: null };
    }
    const newTweet = new tweetModel({
        author_email: req.user.email,
        content: req.body.content,
        media: req.body.media ? req.body.media : null,
        poll_id: pollResult.id,
        retweet_id: req.body.retweet_id ? req.body.retweet_id : null,
        hashtags: req.body.hashtags ? req.body.hashtags : null,
    });
    try {
        const tweet = await newTweet.save();
        if (req.body.retweet_id) {
            // If it's a retweet, increment the retweet count for the original tweet
            await tweetModel.findByIdAndUpdate(req.body.retweet_id, { $inc: { retweet_count: 1 } });
        }
        logger.info(`Successfully created tweet with id: ${tweet._id}`);
        return res.status(statusCodes.success).json({ message: 'Successfully created tweet' });
    } catch (error) {
        logger.error(`Error creating tweet: ${error}`);
        return res.status(statusCodes.queryError).json({ message: 'Error creating tweet' });
    }
}
/**
 * TODO: Add socket.io to emit a tweet-updated event to active clients
 * 
 * This function retrieves a tweet by its ID and returns it in the response
 * @param {*} req: The request object with tweetId in params
 * @param {*} res: The response object
 * @returns: The res object with a status code and the tweet in the message
 */
const getTweetById = async (req, res) => {
    const tweetId = req.params.tweetId;

    try {
        const tweet = await tweetModel.findById(tweetId);
        if (!tweet) {
            return res.status(statusCodes.notFound).json({ message: 'Tweet not found' });
        }

        return res.status(statusCodes.success).json({ tweet: tweet });
    } catch (error) {
        console.log(error);
        return res.status(statusCodes.queryError).json({ message: 'Error fetching tweet' });
    }
};

/**
 * TODO: Add socket.io to emit a tweet-updated event to active clients
 * 
 * This function updates a tweet by its ID based on the provided fields in the request body
 * @param {*} req: The request object with tweetId in params and updated fields in the body
 * @param {*} res: The response object
 * @returns: The res object with a status code and a message indicating the success or failure of the update
 */
const editTweetById = async (req, res) => {
    const tweetId = req.params.tweetId;
    const { updatedContent, updatedMedia, updatedHashtags } = req.body;

    try {
        const tweet = await tweetModel.findById(tweetId);
        if (!tweet) {
            return res.status(statusCodes.notFound).json({ message: 'Tweet not found' });
        }

        // Update only if the fields are provided in the request
        if (updatedContent !== undefined) {
            tweet.content = updatedContent;
        }
        if (updatedMedia !== undefined) {
            tweet.media = updatedMedia;
        }
        if (updatedHashtags !== undefined) {
            tweet.hashtags = updatedHashtags;
        }

        const updatedTweet = await tweet.save();

        return res.status(statusCodes.success).json({ message: 'Tweet updated successfully', tweet: updatedTweet });
    } catch (error) {
        console.log(error);
        return res.status(statusCodes.queryError).json({ message: 'Error updating tweet' });
    }
};

/**
 * TODO: Add socket.io to emit a tweet-deleted event to active clients
 * 
 * This function allows users to like or unlike a tweet by adding or removing their user ID from the liked_by list
 * @param {*} req: The request object with tweetId in params
 * @param {*} res: The response object
 * @returns: The res object with a status code and a message indicating the success or failure of the deletion
 */
const likeTweet = async (req, res) => {
    const tweetId = req.params.tweetId;
    const userId = req.user._id;

    try {
        const tweet = await tweetModel.findById(tweetId);

        if (!tweet) {
            return res.status(statusCodes.notFound).json({ message: 'Tweet not found' });
        }

        const userIndex = tweet.liked_by.indexOf(userId);

        if (userIndex !== -1) {
            // If user has already liked the tweet, remove them from the liked_by list
            tweet.liked_by.splice(userIndex, 1);

            const updatedTweet = await tweet.save();

        return res.status(statusCodes.success).json({ message: 'unliked successfully', tweet: updatedTweet });
        } else {
            // If user has not liked the tweet, add them to the liked_by list
            tweet.liked_by.push(userId);

            const updatedTweet = await tweet.save();

            return res.status(statusCodes.success).json({ message: 'liked successfully', tweet: updatedTweet });
        }

    } catch (error) {
        console.log(error);
        return res.status(statusCodes.queryError).json({ message: 'Error liking/unliking tweet' });
    }
};

/**
 * TODO: Add socket.io to emit a tweet-deleted event to active clients
 * 
 * This function deletes a tweet by its ID
 * @param {*} req: The request object with tweetId in params
 * @param {*} res: The response object
 * @returns: The res object with a status code and a message indicating the success or failure of the deletion
 */
const deleteTweetById = async (req, res) => {
    const tweetId = req.params.tweetId;

    try {
        const tweet = await tweetModel.findByIdAndDelete(tweetId);
        if (!tweet) {
            return res.status(statusCodes.notFound).json({ message: 'Tweet not found' });
        }

        return res.status(statusCodes.success).json({ message: 'Tweet deleted successfully' });
    } catch (error) {
        console.log(error);
        return res.status(statusCodes.queryError).json({ message: 'Error deleting tweet' });
    }
};

/**
 * This function creates a new poll and saves it to the database using the pollModel schema and values passed to it from the postTweet function
 * @param {String} title: The title of the poll
 * @param {Number} duration_seconds: The duration of the poll in seconds
 * @param {Array} option_values: The options for the poll
 * @returns: The id of the newly created poll, or null if an error occurs
 * 
 */
const createPoll = async (title, duration_seconds, option_values) => {
    const newPoll = new pollModel({
        title: title,
        duration_seconds: duration_seconds,
        options: option_values.map(option => {
            return { option_value: option, num_votes: 0, voter_ids: [] };
        }),
    });
    console.log(newPoll);
    try {
        const poll = await newPoll.save();
        logger.info(`Successfully created poll with id: ${poll._id}`);
        setTimeout(closePoll, duration_seconds * 1000, poll._id);
        return { id: poll._id };
    } catch (error) {
        console.log(error);
        logger.error(`Error creating poll: ${error}`);
        return { error: error.message };
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
    var tweets = [];
    if(req.body.last_tweet_id) {
        const last_tweet_id = new ObjectId(req.body.last_tweet_id);
            try {
            // Find tweets that have an _id less than the last_tweet_id (older than the last tweet fetched by the client)
            var query = fetch_feed_query;
            query.unshift({ $match: { _id: { $lt: last_tweet_id } } });
            tweets = await tweetModel.aggregate(query);
            logger.info(`Successfully fetched tweets from the database`);
        } catch (error) {
                        logger.error("Error fetching tweets from the database:" + error);
            return res.status(statusCodes.queryError).json({ message: 'Error fetching tweets from the database' });
        }
    } else {
        try {
                            // If no last_tweet_id is provided, fetch the most recent tweets
                tweets = await tweetModel.aggregate(fetch_feed_query);
        } catch (error) {
            console.log(error);
            logger.error("Error fetching tweets from the database:" + error);
            return res.status(statusCodes.queryError).json({ message: 'Error fetching tweets from the database' });
        }
    }
    if (tweets.length > 0) 
        {
            return res.status(statusCodes.success).json({tweets: tweets, last_tweet_id: tweets[tweets.length - 1]._id});
        } else {
            return res.status(statusCodes.success).json({tweets: [], last_tweet_id: null});
        }
}

/**
 * This function fetches the next set of tweets from followed users in chronological order
 * @param {*} req: The request object
 * @param {*} res: The response object
 * @returns: A JSON object containing the fetched tweets and the id of the last tweet fetched
 */
const getFollowedTweets = async (req, res) => {
    user_email = req.user.email;
    var tweets = [];
    var followed_users = [];
    try {
        // Find the users that the current user follows
        const user = await userModel.findOne({ email: user_email });
        followed_users = user.following;
        logger.info(`Successfully fetched users that ${user_email} follows`);
    } catch (error) {
        logger.error(`Error fetching users that ${user_email} follows: ${error}`);
        return res.status(statusCodes.queryError).json({ message: 'Error fetching users that the current user follows' });
    }
    if(req.body.last_tweet_id) {
        last_tweet_id = new ObjectId(req.body.last_tweet_id);
        try {
            // Find tweets from the users that the current user follows that have an _id less than the last_tweet_id
            var query = fetch_feed_query;
            query.unshift({ $match: { author_email: { $in: followed_users }, _id: { $lt: last_tweet_id } } });
            tweets = await tweetModel.aggregate(query);
            logger.info(`Successfully fetched tweets from the database`);
        } catch (error) {
            logger.error(`Error fetching tweets from the database: ${error}`);
            return res.status(statusCodes.queryError).json({ message: 'Error fetching tweets from the database' });
        }
    } else {
        try {
            // Find tweets from the users that the current user follows
            var query = fetch_feed_query;
            query.unshift({ $match: { author_email: { $in: followed_users } } });
            tweets = await tweetModel.aggregate(query);
            logger.info(`Successfully fetched tweets from the database`);
        } catch (error) {
            logger.error(`Error fetching tweets from the database: ${error}`);
            return res.status(statusCodes.queryError).json({ message: 'Error fetching tweets from the database' });
        }
    }
if (tweets.length > 0) {
        return res.status(statusCodes.success).json({tweets: tweets, last_tweet_id: tweets[tweets.length - 1]._id});
    } else {
        return res.status(statusCodes.success).json({tweets: [], last_tweet_id: null});
    }
}

module.exports = {
    postTweet,
    getTweetById,
    editTweetById,
    deleteTweetById,
    getLiveTweets,
    getFollowedTweets,
    registerVote,
    likeTweet,
}
