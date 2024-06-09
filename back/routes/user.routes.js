const express = require("express");
const router = express.Router();

const userServices = require("../services/user.services");


router.put("/update", userServices.updateUser);
router.put("/updatepassword", userServices.updatePassword);
router.get("/get/:username", userServices.getUserByUsername);
router.get("/getTweets/:email", userServices.getUserTweets);
router.get("/getLikedTweets/:email", userServices.getUserLikedTweets);
router.get("/getComments/:username", userServices.getUserComments);
router.get("/getme", userServices.getcurrentUser);
router.post("/logout", userServices.logout);
router.delete("/delete", userServices.deleteCurrentUser);

module.exports = router;