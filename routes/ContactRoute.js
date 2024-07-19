const express = require("express");
const { submitContactForm } = require("../controller/ContactController");

const router = express.Router();

// POST /api/contact - Submit contact form
router.post("/", submitContactForm);

module.exports = router;
