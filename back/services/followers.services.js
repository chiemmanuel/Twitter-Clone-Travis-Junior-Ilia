const logger = require("../middleware/winston");
const statusCodes = require('../constants/statusCodes.js');
const userModel = require('../models/userModel');

const { createNeo4jSession } = require('../neo4j.config.js');


const followUser = async (req, res) => {
    const session = createNeo4jSession();

    try {
        const { followed_user_id } = req.params;
        const user_id = req.user._id;

        // Create a "FOLLOWS" relationship between the users
        const followUserQuery = `
            MATCH (u1:User {id: $userId}), (u2:User {id: $followedUserId})
            MERGE (u1)-[:FOLLOWS]->(u2)
        `;

        await session.run(followUserQuery, { userId: user_id, followedUserId: followed_user_id });

        logger.info(`User with id ${user_id} has followed user with id ${followed_user_id}`);
        return res.status(statusCodes.success).send('User followed successfully');
    } catch (error) {
        logger.error(`Error following user: ${error}`);
        return res.status(statusCodes.queryError).send('Error following user');
    } finally {
        await session.close();
    }
};


const unfollowUser = async (req, res) => {
    const session = createNeo4jSession();

    try {
        const { followed_user_id } = req.params;
        const user_id = req.user._id;

        console.log('unfollowUser');
        console.log(followed_user_id);
        console.log(user_id);

        // Remove the "FOLLOWS" relationship between the users
        const unfollowUserQuery = `
            MATCH (u1:User {id: $userId})-[r:FOLLOWS]->(u2:User {id: $followedUserId})
            DELETE r
        `;

        await session.run(unfollowUserQuery, { userId: user_id, followedUserId: followed_user_id });

        logger.info(`User with id ${user_id} has unfollowed user with id ${followed_user_id}`);
        console.log('User unfollowed successfully');
        return res.status(statusCodes.success).send('User unfollowed successfully');
    } catch (error) {
        logger.error(`Error unfollowing user: ${error}`);
        return res.status(statusCodes.queryError).send('Error unfollowing user');
    } finally {
        await session.close();
    }
};

/**
 * This function retrieves the followers of a user from the database
 * @param {*} req 
 * @param {*} res 
 * @returns a JSON object with the followers of the user
 */
const getFollowers = async (req, res) => {
    const session = createNeo4jSession();

    try {
        const { user_email } = req.params;

        const getFollowersQuery = `
            MATCH (u:User {email: $email})<-[:FOLLOWS]-(f:User)
            RETURN f {
                .id,
                .email,
                .username,
                .bio,
                .profile_img
            } AS follower
        `;

        const result = await session.run(getFollowersQuery, { email: user_email });

        const followers = result.records.map(record => record.get('follower'));

        logger.info(`Retrieved followers of user with email ${user_email}`);
        return res.status(statusCodes.success).json({ followers });
    } catch (error) {
        logger.error(`Error retrieving followers: ${error}`);
        return res.status(statusCodes.queryError).send('Error retrieving followers');
    } finally {
        await session.close();
    }
};

/**
 * This function retrieves the users that a user is following from the database
 * @param {*} req
 * @param {*} res
 * @returns a JSON object with the users that the user is following
 */
const getFollowing = async (req, res) => {
    const session = createNeo4jSession();

    try {
        const { user_email } = req.params;

        const getFollowersQuery = `
            MATCH (u:User)-[:FOLLOWS]->(f:User {email: $email})
            RETURN f {
                .id,
                .email,
                .username,
                .bio,
                .profile_img
            } AS following
        `;

        const result = await session.run(getFollowersQuery, { email: user_email });

        const followers = result.records.map(record => record.get('following'));

        logger.info(`Retrieved followings of user with email ${user_email}`);
        return res.status(statusCodes.success).json({ followers });
    } catch (error) {
        logger.error(`Error retrieving followings: ${error}`);
        return res.status(statusCodes.queryError).send('Error retrieving followings');
    } finally {
        await session.close();
    }
}


module.exports = {
    followUser,
    unfollowUser,
    getFollowers,
    getFollowing
};
