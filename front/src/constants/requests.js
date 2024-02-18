export const requests = {
    login: '/auth/login',
    logout: '/user/logout',
    signup: '/auth/signup',
    currentUser: '/user/getme',
    userByUsername: '/user/get/',
    userTweet: '/user/getTweets/',
    userLikedTweets: '/user/getlikedTweets/',
    userComments: '/user/getComments/',
    editPassword: '/user/updatepassword',
    editProfile: '/user/update',
    followUser: '/followers/follow/',
    unFollowUser: '/followers/unfollow/',
    likeTweet: '/tweets/like/',
    editTweet: '/tweets/edit/',
    incrementViews: '/tweets/increment-views/',
    deleteTweet: '/tweets/delete/',
    getTweet: '/tweets/fetch/',
    liveFeed: '/tweets/livefeed',
    bookmarkTweet: '/bookmarks/add/',
    deleteBookmark: '/bookmarks/delete/',
    getBookmarks: '/bookmarks/',
    voteOnPoll: '/tweets/poll/vote',
    getTweetComments: '/comments/get/',
    postComment: '/comments/',
    postNotification: '/notifications/create',
    getNotifications: '/notifications/',
    postTweet: '/tweets/tweet',
    likeComment: '/comments/like/',
    userSearch: '/search/username/',
    hashtagSearch: '/search/hashtag/',
    getFollowers: '/followers/followers/',
    getFollowing: '/followers/following/',
};
 
