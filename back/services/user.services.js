const pool = require('../boot/database/mysql_db_connect.js');
const { logger } = require('../middleware/winston.js');
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

module.exports = {
    followUser,
    unfollowUser,
};
