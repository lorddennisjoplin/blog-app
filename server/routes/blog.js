const express = require("express");
const blogController = require("../controllers/blog");
const auth = require('../auth');
const { verify, verifyAdmin } = auth;
const router = express.Router();

router.post("/add", verify, blogController.addBlogPost);
router.get("/all", verify, blogController.getAllBlogPosts);
router.get('/user/:username', blogController.getUserBlogPosts)
router.get("/view/:blogId", verify, blogController.getBlogPostById);
router.patch("/edit/:blogId", verify, blogController.updateBlogPost);
router.delete("/delete/:blogId", verify, blogController.deleteBlogPost);
router.post("/addComment/:blogId", verify, blogController.addBlogComment);
router.get("/getComments/:blogId", verify, blogController.getBlogComments);
router.delete("/deleteComment/:commentId", verify, verifyAdmin, blogController.deleteBlogComment);

module.exports = router;