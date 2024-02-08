const pool = require('../boot/database/mysql_db_connect.js');
const logger = require("../middleware/winston");
const statusCodes = require('../constants/statusCodes.js');

const followUser = async (req, res) => {
    const { followed_user } = req.params;
    const { user_email } = req.user;
    
    try {
        await pool.query('INSERT INTO follows (follower_id, following_id) VALUES (?, ?)', [user_email, followed_user]);
        logger.info(`User with email ${user_email} has followed user with email ${followed_user}`);
        res.status(statusCodes.success).send('User followed successfully');
    } catch (error) {
        logger.error(`Error following user: ${error}`);
        res.status(statusCodes.queryError).send('Error following user');
    }
};

const unfollowUser = async (req, res) => {
    const { followed_user } = req.params;
    const { user_email } = req.user;

    try {
        await pool.query('DELETE FROM follows WHERE follower_id = ? AND following_id = ?', [user_email, followed_user]);
        logger.info(`User with email ${user_email} has unfollowed user with email ${followed_user}`);
        res.status(statusCodes.success).send('User unfollowed successfully');
    } catch (error) {
        logger.error(`Error unfollowing user: ${error}`);
        res.status(statusCodes.queryError).send('Error unfollowing user');
    }
};

/**
 * This function retrieves the followers of a user from the database
 * @param {*} req 
 * @param {*} res 
 * @returns a JSON object with the followers of the user
 */
const getFollowers = async (req, res) => {
    const { user_email } = req.params;
    try {
        const [followers] = await pool.query(`SELECT u.email, u.username, u.bio FROM users u INNER JOIN follows f ON f.follower_id = u.email AND f.following_id = ?`, [user_email]);
        logger.info(`Retrieved followers for user with email ${user_email}`);
        res.status(statusCodes.success).json(followers);
    } catch (error) {
        logger.error(`Error retrieving followers: ${error}`);
        res.status(statusCodes.queryError).send('Error retrieving followers');
    }
}

/**
 * This function retrieves the users that a user is following from the database
 * @param {*} req
 * @param {*} res
 * @returns a JSON object with the users that the user is following
 */
const getFollowing = async (req, res) => {
    const { user_email } = req.params;
    try {
        const [following] = await pool.query(`SELECT u.email, u.username, u.bio FROM users u INNER JOIN follows f ON f.following_id = u.email AND f.follower_id = ?`, [user_email]);
        logger.info(`Retrieved users that user with email ${user_email} is following`);
        res.status(statusCodes.success).json(following);
    } catch (error) {
        logger.error(`Error retrieving following: ${error}`);
        res.status(statusCodes.queryError).send('Error retrieving following');
    }
}


module.exports = {
    followUser,
    unfollowUser,
    getFollowers,
    getFollowing
};
