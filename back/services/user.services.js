const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const statusCodes = require('../constants/statusCodes');
const logger = require("../middleware/winston");
const tweetModel = require('../models/tweetModel');
const commentModel = require('../models/commentModel');
const ObjectId = require('mongoose').Types.ObjectId;
const { sendMessage } = require('../boot/socketio/socketio_connection.js');
const { fetch_feed_query, fetch_tweet_query } = require ('../constants/fetchFeedConstants.js');
const User = require('../models/userModel');

/**
 * This function updates user information in the database based on the provided fields
 * @param {*} req: The request object
 * @param {*} res: The response object
 * @returns: The res object with a status code and a message indicating the success or failure of the update
 */
const updateUser = async (req, res) => {
    try {
        console.log(req.user);
        const { email } = req.user;
        const { username, profile_img, bio, gender, dob, contact } = req.body;
        console.log("Updating user information");

        // Check if the desired username is already taken
        const existingUsername = await User.findOne({ username });

        if (existingUsername && existingUsername.email !== email) {
            return res.status(statusCodes.badRequest).json({ error: "Username already exists" });
        }

        const updateValues = {};
        
        if (username) {
            sendMessage(null, 'update-username', { old_username: req.user.username, new_username: username , _id: req.user._id});
            updateValues.username = username;

            // Update session's username if changed
            req.user.username = username;
        }
        if (profile_img) {
            updateValues.profile_img = profile_img;
            sendMessage(null, 'update-profile-image', { author_name: username, profile_img: profile_img, _id: req.user._id});
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
            // Now, `formattedDate` can be used to store in MongoDB
            console.log(formattedDate);
        } else {
            console.error("Invalid date format");
            // Handle the case where the incoming date is invalid
            return res.status(statusCodes.badRequest).json({ error: "Invalid date format" });
        }
            updateValues.dob = parsedDate;
        }

        if (contact) {
            updateValues.contact = contact;
        }

        if (Object.keys(updateValues).length === 0) {
            return res.status(statusCodes.badRequest).json({ error: "No fields to update" });
        }

        // Update user information in the database
        await User.findOneAndUpdate({ email }, updateValues);

        return res.status(statusCodes.success).json({ message: "User information updated successfully" });
    } catch (error) {
        console.error("Error while updating user information", error.message);
        return res.status(statusCodes.queryError).json({ error: "Failed to update user information" });
    }
};

/**
 * This function updates the user password in the database
 * @param {*} req: The request object
 * @param {*} res: The response object
 * @returns: The res object with a status code and a message indicating the success or failure of the update
 */
const updatePassword = async (req, res) => {
    try {
        const { email } = req.user;
        console.log(req.user);
        console.log(email);
        console.log(req.body);

        const { oldPassword, newPassword } = req.body;
        console.log("Updating password");

        if (!oldPassword || !newPassword) {
            return res.status(statusCodes.badRequest).json({ error: "Missing information" });
            console.log("Missing information");
        }

        if (oldPassword === newPassword) {
            return res.status(statusCodes.badRequest).json({ error: "Old and new passwords cannot be the same" });
            console.log("Old and new passwords cannot be the same");
        }

        // Fetch user information from the database
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(statusCodes.badRequest).json({ message: "User not found" });
            console.log("User not found");
        }

        // Compare old password with the stored hashed password
        if (!bcrypt.compareSync(oldPassword, user.password)) {
            return res.status(statusCodes.badRequest).json({ message: "Old password is incorrect" });
            console.log("Old password is incorrect");
        }

        // Hash and update the new password
        const hash = bcrypt.hashSync(newPassword, 10);
        await User.findOneAndUpdate({ email }, { password: hash });

        return res.status(statusCodes.success).json({ message: "Password updated successfully" });
    } catch (error) {
        console.error("Error in try-catch block", error.message);
        return res.status(statusCodes.queryError).json({ error: "Internal server error" });

    }
};

/**
 * This function retrieves user information from the database
 * @param {*} req: The request object
 * @param {*} res: The response object
 * @returns: The res object with a status code and the user information in the message
 */
const getcurrentUser = async (req, res) => {
    try {
        console.log("getting current user")
        const { _id } = req.user;

        // Fetch user information from the database based on the email
        const user = await User.findById({ _id });

        console.log(user);

        if (!user) {
            return res.status(statusCodes.badRequest).json({ message: "User not found" });
        }

        return res.status(statusCodes.success).json(user);
    } catch (error) {
        console.error("Error while getting user from MongoDB", error.message);
        return res.status(statusCodes.queryError).json({ error: "Failed to get user" });
    }
};

/**
 * This function retrieves user information from the database based on the username
 * @param {*} req: The request object with the username in params
 * @param {*} res: The response object
 * @returns: The res object with a status code and the user information in the message
 */
const getUserByUsername = async (req, res) => {
    try {
        const { username } = req.params;
        logger.info(`Fetching user with username: ${username}`);

        // Fetch user information from the database based on the username
        const user = await User.findOne({ username : username });

        if (!user) {
            console.log("User not found");
            return res.status(statusCodes.badRequest).json({ message: "User not found" });
        }
        console.log(user);
        return res.status(statusCodes.success).json(user);
    } catch (error) {
        console.error("Error while getting user from MongoDB", error.message);
        return res.status(statusCodes.queryError).json({ error: "Failed to get user" });
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
    console.log(user_email);
    var tweets = [];
    var query = fetch_feed_query;
    if(req.body.last_tweet_id) {
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
        } catch (error) {
            return {error: error};
        }
    } else {
        try {
            query.unshift({ $match: { author_email: user_email } });
            // Find tweets from the user with email user_email
            tweets = await tweetModel.aggregate(query);
        } catch (error) {
            return res.status(statusCodes.queryError).json({ error: error });
        }
    }
    if (tweets.length > 0) {
        return res.status(statusCodes.success).json({tweets: tweets, last_tweet_id: tweets[tweets.length - 1]._id});
    } else {
        console.log('No tweets found');
        return res.status(statusCodes.success).json({tweets: [], last_tweet_id: null});
    }
}
/**
 * This function finds all the tweets liked by a user based on the user's _id from the request
 * @param {*} req: The request object
 * @param {*} res: The response object
 * @returns {Object} A JSON object containing the liked tweets or an empty array
 */
const getUserLikedTweets = async (req, res) => {
    const { _id } = req.params;
    console.log('Fetching liked tweets for user with _id:', _id);
    console.log(_id);
    try {
        // Find tweets where the given user _id is present in the liked_by array
        var query = fetch_tweet_query;
        if (query[0].$match) {
            query[0].$match.liked_by = new ObjectId(_id);
        } else {
            query.unshift({ $match: { liked_by: new ObjectId(_id) }});
        }
        const likedTweets = await tweetModel.aggregate(query);

        if (likedTweets.length > 0) {
            return res.status(statusCodes.success).json({ status: 'success', likedTweets: likedTweets });
        } else {
            console.log('No liked tweets found');
            return res.status(statusCodes.success).json({ status: 'success', likedTweets: [] });
        }
    } catch (error) {
        // Log the error and return an error response
        console.error('Error finding liked tweets:', error);
        return res.status(statusCodes.serverError).json({ status: 'error', error: error });
    }
};


/**
 * This function fetches the comments of a given user
 * @param {*} req: The request object
 * @param {*} res: The response object
 * @returns: A JSON object containing the fetched comments
 */
const getUserComments = async (req, res) => {
    username = req.params.username;
    var comments = [];
    try {
        // Find comments from the user with email user_email
        comments = await commentModel.find({ author_name: username });
        logger.info(`Successfully fetched comments from the database`);
    } catch (error) {
        return res.status(statusCodes.queryError).json({ error: error });
    }
    return res.status(statusCodes.success).json({comments: comments});
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
    try {
        const { _id } = req.session.user;

        // Check if the user exists before attempting to delete
        const existingUser = await User.findById({ _id });
        if (!existingUser) {
            return res.status(statusCodes.badRequest).json({ message: "User not found" });
        }

        // Perform the user deletion
        await User.findByIdAndDelete({ _id });

        return res.status(statusCodes.success).json({ message: "User deleted successfully" });
    } catch (error) {
        console.error("Error while deleting user from MongoDB", error.message);
        return res.status(statusCodes.serverError).json({ error: "Failed to delete user" });
    }
};



module.exports = {
    updateUser,
    updatePassword,
    getcurrentUser,
    logout,
    deleteCurrentUser,
    getUserByUsername,
    getUserTweets,
    getUserLikedTweets,
    getUserComments
};
