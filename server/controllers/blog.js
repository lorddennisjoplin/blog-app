const Blog = require("../models/Blog");
const { errorHandler } = require('../auth');

module.exports.addBlogPost = async (req, res) => {
  try {
    console.log("===== ADD BLOG DEBUG START =====");
    console.log("Request Body:", req.body);
    console.log("Request User:", req.user);
    console.log("================================");

    const { title, content, featuredImage } = req.body;

    // 🔹 Required field validation
    if (!title || !content || !featuredImage) {
      console.log("Validation failed: Missing required fields");
      return res.status(400).json({
        message: "All fields are required."
      });
    }

    // 🔹 Image extension validation
    const validExtensions = /\.(jpg|jpeg|png|gif|svg|webp)$/i;
    if (!validExtensions.test(featuredImage)) {
      console.log("Validation failed: Invalid image extension");
      return res.status(400).json({
        message:
          "Invalid image. Accepted extensions: .jpg, .jpeg, .png, .gif, .svg, .webp",
      });
    }

    // 🔹 Auth check
    if (!req.user || !req.user._id) {
      console.log("Auth failed: req.user missing or invalid");
      return res.status(401).json({
        message: "Unauthorized. User not found in request."
      });
    }

    // 🔹 Create blog
    const newBlog = await Blog.create({
      title,
      content,
      featuredImage,
      author: req.user._id
    });

    console.log("Blog created successfully:", newBlog._id);
    console.log("===== ADD BLOG DEBUG END =====");

    return res.status(201).json(newBlog);

  } catch (error) {
    console.error("🔥 BLOG CREATION ERROR:");
    console.error(error);
    console.error("Stack:", error.stack);

    return res.status(500).json({
      message: error.message
    });
  }
};

module.exports.getAllBlogPosts = (req, res) => {
    return Blog.find({})
        .then(result => {
            if (result.length > 0) {
                return res.status(200).json({ blogs: result });
            } else {
                return res.status(404).json({ message: 'No blogs found.' });
            }
        })
        .catch(error => errorHandler(error, req, res));
};

module.exports.getBlogPostById = (req, res) => {
    if (!req.user) {
        return res.status(401).json({ message: "Unauthorized: No token provided" });
    }

    const blogId = req.params.blogId;

    Blog.findById(blogId)
        .then(blog => {
            if (blog) {
                return res.status(200).json({ blog });
                
            } else {
                return res.status(404).json({ message: 'Blog not found.' });
            }
        })
        .catch(error => errorHandler(error, req, res));
};

module.exports.updateBlogPost = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized: No token provided" });
    }

    const { title, content, featuredImage } = req.body;

    // Validate image extension if provided
    if (featuredImage) {
      const validExtensions = /\.(jpg|jpeg|png|gif|svg|webp)$/i;

      if (!validExtensions.test(featuredImage)) {
        return res.status(400).json({
          message:
            "Invalid image. Accepted extensions: .jpg, .jpeg, .png, .gif, .svg, .webp",
        });
      }
    }

    // Find the blog first
    const blog = await Blog.findById(req.params.blogId);

    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    // Authorization check
    const isOwner = blog.author.toString() === req.user._id.toString();

    if (!isOwner) {
      return res.status(403).json({
        message: "Forbidden: You are not allowed to update this blog post.",
      });
    }

    // Prepare update object
    const updatedBlog = {
      title,
      content,
      featuredImage,
    };

    const result = await Blog.findByIdAndUpdate(
      req.params.blogId,
      updatedBlog,
      { new: true, runValidators: true }
    );

    return res.status(200).json({
      message: "Blog post updated successfully.",
      updatedBlog: result,
    });

  } catch (error) {
    return errorHandler(error, req, res);
  }
};

module.exports.deleteBlogPost = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized: No token provided." });
    }

    const blogId = req.params.blogId;

    // Find the blog first
    const blog = await Blog.findById(blogId);

    if (!blog) {
      return res.status(404).json({ message: "Blog post not found." });
    }

    // Authorization check
    const isAdmin = req.user.isAdmin;
    const isOwner = blog.author.toString() === req.user._id.toString();

    if (!isAdmin && !isOwner) {
      return res.status(403).json({
        message: "Forbidden: You are not allowed to delete this blog post.",
      });
    }

    // Delete the blog
    await Blog.findByIdAndDelete(blogId);

    return res.status(200).json({ message: "Blog post deleted successfully." });

  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({ message: "Invalid blog post ID." });
    }
    return errorHandler(error, req, res);
  }
};

module.exports.addBlogComment = async (req, res) => {
  try {
    const { comment } = req.body;

    // Validate comment
    if (!comment || !comment.trim()) {
      return res.status(400).json({ message: "Comment cannot be empty." });
    }

    const blog = await Blog.findById(req.params.blogId);

    if (!blog) {
      return res.status(404).json({ message: "Blog post not found." });
    }

    // Add comment
    blog.comments.push({
      userId: req.user._id, // use _id
      comment: comment.trim()
    });

    await blog.save();

    return res.status(201).json(blog);

  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports.getBlogComments = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized: No token provided." });
    }

    const blogId = req.params.blogId;
    const blog = await Blog.findById(blogId).populate("comments.userId", "username email");

    if (!blog) {
      return res.status(404).json({ message: "Blog post not found." });
    }

    // Return only comments
    return res.status(200).json({ comments: blog.comments });

  } catch (error) {
    return errorHandler(error, req, res);
  }
};

module.exports.deleteBlogComment = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized: No token provided." });
    }

    // Only admins allowed
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: "Only admins can delete comments." });
    }

    const { blogId, commentId } = req.params;

    const blog = await Blog.findById(blogId);

    if (!blog) {
      return res.status(404).json({ message: "Blog post not found." });
    }

    // Find the comment index
    const commentIndex = blog.comments.findIndex(
      (c) => c._id.toString() === commentId
    );

    if (commentIndex === -1) {
      return res.status(404).json({ message: "Comment not found." });
    }

    // Remove the comment
    blog.comments.splice(commentIndex, 1);
    await blog.save();

    return res.status(200).json({ message: "Comment deleted successfully." });

  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({ message: "Invalid blog post or comment ID." });
    }
    return errorHandler(error, req, res);
  }
};