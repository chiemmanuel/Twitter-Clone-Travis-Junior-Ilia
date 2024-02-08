const express = require("express");
const router = express.Router();

const userServices = require("../services/user.services");


router.put("/update", userServices.updateUser);
router.put("/updatepassword", userServices.updatePassword);
router.get("/get/:username", userServices.getUserbyUsername);
router.get("/getTweets/:user_email", userServices.getUserTweets);
router.get("/getComments/:username", userServices.getUserComments);
router.get("/getme", userServices.getcurrentUser);
router.get("/logout", userServices.logout);


module.exports = router;
