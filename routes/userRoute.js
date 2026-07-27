const express = require("express");
const router = express.Router();
const UserController = require("../controller/UserController");
const { authenticateToken, authorizeRole } = require("../middleware/authMiddleware");

router.get("/", authenticateToken, authorizeRole("admin"), UserController.getAll);
router.get("/:id", UserController.getById);
router.delete("/:id", authenticateToken, authorizeRole("admin"), UserController.deleteById);
router.put("/:id", UserController.update);

module.exports = router;