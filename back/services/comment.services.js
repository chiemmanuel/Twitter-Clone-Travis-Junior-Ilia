const ObjectId = require('mongoose').Types.ObjectId;
const commentModel = require('../models/commentModel');
const statusCodes = require('../constants/statusCodes'); 
const tweetModel = require('../models/tweetModel');
const User = require('../models/userModel');
const { sendMessage } = require('../boot/socketio/socketio_connection');

/**
 * This function creates a new comment and saves it to the database using the Comment model schema
 * @param {*} req: The request object
 * @param {*} res: The response object
 * @returns: The res object with a status code and a message indicating the success or failure of the comment creation
 */
const postComment = async (req, res) => {
    const tweetId = req.params.tweetId;
    const _id = req.user._id;
    const user = await User.findById(_id);
    const author_name = user.username;
    const profile_image = user.profile_img;

    const { content } = req.body;

    let media = req.body.media;
    if (media === undefined) {
        media = null;
    }

    const newComment = new commentModel({
        tweet_id: tweetId,
        author_id: _id,
        author_name,
        profile_image,
        content,
        media,
    });

    try {
        const comment = await newComment.save();
        const tweet = await tweetModel.findById(tweetId);
        tweet.num_comments += 1;
        await tweet.save();
        sendMessage( null, 'comment-added', { comment: comment })
        sendMessage(null, 'increment-comment-count', { tweetId: tweetId })
        return res.status(statusCodes.success).json({ message: 'Comment created successfully', comment });
    } catch (error) {
        console.error("Error creating comment:", error);
        return res.status(statusCodes.queryError).json({ message: 'Failed to create comment' });
    }
};

/**
 * TODO/ Optional: Add possibility to update the media of the content if we implement  premium accounts
 * This function edits a comment by its ID
 * @param {*} req: The request object
 * @param {*} res: The response object
 * @returns: The res object with a status code and a message indicating the success or failure of the comment edit
 */
const editCommentById = async (req, res) => {
    const commentId = req.params.commentId;
    const { updatedContent} = req.body;

    try {
        const comment = await commentModel.findById(commentId);
        if (!comment) {
            return res.status(statusCodes.notFound).json({ message: 'Comment not found' });
        }
        if (updatedContent !== undefined) {
            comment.content = updatedContent;
        }
        const updatedComment = await comment.save();

        return res.status(statusCodes.success).json({ message: 'Comment updated successfully', comment: updatedComment });
    } catch (error) {
        console.error("Error updating comment:", error);
        return res.status(statusCodes.queryError).json({ message: 'Failed to update comment' });
    }
};

/**
 * This function deletes a comment by its ID
 * @param {*} req: The request object
 * @param {*} res: The response object
 * @returns: The res object with a status code and a message indicating the success or failure of the comment deletion
 */
const deleteCommentById = async (req, res) => {
    const commentId = req.params.commentId;

    try {
        const comment = await commentModel.findByIdAndDelete(commentId);
        if (!comment) {
            return res.status(statusCodes.notFound).json({ message: 'Comment not found' });
        }

        return res.status(statusCodes.success).json({ message: 'Comment deleted successfully' });
    } catch (error) {
        console.error("Error deleting comment:", error);
        return res.status(statusCodes.queryError).json({ message: 'Failed to delete comment' });
    }
};

/**
 * This function likes a comment by its ID
 * @param {*} req: The request object
 * @param {*} res: The response object
 * @returns: The res object with a status code and a message indicating the success or failure of the comment like
 */
const likeComment = async (req, res) => {
    const commentId = req.params.commentId;
    const userId = req.user._id;

    try {
        const comment = await commentModel.findById(commentId);
        if (!comment) {
            return res.status(statusCodes.notFound).json({ message: 'Comment not found' });
        }
        if (comment.likes.includes(userId)) {
            comment.likes.pull(userId);
            sendMessage( null, 'update-comment-likes', { comment_id: commentId, dislike: true})
            message = 'Comment disliked successfully';
        } else {
            sendMessage( null, 'update-comment-likes', { comment_id: commentId, dislike: false})
            comment.likes.push(userId);
            message = 'Comment liked successfully';
        }
        await comment.save();

        return res.status(statusCodes.success).json({ message: message});
    } catch (error) {
        console.error("Error liking comment:", error);
        return res.status(statusCodes.queryError).json({ message: 'Failed to like comment' });
    }
};

/**
 * This function fetchs all comments for a tweet by its ID
 * @param {*} req: The request object
 * @param {*} res: The response object
 * @returns: The res object with a status code and the comments for the tweet
 */
const fetchCommentsByTweetId = async (req, res) => {
    const tweetId = new ObjectId(req.params.tweetId);

    try {
        const comments = await commentModel.find({ tweet_id: tweetId });
        return res.status(statusCodes.success).json({ comments });
    } catch (error) {
        console.error("Error fetching comments:", error);
        return res.status(statusCodes.queryError).json({ message: 'Failed to fetch comments' });
    }
}

module.exports = {
    postComment,
    editCommentById,
    deleteCommentById,
    likeComment,
    fetchCommentsByTweetId,
};
