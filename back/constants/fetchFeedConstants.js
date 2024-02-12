const fetch_feed_query = [
    { $sort: { _id: -1 } },
    { $limit: 20 },
    { $lookup: { from: 'users', localField: 'author_id', foreignField: '_id', as: 'author' } },
    { $unwind: { path: '$author'}},
    { $lookup: { from: 'polls', localField: 'poll_id', foreignField: '_id', as: 'poll' } },
    { $unwind: { path: '$poll', preserveNullAndEmptyArrays: true } },
    { $lookup: { from: 'tweets', localField: 'retweet_id', foreignField: '_id', as: 'retweet' } },
    { $unwind: { path: '$retweet', preserveNullAndEmptyArrays: true } },
    { $lookup: { from : 'users', localField: 'retweet.author_email', foreignField: 'email', as: 'retweet_author' } },
    { $unwind: { path: '$retweet_author', preserveNullAndEmptyArrays: true}},
    { $project: {
        "author_email": 1,
        "content": 1,
        "media": 1,
        "poll": 1,
        "retweet": 1,
        "hashtags": 1,
        "num_comments": 1,
        "liked_by": 1,
        "num_retweets": 1,
        "num_views": 1,
        "created_at": 1,
        "updated_at": 1,
        "author.username": 1,
        "author.profile_img": 1,
        "retweet_author.username": 1,
        "retweet_author.profile_img": 1,
    } },
];

module.exports = {
    fetch_feed_query
};