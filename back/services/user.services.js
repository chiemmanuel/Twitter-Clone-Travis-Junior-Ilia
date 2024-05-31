const { sendMessage } = require('../boot/socketio/socketio_connection.js');
const statusCodes = require('../constants/statusCodes');
const commentModel = require('../models/commentModel');
const tweetModel = require('../models/tweetModel');
const ObjectId = require('mongoose').Types.ObjectId;
const logger = require("../middleware/winston");
const User = require('../models/userModel');
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const createNeo4jSession = require('../neo4j.config');

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
                // Now, `formattedDate` can be used to store in MongoDB
            } else {
                // Handle the case where the incoming date is invalid
                return res
                    .status(statusCodes.badRequest)
                    .json({ error: "Invalid date format" });
            }
            updateValues.dob = parsedDate;
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
        const updateUserQuery = `
            MATCH (u:User {email: $email})
            SET u += $updateValues
            RETURN u
        `;

        await session.run(updateUserQuery, { email, updateValues });

        return res
            .status(statusCodes.success)
            .json({ message: "User information updated successfully" });

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
        console.error("Error while updating password", error.message);
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

        const result = await session.run(getUserQuery, { userId: Number(_id) });
        const userRecord = result.records[0];

        if (!userRecord) {
            return res
                .status(statusCodes.badRequest)
                .json({ message: "User not found" });
        }

        const user = userRecord.get('u').properties;

        return res
            .status(statusCodes.success)
            .json(user);

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

        return res
            .status(statusCodes.success)
            .json(user);

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
    const session = createNeo4jSession();

    try {
        const { userId } = req.params;

        // Cypher query to fetch tweets by a user
        const fetchUserTweetsQuery = `
            MATCH (u:User)-[:POSTED]->(t:Tweet)
            WHERE id(u) = $userId
            RETURN t
        `;

        const result = await session.run(
            fetchUserTweetsQuery, { userId: Number(userId) }
        );
        
        const tweets = result.records.map(record => {
            const tweet = record.get('t').properties;
            return { _id: tweet._id };
        });

        return res
            .status(statusCodes.success)
            .json(tweets);

    } catch (error) {
        return res
            .status(statusCodes.queryError)
            .json({ error: "Failed to get user tweets" });

    } finally {
        await session.close();
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
        const { userId } = req.params;

        // Cypher query to fetch tweets liked by a user
        const getUserLikedTweetsQuery = `
            MATCH (u:User)-[:LIKED]->(t:Tweet)
            WHERE id(u) = $userId
            RETURN t
        `;

        const result = await session.run(
            getUserLikedTweetsQuery, { userId: Number(userId) }
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
    username = req.params.username;
    var comments = [];
    try {
        // Find comments from the user with email user_email
        comments = await commentModel.find({ author_name: username });
        logger.info(`Successfully fetched comments from the database`);
    } catch (error) {
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
        await session.run(deleteUserQuery, { userId: Number(_id) });

        return res
            .status(statusCodes.success)
            .json({ message: "User deleted successfully" });

    } catch (error) {
        return res
            .status(statusCodes.queryError)
            .json({ error: "Failed to delete user" });

    } finally {
        await session.close();
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
