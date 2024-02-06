const express = require("express");
const router = express.Router();

const userServices = require("../services/user.services");


router.put("/update", userServices.updateUser);
router.put("/updatepassword", userServices.updatePassword);
router.get("/get/:username", userServices.getUserbyUsername);
router.get("/getme", userServices.getcurrentUser);
router.post("/logout", userServices.logout);


module.exports = router;
