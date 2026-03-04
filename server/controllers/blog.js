const Blog = require("../models/Blog");
const { errorHandler } = require('../auth');

module.exports.addBlogPost = async (req, res) => {
  try {
    const { title, content, featuredImage } = req.body;

    // Field validation
    if (!title || !content || !featuredImage) {
      return res.status(400).json({
        message: "All fields are required."
      });
    }

    // Image extension validation
    const validExtensions = /\.(jpg|jpeg|png|gif|svg|webp)$/i;
    if (!validExtensions.test(featuredImage)) {
      return res.status(400).json({
        message:
          "Invalid image. Accepted extensions: .jpg, .jpeg, .png, .gif, .svg, .webp",
      });
    }

    // Authorisation check
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        message: "Unauthorized. User not found in request."
      });
    }

    const newBlog = await Blog.create({
      title,
      content,
      featuredImage,
      author: req.user.id
    });

    return res.status(201).json(newBlog);
  } catch (error) {
    return res.status(500).json({
      message: error.message
    });
  }
};

module.exports.getAllBlogPosts = (req, res) => {
  const { limit, excludeId } = req.query

  let query = {}

  if (excludeId) {
    query._id = { $ne: excludeId } // exclude current post
  }

  let blogsQuery = Blog.find(query)
    .populate('author', 'username email')
    .sort({ createdAt: -1 }) // latest first

  if (limit) {
    blogsQuery = blogsQuery.limit(Number(limit))
  }

  blogsQuery
    .then(result => {
      if (result.length > 0) {
        return res.status(200).json({ blogs: result })
      } else {
        return res.status(404).json({ message: 'No blogs found.' })
      }
    })
    .catch(error => errorHandler(error, req, res))
}

// Get all blog posts by a specific username
module.exports.getUserBlogPosts = (req, res) => {
  const username = req.params.username

  if (!username) {
    return res.status(400).json({ message: 'Username is required.' })
  }

  Blog.find({})
    .populate('author', 'username email')
    .then(blogs => {
      // Filter blogs for this username
      const userBlogs = blogs.filter(
        blog => blog.author && blog.author.username === username
      )

      if (userBlogs.length > 0) {
        return res.status(200).json({ blogs: userBlogs })
      }

      // Check if user exists at all
      const userExists = blogs.some(blog => blog.author && blog.author.username === username)
      if (!userExists) {
        return res.status(404).json({ message: 'User not found.' })
      }

      return res.status(404).json({ message: 'No posts found for this user.' })
    })
    .catch(error => errorHandler(error, req, res))
}

module.exports.getBlogPostById = (req, res) => {
    if (!req.user) {
        return res.status(401).json({ message: "Unauthorized: No token provided" });
    }

    const blogId = req.params.blogId;

    Blog.findById(blogId)
      .populate('author', 'username email')
      .then(blog => {
          if (blog) {
              return res.status(200).json({ blog });
              
          } else {
              return res.status(404).json({ message: 'Post not found.' });
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
          message: "Invalid image. Accepted extensions: .jpg, .jpeg, .png, .gif, .svg, .webp",
        });
      }
    }

    // Find the blog first
    const blog = await Blog.findById(req.params.blogId);

    if (!blog) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Authorization check
    const isOwner = blog.author.toString() === req.user.id.toString();
    if (!isOwner) {
      return res.status(403).json({
        message: "Forbidden: You are not allowed to update this post.",
      });
    }

    // Prepare update object
    const updatedBlog = { title, content, featuredImage };

    // Update blog and populate author
    const result = await Blog.findByIdAndUpdate(
      req.params.blogId,
      updatedBlog,
      { new: true, runValidators: true }
    ).populate('author', 'username'); // <-- populate only username

    return res.status(200).json({
      message: "Post updated successfully.",
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

    // Validate ObjectId first
    if (!blogId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: "Invalid post ID." });
    }

    // Find the blog first
    const blog = await Blog.findById(blogId).exec();

    if (!blog) {
      return res.status(404).json({ message: "Post not found." });
    }

    // Authorization check
    const isAdmin = !!req.user.isAdmin;
    const isOwner = blog.author?.toString() === req.user.id.toString();

    if (!isAdmin && !isOwner) {
      return res.status(403).json({
        message: "Forbidden: You are not allowed to delete this post.",
      });
    }

    // Delete the blog
    await Blog.findByIdAndDelete(blogId).exec();

    return res.status(200).json({ message: "Post deleted successfully." });

  } catch (error) {
    return res.status(500).json({ message: "Internal server error." });
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
      return res.status(404).json({ message: "Post not found." });
    }

    // Ensure req.user exists
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "You must be logged in to comment." });
    }

    // Add comment
    const newComment = {
      userId: req.user.id,
      comment: comment.trim()
    };

    blog.comments.push(newComment);
    await blog.save();

    // Populate the user field for the newly added comment
    const populatedComment = await blog.populate({
      path: 'comments.userId',
      select: 'username'
    });

    // Return only the last comment that was added
    const lastComment = populatedComment.comments[populatedComment.comments.length - 1];

    return res.status(201).json({ comment: lastComment });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error.message });
  }
};

module.exports.getBlogComments = async (req, res) => {
  try {
    const blogId = req.params.blogId;
    const blog = await Blog.findById(blogId).populate("comments.userId", "username email");

    if (!blog) {
      return res.status(404).json({ message: "Post not found." });
    }

    // Return only comments
    return res.status(200).json({ comments: blog.comments });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error.message });
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

    const { commentId } = req.params;

    // Find the blog that contains this comment
    const blog = await Blog.findOne({ "comments._id": commentId });
    if (!blog) {
      return res.status(404).json({ message: "Comment or post not found." });
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
      return res.status(400).json({ message: "Invalid comment ID." });
    }
    return errorHandler(error, req, res);
  }
};

// Fetch latest comments across all blogs
module.exports.getLatestComments = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;

    // Aggregate all comments from blogs
    const blogs = await Blog.find({}, { title: 1, comments: 1 })
      .populate('comments.userId', 'username');

    // Flatten all comments with blog info
    let allComments = [];
    blogs.forEach(blog => {
      blog.comments.forEach(comment => {
        allComments.push({
          _id: comment._id,
          content: comment.comment,
          createdAt: comment.createdAt,
          user: comment.userId, // { _id, username }
          post: { _id: blog._id, title: blog.title }
        });
      });
    });

    // Sort descending by createdAt
    allComments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Take top `limit`
    allComments = allComments.slice(0, limit);

    return res.status(200).json({ comments: allComments });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: err.message });
  }
};