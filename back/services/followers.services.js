const logger = require("../middleware/winston");
const statusCodes = require('../constants/statusCodes.js');
const userModel = require('../models/userModel');

const followUser = async (req, res) => {
    const { followed_user_id } = req.params;
    const user_id  = req.user._id;
    try {
        await userModel.findOneAndUpdate( { _id: user_id }, { $addToSet: { following: followed_user_id } });
        await userModel.findOneAndUpdate( { _id: followed_user_id }, { $addToSet: { followers: user_id } });
        logger.info(`User with id ${user_id} has followed user with id ${followed_user_id}`);
        res.status(statusCodes.success).send('User followed successfully');
    } catch (error) {
        logger.error(`Error following user: ${error}`);
        res.status(statusCodes.queryError).send('Error following user');
    }
};

const unfollowUser = async (req, res) => {
    const { followed_user_id } = req.params;
    const  user_id  = req.user._id;
    try {
        await userModel.findOneAndUpdate( { _id: user_id }, { $pull: { following: followed_user_id } });
        await userModel.findOneAndUpdate( { _id: followed_user_id }, { $pull: { followers: user_id } });
        logger.info(`User with id ${user_id} has unfollowed user with id ${followed_user_id}`);
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
        const [followers] = await userModel.aggregate([
            {
                $match: { email: user_email }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'followers',
                    foreignField: '_id',
                    as: 'followers'
                }
            },
            {
                $unwind: '$followers'
            },
            {
                $project: {
                    followers: 1,
                    "followers.email": 1,
                    "followers.username": 1,
                    "followers.bio": 1,
                    "followers.profile_img": 1,
                }
            }
        ]);
        logger.info(`Retrieved followers of user with id ${user_id}`);
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
        const [following] = await userModel.aggregate([
            {
                $match: { email: user_email }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'following',
                    foreignField: '_id',
                    as: 'following'
                }
            },
            {
                $unwind: '$following'
            },
            {
                $project: {
                    following: 1,
                    "following.email": 1,
                    "following.username": 1,
                    "following.bio": 1,
                    "following.profile_img": 1,
                }
            }
        ]);
        logger.info(`Retrieved users that user with id ${user_id} is following`);
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
