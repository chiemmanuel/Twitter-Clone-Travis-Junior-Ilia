const logger = require('../middleware/winston');
const statusCodes = require('../constants/statusCodes.js');
const tweetModel = require('../models/tweetModel.js');
const { sendMessage } = require('../boot/socketio/socketio_connection');
const crypto = require('crypto');
const Redis = require('../boot/redis_client.js');
const { createNeo4jSession }  = require('../neo4j.config.js');

const getHashKey = (_filter) => {
    let retKey = '';
    if (_filter) {
      const text = JSON.stringify(_filter);
      retKey = crypto.createHash('sha256').update(text).digest('hex');
    }
    return 'CACHE_ASIDE_' + retKey;
  };

const getBookmarks = async (req, res) => {
    const redisClient = Redis.getRedisClient();
    const user_email = req.user.email;
    logger.info(`Fetching bookmarked tweets for user with email: ${user_email}`);

    const session = createNeo4jSession();

    try {
        // Retrieve bookmarked tweet IDs from Neo4j
        const result = await session.run(
            'MATCH (u:User {email: $user_email})-[:BOOKMARKED]->(t:Tweet) RETURN t.id AS tweetId',
            { user_email }
        );

        const tweetIds = result.records.map(record => record.get('tweetId').toString());

        if (tweetIds.length === 0) {
            return res.status(statusCodes.success).json({ tweets: [] });
        }

        const cachedTweets = [];
        const tweetsToFetch = [];

        // Check each tweet ID in the cache
        for (const tweetId of tweetIds) {
            const reqHash = getHashKey({ tweetId });
            const cachedTweet = await redisClient.get(reqHash).catch((err) => {
                logger.error(`Error fetching tweet from cache: ${err}`);
            });

            if (cachedTweet) {
                cachedTweets.push(JSON.parse(cachedTweet));
            } else {
                tweetsToFetch.push(tweetId);
            }
        }

        let fetchedTweets = [];

        if (tweetsToFetch.length > 0) {
            // Fetch the missing tweets from MongoDB
            fetchedTweets = await tweetModel.find({ _id: { $in: tweetsToFetch } });

            // Cache the fetched tweets
            for (const tweet of fetchedTweets) {
                const reqHash = getHashKey({ tweetId: tweet._id.toString() });
                await redisClient.set(reqHash, JSON.stringify(tweet)).then(
                    async () => {
                        await redisClient.expire(reqHash, redisCacheDurations.getTweet).catch((err) => {
                            logger.error(`Error setting expiry: ${err}`);
                        });
                    }).catch((err) => {
                        logger.error(`Error caching tweet: ${err}`);
                    }
                );
            }
        }

        const allTweets = [...cachedTweets, ...fetchedTweets];

        return res.status(statusCodes.success).json({ tweets: allTweets });

    } catch (error) {
        logger.error(`Error while fetching bookmarked tweets: ${error}`);
        return res.status(statusCodes.queryError).json({ error: 'Error while fetching bookmarked tweets' });
    } finally {
        await session.close();
    }
};
    
const addBookmark = async (req, res) => {
    const { tweet_id } = req.params;
    const user_email = req.user.email;

    const session = createNeo4jSession();

    try {
        // Ensure the user and tweet exist and create them if they do not
        await session.run(
            'MERGE (t:Tweet {id: $tweet_id}) ' +
            'ON CREATE SET t.num_bookmarks = 0', 
            { user_email, tweet_id }
        );

        // Create a bookmark relationship if it doesn't exist
        const bookmarkResult = await session.run(
            'MATCH (u:User {email: $user_email}), (t:Tweet {id: $tweet_id}) ' +
            'MERGE (u)-[r:BOOKMARKED]->(t) ' + // Relationship name is specified here
            'ON CREATE SET t.num_bookmarks = t.num_bookmarks + 1 ' +
            'RETURN r',
            { user_email, tweet_id }
        );

        if (bookmarkResult.records.length === 0) {
            return res.status(statusCodes.success).json({ message: 'This tweet is already bookmarked' });
        }

        sendMessage(null, 'bookmark', { _id: tweet_id, user_email: user_email, deleted: false });
        return res.status(statusCodes.success).json({ message: 'Added new bookmark' });

    } catch (error) {
        logger.error(`Error while adding a bookmark: ${error}`);
        return res.status(statusCodes.queryError).json({ error: 'Error while adding a bookmark' });
    } finally {
        await session.close();
    }
};


const deleteBookmark = async (req, res) => {
    const { tweet_id } = req.params;
    const user_email = req.user.email;

    const session = createNeo4jSession();

    try {
        // Ensure the user and tweet exist and create them if they do not
        const userTweetCheckResult = await session.run(
            'MATCH (u:User {email: $user_email})-[r:BOOKMARKED]->(t:Tweet {id: $tweet_id}) ' +
            'RETURN r',
            { user_email, tweet_id }
        );

        if (userTweetCheckResult.records.length === 0) {
            return res.status(statusCodes.notFound).json({ message: 'Bookmark not found' });
        }

        // Remove the bookmark relationship
        await session.run(
            'MATCH (u:User {email: $user_email})-[r:BOOKMARKED]->(t:Tweet {id: $tweet_id}) ' +
            'DELETE r',
            { user_email, tweet_id }
        );

        // Decrement the number of bookmarks in the MongoDB tweet document
        const tweet = await tweetModel.findById(tweet_id);
        if (tweet) {
            tweet.num_bookmarks = Math.max(tweet.num_bookmarks - 1, 0); // Ensure it doesn't go below 0
            await tweet.save();
        }

        sendMessage(null, 'bookmark', { _id: tweet_id, user_email: user_email, deleted: true });
        return res.status(statusCodes.success).json({ message: 'Bookmark deleted successfully' });

    } catch (error) {
        logger.error(`Error while deleting a bookmark: ${error}`);
        return res.status(statusCodes.queryError).json({ error: 'Error while deleting a bookmark' });
    } finally {
        await session.close();
    }
};

module.exports = {
    addBookmark,
    getBookmarks,
    deleteBookmark,
};
