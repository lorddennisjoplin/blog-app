const express = require('express');
const userController = require('../controllers/user');
const auth = require('../auth');
const { verify, verifyAdmin } = auth;

const router = express.Router();

router.post("/register", userController.registerUser);
router.post("/login", userController.loginUser);
router.get("/details", verify, userController.getProfile);
router.patch("/profile", verify, userController.updateProfile)
router.get("/profile/:userId", verify, verifyAdmin, userController.getUserDetails)
router.patch("/edit/:userId", verify, verifyAdmin, userController.updateUser)
router.get("/all", verify, verifyAdmin, userController.allUsers)
router.delete("/delete", verify, verifyAdmin, userController.deleteUser)

module.exports = router;