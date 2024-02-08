const fetch_feed_query = [
    { $sort: { _id: -1 } },
    { $limit: 20 },
    // Join the tweets with the polls and retweets they reference
    { $lookup: { from: 'polls', localField: 'poll_id', foreignField: '_id', as: 'poll' } },
    { $unwind: { path: '$poll', preserveNullAndEmptyArrays: true } },
    { $lookup: { from: 'tweets', localField: 'retweet_id', foreignField: '_id', as: 'retweet' } },
    { $unwind: { path: '$retweet', preserveNullAndEmptyArrays: true } }
];

module.exports = {
    fetch_feed_query
};