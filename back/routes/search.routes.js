const express = require("express");
const router = express.Router();

const searchServices = require("../services/search.services");

router.get("/username/:username", searchServices.searchByUsername);
router.get("/hashtag/:hashtag", searchServices.searchByHashtag);

module.exports = router;
