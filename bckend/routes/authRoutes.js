const router = require("express").Router();
const { registerUser, loginUser, updateProfile, updatePassword, updateNotifications } = require("../controllers/authController");
const authMiddleware = require("../middleware/authMiddleware");

router.post("/register", registerUser);
router.post("/login", loginUser);

// Protected routes
router.put("/profile", authMiddleware, updateProfile);
router.put("/password", authMiddleware, updatePassword);
router.put("/notifications", authMiddleware, updateNotifications);

module.exports = router;
