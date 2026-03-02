const express = require("express");
const blogController = require("../controllers/blog");
const auth = require('../auth');
const { verify, verifyAdmin } = auth;
const router = express.Router();

router.post("/add", verify, blogController.addBlogPost); 
router.get("/all", verify, blogController.getAllBlogPosts);
router.get("/post/:blogId", verify, blogController.getBlogPostById);
router.patch("/edit/:blogId", verify, verifyAdmin, blogController.updateBlogPost);
router.delete("/delete/:blogId", verify, verifyAdmin, blogController.deleteBlogPost);
router.post("/addComment/:blogId", verify, blogController.addBlogComment);
router.get("/getComments/:blogId", verify, blogController.getBlogComments);

module.exports = router;