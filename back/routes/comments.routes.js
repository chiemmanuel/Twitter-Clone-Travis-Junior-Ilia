const express = require("express");
const router = express.Router();

const commentServices = require("../services/comment.services");

router.post("/:tweetId", commentServices.postComment);
router.put("/:commentId", commentServices.editCommentById);
router.delete("/:commentId", commentServices.deleteCommentById);
router.post("/like/:commentId", commentServices.likeComment);

module.exports = router;