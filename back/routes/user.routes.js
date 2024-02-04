const express = require("express");
const router = express.Router();

const userServices = require("../services/user.service");

router.post("/signup", userServices.signup);
router.post("/login", userServices.signin);
router.put("/update", userServices.updateUser);
router.put("/updatepassword", userServices.updatePassword);
router.get("/getme", userServices.getUser);
router.get("/getall", userServices.getUsers);
router.get("/logout", userServices.logout);


module.exports = router;
