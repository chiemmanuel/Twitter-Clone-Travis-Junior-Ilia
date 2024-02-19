const express = require("express");
const router = express.Router();

const searchServices = require("../services/search.services");

router.get("/username/:query", searchServices.searchByUsername);
router.get("/hashtag/:hashtag", searchServices.searchByHashtag);

module.exports = router;
