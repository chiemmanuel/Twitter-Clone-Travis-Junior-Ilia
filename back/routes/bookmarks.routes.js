const express = require("express");
const router = express.Router();

const bookmarkServices = require("../services/bookmarks.services");

router.get("/", bookmarkServices.getBookmarks);
router.post("/add/:tweet_id", bookmarkServices.addBookmark);
router.post("/delete/:tweet_id", bookmarkServices.deleteBookmark);

module.exports = router;
