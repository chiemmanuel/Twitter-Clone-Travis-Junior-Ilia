const { createNeo4jSession } = require('../boot/neo4j.config.js');
const statusCodes = require('../constants/statusCodes.js');
const logger = require("../middleware/winston");

const followUser = async (req, res) => {
    const session = createNeo4jSession();

    try {
        const { user_email } = req.params;
        const follower_user_email = req.user.email;

        if (user_email === follower_user_email) {
            throw new Error('User cannot follow his own account.');
        }

        // Create a "FOLLOWS" relationship between the users
        const followUserQuery = `
            MATCH (u1:User {email: $followerEmail}), (u2:User {email: $followedEmail})
            MERGE (u1)-[:FOLLOWS]->(u2)
        `;

        await session.run(followUserQuery, { 
            followerEmail: follower_user_email, followedEmail: user_email 
        });

        logger.info(
            `User with email ${follower_user_email} has followed user with email ${user_email}`
        );
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
        const { user_email } = req.params;
        const follower_user_email = req.user.email;

        if (user_email === follower_user_email) {
            throw new Error('User cannot unfollow his own account.');
        }

        // Remove the "FOLLOWS" relationship between the users
        const unfollowUserQuery = `
            MATCH (u1:User {email: $followerEmail})-[r:FOLLOWS]->(u2:User {email: $followedEmail})
            DELETE r
        `;

        await session.run(unfollowUserQuery, { 
            followerEmail: follower_user_email, followedEmail: user_email 
        });

        logger.info(
            `User with email ${follower_user_email} has unfollowed user with email ${user_email}`
        );
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

        const getFollowingsQuery = `
            MATCH (u:User  {email: $email})-[:FOLLOWS]->(f:User)
            RETURN f {
                .email,
                .username,
                .bio,
                .profile_img
            } AS following
        `;

        const result = await session.run(getFollowingsQuery, { email: user_email });

        const followings = result.records.map(record => record.get('following'));

        logger.info(`Retrieved followings of user with email ${user_email}`);
        return res.status(statusCodes.success).json({ followings });

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
