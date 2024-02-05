const mongoose = require('mongoose');
const commentModel = require('../models/commentModel');
const statusCodes = require('../constants/statusCodes'); // Provide the correct path to your status codes file

/**
 * This function creates a new comment and saves it to the database using the Comment model schema
 * @param {*} req: The request object
 * @param {*} res: The response object
 * @returns: The res object with a status code and a message indicating the success or failure of the comment creation
 */
const postComment = async (req, res) => {
    const tweetId = req.params.tweetId;

    const { author_name, profile_img, content } = req.body;

    const newComment = new commentModel({
        tweet_id: mongoose.Types.ObjectId(tweetId),
        author_name,
        profile_img,
        content,
        created_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
        updated_at: null,
    });

    try {
        const comment = await newComment.save();
        return res.status(statusCodes.success).json({ message: 'Comment created successfully', comment });
    } catch (error) {
        console.error("Error creating comment:", error);
        return res.status(statusCodes.queryError).json({ message: 'Failed to create comment' });
    }
};

/**
 * This function edits a comment by its ID
 * @param {*} req: The request object
 * @param {*} res: The response object
 * @returns: The res object with a status code and a message indicating the success or failure of the comment edit
 */
const editCommentById = async (req, res) => {
    const commentId = req.params.commentId;
    const { updatedContent } = req.body;

    try {
        const comment = await commentModel.findById(commentId);
        if (!comment) {
            return res.status(statusCodes.notFound).json({ message: 'Comment not found' });
        }

        if (updatedContent !== undefined) {
            comment.content = updatedContent;
            comment.updated_at = new Date().toISOString().slice(0, 19).replace('T', ' ');
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

    try {
        const comment = await commentModel.findById(commentId);
        if (!comment) {
            return res.status(statusCodes.notFound).json({ message: 'Comment not found' });
        }

        comment.num_likes += 1;

        const updatedComment = await comment.save();

        return res.status(statusCodes.success).json({ message: 'Comment liked successfully', comment: updatedComment });
    } catch (error) {
        console.error("Error liking comment:", error);
        return res.status(statusCodes.queryError).json({ message: 'Failed to like comment' });
    }
};

module.exports = {
    postComment,
    editCommentById,
    deleteCommentById,
    likeComment,
};
