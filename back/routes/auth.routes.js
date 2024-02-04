const express = require("express");
const router = express.Router();

const authServices = require("../services/auth.services");

router.post("/signup", authServices.signup);
router.post("/login", authServices.login);

module.exports = router;