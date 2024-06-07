const { sendMessage } = require('../boot/socketio/socketio_connection.js');
const statusCodes = require('../constants/statusCodes');
const commentModel = require('../models/commentModel');
const ObjectId = require('mongoose').Types.ObjectId;
const User = require('../models/userModel');
const Tweet = require('../models/tweetModel');
const Redis = require('../boot/redis_client');
const redisCacheDurations = require('../constants/redisCacheDurations');
const crypto = require('crypto');

const getHashKey = (_filter) => {
    let retKey = '';
    if (_filter) {
      const text = JSON.stringify(_filter);
      retKey = crypto.createHash('sha256').update(text).digest('hex');
    }
    return 'CACHE_ASIDE_' + retKey;
  };

/**
 * This function updates user information in the database based on the provided fields
 * @param {*} req: The request object
 * @param {*} res: The response object
 * @returns: The res object with a status code and a message indicating the success or failure of the update
 */
const updateUser = async (req, res) => {
    const session = createNeo4jSession();

    try {
        const { email } = req.user;
        const { username, profile_img, bio, gender, dob, contact } = req.body;

        // Check if the desired username is already taken
        const existingUsernameQuery = `
            MATCH (u:User {username: $username})
            WHERE u.email <> $email
            RETURN u
        `;

        const existingUsername = await session.run(existingUsernameQuery, { username, email });

        if (existingUsername.records.length > 0) {
            return res
                .status(statusCodes.badRequest)
                .json({ error: "Username already exists" });
        }

        const updateValues = {};

        if (username) {
            sendMessage(null, 'update-username', { old_username: req.user.username, new_username: username, _id: req.user._id });
            updateValues.username = username;

            // Update session's username if changed
            req.user.username = username;
        }

        if (profile_img) {
            updateValues.profile_img = profile_img;
            sendMessage(null, 'update-profile-image', { author_name: username, profile_img: profile_img, _id: req.user._id });
        }

        if (bio) {
            updateValues.bio = bio;
        }

        if (gender) {
            updateValues.gender = gender;
        }

        if (dob) {
            // Parse the incoming date string if it exists
            const parsedDate = new Date(dob);

            // Check if the parsed date is a valid date
            if (!isNaN(parsedDate)) {
                // Format the date to 'YYYY-MM-DD'
                const formattedDate = parsedDate.toISOString().split('T')[0];
                updateValues.dob = formattedDate;
            } else {
                return res
                    .status(statusCodes.badRequest)
                    .json({ error: "Invalid date format" });
            }
        }

        if (contact) {
            updateValues.contact = contact;
        }

        if (Object.keys(updateValues).length === 0) {
            return res
                .status(statusCodes.badRequest)
                .json({ error: "No fields to update" });
        }

        // Update user information in the database
        const result = await User.findOneAndUpdate({ email }, updateValues);
        console.log(result);
        let tweet_fields = {};
        if (updateValues.username) {
            tweet_fields.author_username = updateValues.username;
        }
        if (updateValues.profile_img) {
            tweet_fields.author_profile_img = updateValues.profile_img;
        }
        await Tweet.updateMany({ author_email: email }, tweet_fields).then(
            (result) => logger.info(`Updated ${result.nModified} tweets with new user information`)
        ).catch((err) => logger.error(err));
        return res.status(statusCodes.success).json({ message: "User information updated successfully" });
    } catch (error) {
        return res
            .status(statusCodes.queryError)
            .json({ error: "Failed to update user information" });

    } finally {
        await session.close();
    }
};

/**
 * This function updates the user password in the database
 * @param {*} req: The request object
 * @param {*} res: The response object
 * @returns: The res object with a status code and a message indicating the success or failure of the update
 */
const updatePassword = async (req, res) => {
    const session = createNeo4jSession();

    try {
        const { email } = req.user;
        const { oldPassword, newPassword } = req.body;

        if (!oldPassword || !newPassword) {
            return res
                .status(statusCodes.badRequest)
                .json({ error: "Missing information" });
        }

        if (oldPassword === newPassword) {
            return res
                .status(statusCodes.badRequest)
                .json({ error: "Old and new passwords cannot be the same" });
        }

        // Fetch user information from the database
        const userQuery = `
            MATCH (u:User {email: $email})
            RETURN u
        `;

        const result = await session.run(userQuery, { email });
        const userRecord = result.records[0];

        if (!userRecord) {
            return res
                .status(statusCodes.badRequest)
                .json({ message: "User not found" });
        }

        const user = userRecord.get('u').properties;

        // Compare old password with the stored hashed password
        if (!bcrypt.compareSync(oldPassword, user.password)) {
            return res
                .status(statusCodes.badRequest)
                .json({ message: "Old password is incorrect" });
        }

        // Hash and update the new password
        const hash = bcrypt.hashSync(newPassword, 10);

        const updatePasswordQuery = `
            MATCH (u:User {email: $email})
            SET u.password = $hash
            RETURN u
        `;

        await session.run(updatePasswordQuery, { email, hash });

        return res
            .status(statusCodes.success)
            .json({ message: "Password updated successfully" });

    } catch (error) {
        return res
            .status(statusCodes.queryError)
            .json({ error: "Internal server error" });

    } finally {
        await session.close();
    }
};

/**
 * This function retrieves user information from the database
 * @param {*} req: The request object
 * @param {*} res: The response object
 * @returns: The res object with a status code and the user information in the message
 */
const getcurrentUser = async (req, res) => {
    const session = createNeo4jSession();

    try {
        const { _id } = req.user;

        // Fetch user information from the database based on the _id
        const getUserQuery = `
            MATCH (u:User)
            WHERE id(u) = $userId
            RETURN u
        `;

        const result = await session.run(getUserQuery, { userId: toNeo4jId(_id) });
        const userRecord = result.records[0];

        if (!userRecord) {
            return res
                .status(statusCodes.badRequest)
                .json({ message: "User not found" });
        }

        const user = userRecord.get('u').properties;
        return res.status(statusCodes.success).json(user);

    } catch (error) {
        return res
            .status(statusCodes.queryError)
            .json({ error: "Failed to get user" });

    } finally {
        await session.close();
    }
};

/**
 * This function retrieves user information from the database based on the username
 * @param {*} req: The request object with the username in params
 * @param {*} res: The response object
 * @returns: The res object with a status code and the user information in the message
 */
const getUserByUsername = async (req, res) => {
    const session = createNeo4jSession();

    try {
        const { username } = req.params;

        // Fetch user information from the database based on the username
        const getUserQuery = `
            MATCH (u:User {username: $username})
            RETURN u
        `;

        const result = await session.run(getUserQuery, { username });
        const userRecord = result.records[0];

        if (!userRecord) {
            return res
                .status(statusCodes.badRequest)
                .json({ message: "User not found" });
        }

        const user = userRecord.get('u').properties;
        return res.status(statusCodes.success).json(user);

    } catch (error) {
        return res
            .status(statusCodes.queryError)
            .json({ error: "Failed to get user" });
            
    } finally {
        await session.close();
    }
};

/**
 * This function fetches the tweets of a user based on the user's email
 * @param {*} req: The request object
 * @param {*} res: The response object
 * @returns: A JSON object containing the fetched tweets and the id of the last tweet fetched
 */
const getUserTweets = async (req, res) => {
    user_email = req.params.user_email;
    var tweets = [];
    const redisClient = Redis.getRedisClient();
    var query = [
        { $sort: { created_at: -1 } },
        { $limit: 10 },
        { $lookup: { from: 'tweets', localField: 'retweet_id', foreignField: '_id', as: 'retweet' } },
        { $unwind: { path: '$retweet', preserveNullAndEmptyArrays: true } },
    ];
    if(req.body.last_tweet_id) {
        const requestKey = getHashKey({ user_email: user_email, last_tweet_id: req.body.last_tweet_id });
        const cachedData = await redisClient.get(requestKey).catch((err) => console.error(err));
        if (cachedData) {
            logger.info("Fetched tweets from cache");
            tweets = JSON.parse(cachedData);
        }
        else {
            last_tweet_id = new ObjectId(req.body.last_tweet_id);
            try {
                if (query[0].$match) {
                    query[0].$match.author_email = user_email;
                    query[0].$match._id.$lt = last_tweet_id;
                } else {
                    query.unshift({ $match: { author_email: user_email, _id: { $lt: last_tweet_id } } });
                }
                // Find tweets from the user with email user_email that have an _id less than the last_tweet_id
                tweets = await tweetModel.aggregate(query);
                logger.info(`Successfully fetched tweets from the database`);
                await redisClient.set(requestKey, JSON.stringify(tweets)).then(
                    async () => {
                        await redisClient.expire(requestKey, redisCacheDurations.userTweets).catch((err) => logger.error(err));
                        logger.info(`Successfully cached tweets for user ${user_email}`);
                }).catch((err) => {
                    logger.error(`Error caching tweets for user ${user_email}: ${err}`);
                });
            } catch (error) {
                return {error: error};
            }
    }
    } else {
        const requestKey = getHashKey({ user_email: user_email });
        const cachedData = await redisClient.get(requestKey).catch((err) => console.error(err));
        if (cachedData) {
            logger.info("Fetched tweets from cache");
            tweets = JSON.parse(cachedData);
        }
        else {
            try {
                query.unshift({ $match: { author_email: user_email } });
                // Find tweets from the user with email user_email
                tweets = await tweetModel.aggregate(query);
                await redisClient.set(requestKey, JSON.stringify(tweets)).then(
                    async () => {
                        await redisClient.expire(requestKey, redisCacheDurations.userTweets).catch((err) => logger.error(err));
                        logger.info(`Successfully cached tweets for user ${user_email}`);
                }).catch((err) => {
                    logger.error(`Error caching tweets for user ${user_email}: ${err}`);
                });
            } catch (error) {
                return res.status(statusCodes.queryError).json({ error: error });
            }
            logger.info(`Successfully fetched tweets from the database`);
        }
    }
    if (tweets.length > 0) {
        return res.status(statusCodes.success).json({tweets: tweets, last_tweet_id: tweets[tweets.length - 1]._id});
    } else {
        console.log('No tweets found');
        return res.status(statusCodes.success).json({tweets: [], last_tweet_id: null});
    }
};
/**
 * This function finds all the tweets liked by a user based on the user's _id from the request
 * @param {*} req: The request object
 * @param {*} res: The response object
 * @returns {Object} A JSON object containing the liked tweets or an empty array
 */
const getUserLikedTweets = async (req, res) => {
    const session = createNeo4jSession();

    try {
        const { email } = req.params;

        // Cypher query to fetch tweets liked by a user
        const getUserLikedTweetsQuery = `
            MATCH (u:User)-[:LIKED]->(t:Tweet)
            WHERE u.email = $email
            RETURN t
        `;

        const result = await session.run(
            getUserLikedTweetsQuery, { email: email }
        );

        const tweets = result.records.map(record => {
            const tweet = record.get('t').properties;
            return { _id: tweet._id };
        });

        return res.status(statusCodes.success).json(tweets);

    } catch (error) {
        return res
            .status(statusCodes.queryError)
            .json({ error: "Failed to get user liked tweets" });

    } finally {
        await session.close();
    }
};


/**
 * This function fetches the comments of a given user
 * @param {*} req: The request object
 * @param {*} res: The response object
 * @returns: A JSON object containing the fetched comments
 */
const getUserComments = async (req, res) => {
    const redisClient = Redis.getRedisClient();
    const username = req.params.username;
    var comments = [];
    try {
        // Find comments from the user with email user_email
        const requestKey = getHashKey({ username: username });
        const cachedData = await redisClient.get(requestKey).catch((err) => logger.error(err));
        if (!cachedData) {
            comments = await commentModel.find({ author_name: username });
            logger.info(`Successfully fetched comments from the database`);
            await redisClient.set(requestKey, JSON.stringify(comments)).then(
                async () => {
                    await redisClient.expire(requestKey, redisCacheDurations.userComments).catch((err) => logger.error(err));
                    logger.info(`Successfully cached comments for user ${username}`);
            }).catch((err) => {
                logger.error(`Error caching comments for user ${username}: ${err}`);
            });
        } else {
            comments = JSON.parse(cachedData);
            logger.info("Fetched comments from cache");
        }
    } catch (error) {
        logger.error("Error while fetching comments", error);
        return res.status(statusCodes.queryError).json({ error: error });
    }
    return res.status(statusCodes.success).json({ comments: comments });
}

/**
 * This function logs the user out by destroying the session
 * @param {*} req: The request object
 * @param {*} res: The response object
 * @returns: The res object with a status code and a message indicating the success of the logout
 */
const logout = (req, res) => {
    try {
        req.session.user = null;
        req.session.destroy((err) => {
            if (err) {
                console.error("Error while destroying session:", err);
                return res.status(500).json({ error: "Failed to log out user" });
            }

            return res.status(200).json({ message: "User successfully logged out" });
        });
    } catch (error) {
        console.error("Error during logout:", error.message);
        return res.status(500).json({ error: "Internal server error" });
    }
};
/**
 * This function deletes the current user from the database
 * @param {*} req: The request object
 * @param {*} res: The response object
 * @returns: The res object with a status code and a message indicating success or failure
 */
const deleteCurrentUser = async (req, res) => {
    const session = createNeo4jSession();

    try {
        const { _id } = req.session.user;

        // Cypher query to delete the user and all related data
        const deleteUserQuery = `
            MATCH (u:User)
            WHERE id(u) = $userId
            DETACH DELETE u
        `;

        // Execute the delete query
        const result = await session.run(deleteUserQuery, { userId: toNeo4jId(_id) });
        
        return res
            .status(statusCodes.success)
            .json({ message: "User deleted successfully" });

    } catch (error) {
        console.log(error);
        return res
            .status(statusCodes.queryError)
            .json({ error: "Failed to delete user" });

    } finally {
        await session.close();
    }
};

module.exports = {
    logout,
    updateUser,
    getUserTweets,
    getcurrentUser,
    updatePassword,
    getUserComments,
    deleteCurrentUser,
    getUserByUsername,
    getUserLikedTweets,
};
