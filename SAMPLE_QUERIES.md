
## Sample Queries from the Project 

As our project is quite large and complex for the scope of this project, we have provided a few sample queries to demonstrate how we interact with our databases.
These queries are taken from `/back/services/tweets.services.js` and show how we interact with MongoDB, Neo4j, and Redis.

## Function Explainations
- [postTweet](#posttweet)
- [getTweetById](#gettweetbyid)
- [updateTweetById](#updatetweetbyid)
- [likeTweet](#liketweet)
- [deleteTweetById](#deletetweetbyid)
- [closePoll](#closepoll)
- [registerVote](#registervote)
- [getLiveTweets](#getlivetweets)
- [getFollowedTweets](#getfollowedtweets)
- [incrementViews](#incrementviews)

### postTweet: 
```js
const newTweet = new tweetModel(tweetInfo);
const result = await newTweet.save();
```
This query inserts a new tweet into the MongoDB database using the schema defined in `/back/models/tweet.js`. This functionally executes the query: `db.tweets.insertOne(tweetInfo);` with additional validation and error handling.

```js
const addUserPostQuery = `MATCH (u:User {email: $email}) CREATE (t:Tweet {id: $tweet_id}) CREATE (u)-[:POSTED]->(t)`;
await session.run(addUserPostQuery, { email: req.user.email, tweet_id: tweet_id.toString() });
```
This query inserts a new tweet into the Neo4j database and creates a relationship between the user and the tweet.

```js
await tweetModel.findByIdAndUpdate(req.body.retweet_id, { $inc: { num_retweets: 1 } });
```
If a tweet is retweeted, this query increments the number of retweets for the original tweet in the MongoDB database. This functionally executes the query: `db.tweets.updateOne({ _id: req.body.retweet_id }, { $inc: { num_retweets: 1 } });`


### getTweetById:
```js
const cachedTweet = await redisClient.get(reqHash).catch((err) => {
    logger.error(`Error fetching tweet from cache: ${err}`);
});
```
This query checks the Redis cache for an entry corresponding to the request hash. If the tweet is found in the cache, it is returned immediately. This functionally executes the query: `GET {reqHash}`


```js
var query = [
    { $match: { _id: new ObjectId(tweetId) } },
    { $lookup: { from: 'tweets', localField: 'retweet_id', foreignField: '_id', as: 'retweet' } },
    { $unwind: { path: '$retweet', preserveNullAndEmptyArrays: true } },
];
const tweet = await tweetModel.aggregate(query);
```
This query retrieves a tweet by its ID from the MongoDB database. It uses the aggregation framework to perform a lookup on the `tweets` collection to retrieve the retweet information. This functionally executes the query: `db.tweets.aggregate(query);`

```js
await redisClient.set(reqHash, JSON.stringify(tweet[0])).then(
    async () => {
        await redisClient.expire(reqHash, redisCacheDurations.getTweet).catch((err) => {
            logger.error(`Error setting expiry: ${err}`);
        });
    }).catch((err) => {
        logger.error(`Error caching tweet: ${err}`);
    }
);
```
If the tweet is not found in the cache, this query retrieves the tweet from the MongoDB database and caches it in Redis. The tweet is stored in the cache with an expiration time to ensure that it is not stored indefinitely. This functionally executes the query: `SET {reqHash} {tweet}` and `EXPIRE {reqHash} {expirationTime}` 

### updateTweetById: 
```js
const tweet = await tweetModel.findById(tweetId);
[Edit tweet content with new data...]
await tweet.save();
```
This query retrieves a tweet by its ID from the MongoDB database. This functionally executes the query: `db.tweets.findOne({ _id: tweetId });`
Then, the tweet content is updated with the new data and saved back to the database. This functionally executes the query: `db.tweets.updateOne({ _id: tweetId }, { $set: { updatedFields } });`


### likeTweet: 
```js
const result = await session.run(
    'MATCH (u:User {email: $user_email})-[r:LIKED]->(t:Tweet {id: $tweetId}) RETURN r',
    { user_email, tweetId }
);
```
This query checks if the user has already liked the tweet in the Neo4j database.

```js
await session.run(
    'MATCH (u:User {email: $user_email})-[r:LIKED]->(t:Tweet {id: $tweetId}) DELETE r',
    { user_email, tweetId }
);
```
If the user has already liked the tweet, this query removes the like relationship between the user and the tweet in the Neo4j database.

```js
await session.run(
    'MATCH (u:User {email: $user_email}), (t:Tweet {id: $tweetId}) ' +
    'MERGE (u)-[r:LIKED]->(t)',
    { user_email, tweetId }
);
```
This query creates a new like relationship between the user and the tweet in the Neo4j database if the user has not already liked the tweet.


### deleteTweetById:
```js
const tweet = await tweetModel.findByIdAndDelete(tweetId);
```
This query deletes a tweet by its ID from the MongoDB database. This functionally executes the query: `db.tweets.deleteOne({ _id: tweet });`

```js
const deleteTweetQuery = `MATCH (t:Tweet {id: $tweet_id}) DETACH DELETE t`;
await session.run(deleteTweetQuery, { tweet_id: tweetId }).catch((err) => {
    logger.error(`Error deleting tweet from Neo4j: ${err}`);
});
```
This query deletes the tweet node from the Neo4j database and detaches it from any relationships.


### closePoll:
```js
await tweetModel.findByIdAndUpdate(poll_id, { 'poll.isClosed': true });
```
This query updates the `isClosed` field of a poll tweet in the MongoDB database to indicate that the poll has been closed. This functionally executes the query: `db.tweets.updateOne({ _id: poll_id }, { $set: { 'poll.isClosed': true } });`


### registerVote:
```js
const result = await tweetModel.findById(poll_id).select('poll');
const poll = result.poll;
// Check if user hasn't already voted and the poll is still open
poll.options[option_index].num_votes += 1;
poll.options[option_index].voter_ids.push(user_id);
await tweetModel.findByIdAndUpdate(poll_id, { poll: poll });
```
This query retrieves the poll tweet from the MongoDB database and updates the number of votes and the list of voter IDs for the selected poll option. This functionally executes the query: `db.tweets.updateOne({ _id: poll_id }, { $set: { poll: updatedPoll } });`

### getLiveTweets:

```js
const reqHash = getHashKey({last_tweet_id: req.query.last_tweet_id});
const cachedTweets = await redisClient.get(reqHash).catch((err) => {
    logger.error(`Error fetching tweets from cache: ${err}`);
});
```
This query checks the Redis cache for an entry corresponding to the request hash. This functionally executes the query: `GET {reqHash}`

```js
    var query = [
        { $sort: { created_at: -1 } },
        { $limit: 10 },
        { $lookup: { from: 'tweets', localField: 'retweet_id', foreignField: '_id', as: 'retweet' } },
        { $unwind: { path: '$retweet', preserveNullAndEmptyArrays: true } },
    ];
    // if there is a last tweet id, add a match condition to get tweets older than that
    if (lastTweetId) {
        query.unshift({ $match: { _id: { $lt: new ObjectId(lastTweetId) } } });
    }
    const tweets = await tweetModel.aggregate(query);
```
This query retrieves the latest live tweets from the MongoDB database. It sorts the tweets by creation date in descending order, limits the result to 10 tweets, and performs a lookup to retrieve retweet information. If a `lastTweetId` is provided, it adds a match condition to get tweets older than the specified ID. This functionally executes the query: `db.tweets.aggregate(query);`


```js
await redisClient.set(reqHash, JSON.stringify(tweets)).then(
    async () => {
        await redisClient.expire(reqHash, redisCacheDurations.getLiveTweets).catch((err) => {
            logger.error(`Error setting expiry: ${err}`);
        });
    }
).catch((err) => {
    logger.error(`Error caching tweets: ${err}`);
});
```
If the tweets are not found in the cache, this query retrieves the tweets from the MongoDB database and caches them in Redis. The tweets are stored in the cache with an expiration time to ensure that they are not stored indefinitely. This functionally executes the query: `SET {reqHash} {tweets}` and `EXPIRE {reqHash} {expirationTime}`

If no `lastTweetId` is provided, the same query is executed without the match condition to retrieve the latest live tweets.


### getFollowedTweets:
```js
const getFollowedUsersQuery = `MATCH (u:User {email: $email})-[:FOLLOWS]->(f:User) RETURN f.email`;
const result = await session.run(getFollowedUsersQuery, { email: req.user.email });
followed_users = result.records.map(record => record.get('f.email'));
```
This query retrieves the email addresses of users that the current user follows from the Neo4j database.

Then, the same Redis caching and mongo query used in `getLiveTweets` are executed with an additional match condition, `{ match: {author_email: { $in: followed_users } } }` to retrieve tweets only from the followed users.


### incrementViews:
```js
const tweet = await tweetModel.findByIdAndUpdate(tweetId, { $inc: { num_views: amount } });
```
This query increments the number of views for a tweet in the MongoDB database. This functionally executes the query: `db.tweets.updateOne({ _id: tweetId }, { $inc: { num_views: amount } });` 









