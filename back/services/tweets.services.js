const logger = require("../middleware/winston");
const statusCodes = require('../constants/statusCodes.js');
const redisCacheDurations = require('../constants/redisCacheDurations.js');
const tweetModel = require('../models/tweetModel.js');
const userModel = require('../models/userModel.js');
const ObjectId = require('mongoose').Types.ObjectId;
const { sendMessage } = require('../boot/socketio/socketio_connection.js');
const crypto = require('crypto');
const Redis = require('../boot/redis_client.js');

const getHashKey = (_filter) => {
    let retKey = '';
    if (_filter) {
      const text = JSON.stringify(_filter);
      retKey = crypto.createHash('sha256').update(text).digest('hex');
    }
    return 'CACHE_ASIDE_' + retKey;
  };


/**
 * TODO: Add socket.io to emit a tweet-created event to active clients
 * 
 * This function creates a new tweet and saves it to the database using the tweetModel schema
 * @param {*} req: The request object
 * @param {*} res: The response object
 * @returns: The res object with a status code and a message
 */
const postTweet = async (req, res) => {
    let tweetInfo = {
        author_id: req.user._id,
        author_username: req.user.username,
        author_email: req.user.email,
        author_profile_img: req.body.author_profile_img,
        content: req.body.content,
        media: req.body.media,  
        retweet_id: req.body.retweet_id,
        hashtags: req.body.hashtags,
        num_comments: 0,
        num_likes: 0,
        num_retweets: 0,
        num_views: 0,
        num_bookmarks: 0,
    } 
    if (req.body.poll) {
        let poll = {
            title: req.body.poll.title,
            duration_seconds: req.body.poll.duration_seconds,
            options: req.body.poll.options.map(option => {
                return { option_value: option, num_votes: 0, voter_ids: [] };
            }),
            isClosed: false,
        };
        if (poll.options.length < 2 || poll.options.length > 4) {
            return res.status(statusCodes.badRequest).json({ message: 'Poll must have between 2 and 4 options' });
        }
        if (poll.duration_seconds < 60) {
            return res.status(statusCodes.badRequest).json({ message: 'Poll duration must be at least 60 seconds' });
        }
        if (poll.title === '') {
            return res.status(statusCodes.badRequest).json({ message: 'Poll title cannot be empty' });
        }
        if (poll.options.some(option => option.option_value === '')) {
            return res.status(statusCodes.badRequest).json({ message: 'Poll options cannot be empty' });
        }
        if (poll.options.some(option => option.option_value.length > 25)) {
            return res.status(statusCodes.badRequest).json({ message: 'Poll options cannot be longer than 25 characters' });
        }
        tweetInfo.poll = poll;
    }
    console.log(tweetInfo);
    const newTweet = new tweetModel(tweetInfo);

    try {
        const result = await newTweet.save();
        const tweet_id = result._id;
        if (req.body.retweet_id) {
            // If it's a retweet, increment the retweet count for the original tweet
            await tweetModel.findByIdAndUpdate(req.body.retweet_id, { $inc: { num_retweets: 1 } });
            sendMessage(null, 'retweeted', { tweet_id: req.body.retweet_id});
        }
        if (result.poll.duration_seconds) {
            setTimeout(closePoll, result.poll.duration_seconds * 1000, tweet_id);
        }
        sendMessage(null, 'tweet-created', { tweet: result }	)
        return res.status(statusCodes.success).json({ message: 'Successfully created tweet', _id: tweet_id});
    } catch (error) {
        logger.error(`Error creating tweet: ${error}`);
        return res.status(statusCodes.queryError).json({ message: 'Error creating tweet' });
    }
}

/**
 * 
 * This function retrieves a tweet by its ID and returns it in the response
 * @param {*} req: The request object with tweetId in params
 * @param {*} res: The response object
 * @returns: The res object with a status code and the tweet in the message
 */
const getTweetById = async (req, res) => {
    const redisClient = Redis.getRedisClient();
    const tweetId = req.params.tweetId;
    logger.info(`Fetching tweet with id: ${tweetId}`)
    const reqHash = getHashKey({tweetId});
    const cachedTweet = await redisClient.get(reqHash).catch((err) => {
        logger.error(`Error fetching tweet from cache: ${err}`);
    });
    if (cachedTweet) {
        logger.info(`fetched tweet from cache: ${cachedTweet}`)
        return res.status(statusCodes.success).json({ tweet: JSON.parse(cachedTweet) });
    }
    else {
        try {
            var query = [
                { $lookup: { from: 'tweets', localField: 'retweet_id', foreignField: '_id', as: 'retweet' } },
                { $unwind: { path: '$retweet', preserveNullAndEmptyArrays: true } },
            ];
            if (query[0].$match) {
                query[0].$match._id = new ObjectId(tweetId);
            } else {
                query.unshift({ $match: { _id: new ObjectId(tweetId) } });
            }
            console.log(query);
            const tweet = await tweetModel.aggregate(query);
            
            if (tweet.length === 0) {
                return res.status(statusCodes.notFound).json({ message: 'Tweet not found' });
            }
            logger.info(`fetched tweet: ${tweet}`)
            await redisClient.set(reqHash, JSON.stringify(tweet[0]), 'EX', redisCacheDurations.getTweet);
            return res.status(statusCodes.success).json({ tweet: tweet[0] });
        } catch (error) {
            console.log(error);
            return res.status(statusCodes.queryError).json({ message: 'Error fetching tweet' });
        }
    }
};

/**
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

        await tweet.save();
        var query = [
            { $lookup: { from: 'tweets', localField: 'retweet_id', foreignField: '_id', as: 'retweet' } },
            { $unwind: { path: '$retweet', preserveNullAndEmptyArrays: true } },
        ];
        if (query[0].$match) {
            query[0].$match._id = new ObjectId(tweetId);
        } else {
            query.unshift({ $match: { _id: new ObjectId(tweetId) } });
        }
        const updatedTweet = await tweetModel.aggregate(query);
        console.log(updatedTweet);
        sendMessage(null, 'tweet-updated', { tweet: updatedTweet[0] });
        return res.status(statusCodes.success).json({ message: 'Tweet updated successfully', tweet: updatedTweet });
    } catch (error) {
        console.log(error);
        return res.status(statusCodes.queryError).json({ message: 'Error updating tweet' });
    }
};

/**
 * TODO: Update to query user's liked tweets from Neo4j database when implemented
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
        logger.info("roomId: ", req.user.email);
        console.log("eventName: ", 'update-likes');
        logger.info("message: ", { tweet: updatedTweet });
        sendMessage(null, 'update-likes', { tweet_id: tweetId, user_id: userId, dislike: true});
        return res.status(statusCodes.success).json({ message: 'unliked successfully', tweet: updatedTweet });
        } else {
            // If user has not liked the tweet, add them to the liked_by list
            tweet.liked_by.push(userId);

            const updatedTweet = await tweet.save();
            logger.info("roomId: ", req.user.email);
            console.log("eventName: ", 'update-likes');
            logger.info("message: ", { tweet: updatedTweet });
            sendMessage(null, 'update-likes', { tweet_id: tweetId, user_id: userId, dislike: false});
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
        sendMessage(null, 'tweet-deleted', { tweet_id: tweetId });
        return res.status(statusCodes.success).json({ message: 'Tweet deleted successfully' });
    } catch (error) {
        console.log(error);
        return res.status(statusCodes.queryError).json({ message: 'Error deleting tweet' });
    }
};


/**
 *
 * This function closes a poll by updating the isClosed field to true and emitting a poll-closed event to the client
 * @param {String} poll_id: The tweet id of the poll to be closed
 * @returns: Nothing
 */
const closePoll = async (poll_id) => {
    try {
        await tweetModel.findByIdAndUpdate(poll_id, { 'poll.isClosed': true });
        logger.info(`Successfully closed poll with id: ${poll_id}`);
        sendMessage(null, 'poll-close', { poll_id: poll_id });
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
    logger.info(`Registering vote for poll with id: ${poll_id}`)
    logger.info(`Option index: ${option_index}`)
    user_id = req.user._id;
    user_email = req.user.email;
    console.log(`User id: ${user_id}, User email: ${user_email}`)
    try {
        const result = await tweetModel.findById(poll_id).select('poll');
        const poll = result.poll;

        if (poll.isClosed) {
            logger.error(`Error registering vote: Poll with id ${poll_id} is closed`);
            return res.status(statusCodes.badRequest).json({ message: 'Error registering vote: Poll is closed' });
        }
        // Check if the user has already voted for an option in the poll
        for (option of poll.options){
            console.log(option)
            if (option.voter_ids.includes(user_id)) {
                logger.error(`Error registering vote: User with id ${user_id} has already voted for an option in poll with id ${poll_id}`);
                return res.status(statusCodes.badRequest).json({ message: 'Error registering vote: User has already voted for an option in this poll' });
            }
        }
        poll.options[option_index].num_votes += 1;
        poll.options[option_index].voter_ids.push(user_id);
        await tweetModel.findByIdAndUpdate(poll_id, { poll: poll });
        logger.info(`Successfully registered vote for poll with id: ${poll_id}`);
        sendMessage(null, 'poll-vote', { poll_id: poll_id, option_index: option_index, voter_id: user_id});
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
    logger.info(`Fetching tweets from the database`);
    const redisClient = Redis.getRedisClient();
    var query = [
        { $sort: { created_at: -1 } },
        { $limit: 10 },
        { $lookup: { from: 'tweets', localField: 'retweet_id', foreignField: '_id', as: 'retweet' } },
        { $unwind: { path: '$retweet', preserveNullAndEmptyArrays: true } },
    ];
    if(req.query.last_tweet_id) {
        const reqHash = getHashKey({last_tweet_id: req.query.last_tweet_id});
        const cachedTweets = await redisClient.get(reqHash).catch((err) => {
            logger.error(`Error fetching tweets from cache: ${err}`);
        });
        if (cachedTweets) {
            logger.info(`fetched tweets from cache: ${cachedTweets}`)
            return res.status(statusCodes.success).json({ tweets: JSON.parse(cachedTweets) });
        }
        const last_tweet_id = new ObjectId(req.query.last_tweet_id);
            try {
            // Find tweets that have an _id less than the last_tweet_id (older than the last tweet fetched by the client)
            if (query[0].$match) {
                query[0].$match._id = { $lt: last_tweet_id };
            } else {
                query.unshift({ $match: { _id: { $lt: last_tweet_id } } });
            }
            tweets = await tweetModel.aggregate(query);
            logger.info(`Successfully fetched tweets from the database`);
            await redisClient.set(reqHash, JSON.stringify(tweets), 'EX', redisCacheDurations.getLiveTweets).catch((err) => {
                logger.error(`Error caching tweets: ${err}`);
            });
            logger.info(`Successfully cached tweets`);
        } catch (error) {
            logger.error("Error fetching tweets from the database:" + error);
            return res.status(statusCodes.queryError).json({ message: 'Error fetching tweets from the database' });
        }
    } else {
        try {
            // If no last_tweet_id is provided, fetch the most recent tweets
            const reqHash = getHashKey({last_tweet_id: null});
            const cachedTweets = await redisClient.get(reqHash).catch((err) => {
                logger.error(`Error fetching tweets from cache: ${err}`);
            });

            if (cachedTweets) {
                logger.info(`fetched tweets from cache: ${cachedTweets}`)
                return res.status(statusCodes.success).json({ tweets: JSON.parse(cachedTweets) });
            }
            tweets = await tweetModel.aggregate(query);
            logger.info(`Successfully fetched tweets from the database`);
            await redisClient.set(reqHash, JSON.stringify(tweets), 'EX', redisCacheDurations.getLiveTweets).catch((err) => {
                logger.error(`Error caching tweets: ${err}`);
            });
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
    user_id = req.user._id;
    var tweets = [];
    var followed_users = [];
    const redisClient = Redis.getRedisClient();
    try {
        // Find the users that the current user follows
        const user = await userModel.findOne({ _id: user_id });
        followed_users = user.following;
        logger.info(`Successfully fetched users that ${user_id} follows`);
    } catch (error) {
        logger.error(`Error fetching users that ${user_id} follows: ${error}`);
        return res.status(statusCodes.queryError).json({ message: 'Error fetching users that the current user follows' });
    }
    var query = [
        { $sort: { created_at: -1 } },
        { $limit: 10 },
        { $lookup: { from: 'tweets', localField: 'retweet_id', foreignField: '_id', as: 'retweet' } },
        { $unwind: { path: '$retweet', preserveNullAndEmptyArrays: true } },
    ];
    if(req.query.last_tweet_id) {
        last_tweet_id = new ObjectId(req.query.last_tweet_id);
        try {
            const reqHash = getHashKey({last_tweet_id: req.query.last_tweet_id, followed_users: followed_users});
            const cachedTweets = await redisClient.get(reqHash).catch((err) => {
                logger.error(`Error fetching tweets from cache: ${err}`);
            });
            if (cachedTweets) {
                logger.info(`fetched tweets from cache: ${cachedTweets}`)
                return res.status(statusCodes.success).json({ tweets: JSON.parse(cachedTweets) });
            } 
            // Find tweets from the users that the current user follows that have an _id less than the last_tweet_id
            if (query[0].$match) {
                query[0].$match._id = { $lt: last_tweet_id };
                query[0].$match.author_id = { $in: followed_users };
            } else {
                query.unshift({ $match: { author_id: { $in: followed_users }, _id: { $lt: last_tweet_id } } });
            }

            tweets = await tweetModel.aggregate(query);
            await redisClient.set(reqHash, JSON.stringify(tweets), 'EX', redisCacheDurations.getFollowedTweets).catch((err) => {
                logger.error(`Error caching tweets: ${err}`);
            });
            console.log(tweets);
            logger.info(`Successfully fetched tweets from the database`);
        } catch (error) {
            logger.error(`Error fetching tweets from the database: ${error}`);
            return res.status(statusCodes.queryError).json({ message: 'Error fetching tweets from the database' });
        }
    } else {
        try {
            const reqHash = getHashKey({last_tweet_id: null, followed_users: followed_users});
            const cachedTweets = await redisClient.get(reqHash).catch((err) => {
                logger.error(`Error fetching tweets from cache: ${err}`);
            }); 
            if (cachedTweets) {
                logger.info(`fetched tweets from cache: ${cachedTweets}`)
                return res.status(statusCodes.success).json({ tweets: JSON.parse(cachedTweets) });
            }
            // Find tweets from the users that the current user follows
            if (query[0].$match) {
                query[0].$match.author_id = { $in: followed_users} ;
            } else {
                query.unshift({ $match: { author_id: { $in: followed_users } } });
            }
            tweets = await tweetModel.aggregate(query);
            await redisClient.set(reqHash, JSON.stringify(tweets), 'EX', redisCacheDurations.getFollowedTweets).catch((err) => {
                logger.error(`Error caching tweets: ${err}`);
            });
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

/**
 * This function increments the views field of a tweet by the given amount
 * @param {*} req: The request object with tweetId in params and amount in body
 * @param {*} res: The response object
 * @returns: The res object with a status code and a message indicating the success or failure of the update
 */
const incrementViews = async (req, res) => {
    const tweetId = req.params.tweetId;
    const amount = req.body.amount;
    try {
        const tweet = await tweetModel.findByIdAndUpdate(tweetId, { $inc: { num_views: amount } });
        logger.info(`Successfully incremented views for tweet with id: ${tweetId}`);
        sendMessage(null, 'update-views', { tweet_id: tweetId, views: tweet.num_views });
        return res.status(statusCodes.success).json({ message: 'Successfully incremented views' });
    } catch (error) {
        logger.error(`Error incrementing views: ${error}`);
        return res.status(statusCodes.queryError).json({ message: 'Error incrementing views' });
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
    incrementViews,
}
