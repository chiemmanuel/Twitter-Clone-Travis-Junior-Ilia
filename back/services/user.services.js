const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require('../boot/database/mysql_db_connect');
const statusCodes = require('../constants/statusCodes');
const logger = require("../middleware/winston");
const tweetModel = require('../models/tweetModel');
const commentModel = require('../models/commentModel');
const ObjectId = require('mongoose').Types.ObjectId;
const fetch_feed_query = require ('../constants/fetchFeedConstants.js').fetch_feed_query;
const User = require('../models/userModel');

/**
 * This function updates user information in the database based on the provided fields
 * @param {*} req: The request object
 * @param {*} res: The response object
 * @returns: The res object with a status code and a message indicating the success or failure of the update
 */
const updateUser = async (req, res) => {
    try {
        console.log(req.session.user);
        const { email } = req.session.user;
        const { username, profile_img, bio, gender, dob, contact } = req.body;

        // Parse the incoming date string
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

        // Check if the desired username is already taken
        const existingUsername = await User.findOne({ username });

        if (existingUsername && existingUsername.email !== email) {
            return res.status(statusCodes.badRequest).json({ error: "Username already exists" });
        }

        const updateValues = {};
        
        if (username) {
            updateValues.username = username;

            // Update session's username if changed
            req.session.user.username = username;
        }
        if (profile_img) {
            updateValues.profile_img = profile_img;
        }

        if (bio) {
            updateValues.bio = bio;
        }

        if (gender) {
            updateValues.gender = gender;
        }

        if (parsedDate) {
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
        const { email } = req.session.user;
        const { oldPassword, newPassword } = req.body;

        if (!oldPassword || !newPassword) {
            return res.status(statusCodes.badRequest).json({ error: "Missing information" });
        }

        if (oldPassword === newPassword) {
            return res.status(statusCodes.badRequest).json({ error: "Old and new passwords cannot be the same" });
        }

        // Fetch user information from the database
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(statusCodes.badRequest).json({ message: "User not found" });
        }

        // Compare old password with the stored hashed password
        if (!bcrypt.compareSync(oldPassword, user.password)) {
            return res.status(statusCodes.badRequest).json({ message: "Old password is incorrect" });
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
        console.log("here");
        console.log(req.session.user);
        if (!req.session.user || typeof req.session.user !== 'object') {
            return res.status(statusCodes.badRequest).json({ message: "Invalid user object" });
        }
        console.log("here 2");
        const { _id } = req.session.user;

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
        const user = await User.findOne({ username });

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
 * This function fetches the tweets of a user based on the user's email
 * @param {*} req: The request object
 * @param {*} res: The response object
 * @returns: A JSON object containing the fetched tweets and the id of the last tweet fetched
 */
const getUserTweets = async (req, res) => {
    user_email = req.params.user_email;
    var tweets = [];
    var query = fetch_feed_query;
    if(req.body.last_tweet_id) {
        last_tweet_id = new ObjectId(req.body.last_tweet_id);
        try {
            query.unshift({ $match: { author_email: user_email, _id: { $lt: last_tweet_id } } });
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
        return res.status(statusCodes.success).json({tweets: [], last_tweet_id: null});
    }
}

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
        // Check if the user is already logged out
        if (!req.session.user || typeof req.session.user !== 'object') {
            return res.status(400).json({ message: "User is already logged out" });
        }
        // Remove the user object from the session
        req.session.user = null;
        // Destroy the session to log the user out
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

module.exports = {
    updateUser,
    updatePassword,
    getcurrentUser,
    logout,
    getUserByUsername,
    getUserTweets,
    getUserComments
};
