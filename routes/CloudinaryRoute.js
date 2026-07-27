const express = require("express");
const router = express.Router();
const CloudinaryController = require("../controller/CloudinaryController");

router.post("/sign-upload", CloudinaryController.signUpload);

module.exports = router;
