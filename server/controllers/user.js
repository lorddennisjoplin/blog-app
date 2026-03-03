const User = require('../models/User');
const bcrypt = require('bcrypt');
const auth = require('../auth.js');

const { errorHandler } = require('../auth');

const mongoose = require('mongoose')

module.exports.registerUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ success: false, message: "All fields are required." });
    }

    // Normalize inputs
    const usernameNormalized = username.trim().toLowerCase();
    const emailNormalized = email.trim().toLowerCase();

    // Case-insensitive uniqueness check
    const existingUsername = await User.findOne({
      username: { $regex: `^${usernameNormalized}$`, $options: 'i' }
    });
    if (existingUsername) {
      return res.status(409).json({ success: false, message: "Username already taken." });
    }

    const existingEmail = await User.findOne({
      email: { $regex: `^${emailNormalized}$`, $options: 'i' }
    });
    if (existingEmail) {
      return res.status(409).json({ success: false, message: "Email already exists." });
    }

    // Validate email format
    if (!emailNormalized.includes("@")) {
      return res.status(400).json({ success: false, message: "Invalid email format." });
    }

    // Validate password length
    if (password.length < 8) {
      return res.status(400).json({ success: false, message: "Password must be at least 8 characters." });
    }

    // Create new user
    const newUser = new User({
      username: usernameNormalized,
      email: emailNormalized,
      password: bcrypt.hashSync(password, 10)
    });

    const savedUser = await newUser.save();

    return res.status(201).json({
      success: true,
      message: "Registered successfully.",
      userId: savedUser._id
    });

  } catch (error) {
    return errorHandler(error, req, res);
  }
};

module.exports.loginUser = async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        message: "Enter your username/email and password."
      });
    }

    const normalizedIdentifier = identifier.trim().toLowerCase();
    const isEmail = normalizedIdentifier.includes("@");

    // Query: use regex for username to allow case-insensitive login
    const query = isEmail
      ? { email: normalizedIdentifier }
      : { username: { $regex: `^${normalizedIdentifier}$`, $options: 'i' } };

    const user = await User.findOne(query);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found."
      });
    }

    const isPasswordCorrect = bcrypt.compareSync(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: "Incorrect password."
      });
    }

    return res.status(200).json({
      success: true,
      access: auth.createAccessToken(user),
      message: "Log in successful."
    });

  } catch (error) {
    return errorHandler(error, req, res);
  }
};

module.exports.allUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");

    if (!users || users.length === 0) {
      return res.status(404).json({ message: "No users found." });
    }

    return res.status(200).json({ users });
  } catch (error) {
    return errorHandler(error, req, res);
  }
};

module.exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found." });
    return res.status(200).json({ user });
  } catch (error) {
    return errorHandler(error, req, res);
  }
};

exports.getUserDetails = async (req, res) => {
  try {
    const { userId } = req.params;

    // Validate userId
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    // Find user by ID (exclude sensitive fields like password)
    const user = await User.findById(userId).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: user,
    });

  } catch (error) {
    console.error("Error fetching user details:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching user details",
      error: error.message,
    });
  }
};

module.exports.updateProfile = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email) {
      return res.status(400).json({ message: "Username and email are required." });
    }

    const usernameNormalized = username.trim().toLowerCase();
    const emailNormalized = email.trim().toLowerCase();

    // Fetch current user
    const currentUser = await User.findById(req.user.id).select("username email password");
    if (!currentUser) return res.status(404).json({ message: "User not found." });

    // Case-insensitive uniqueness checks excluding current user
    const usernameExists = await User.findOne({
      username: { $regex: `^${usernameNormalized}$`, $options: 'i' },
      _id: { $ne: req.user.id }
    });
    if (usernameExists) return res.status(400).json({ message: "Username already taken." });

    const emailExists = await User.findOne({
      email: { $regex: `^${emailNormalized}$`, $options: 'i' },
      _id: { $ne: req.user.id }
    });
    if (emailExists) return res.status(400).json({ message: "Email address already in use." });

    // Validate normalized email format
    if (!emailNormalized.includes("@")) {
      return res.status(400).json({ message: "Invalid email format." });
    }

    const updateData = {
      username: usernameNormalized,
      email: emailNormalized
    };

    // Update password only if provided
    if (password) {
      if (password.length < 8) {
        return res.status(400).json({ message: "Password must be at least 8 characters." });
      }
      updateData.password = await bcrypt.hash(password, 10);
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      updateData,
      { new: true }
    ).select("-password");

    // Determine if any critical field changed
    const criticalChange =
      currentUser.username !== usernameNormalized ||
      currentUser.email !== emailNormalized ||
      (password && password.length >= 8); // password is being updated

    // Return updated user + logout flag
    return res.status(200).json({
      user: updatedUser,
      logout: criticalChange // frontend should log out if true
    });

  } catch (error) {
    return errorHandler(error, req, res);
  }
};

module.exports.updateUser = async (req, res) => {
  try {
    const { userId } = req.params
    const { username, email, password, isAdmin } = req.body

    // Convert userId to ObjectId for safe comparison
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID." })
    }
    const objectUserId = mongoose.Types.ObjectId(userId)

    // Fetch user to update
    const user = await User.findById(objectUserId)
    if (!user) {
      return res.status(404).json({ message: "User not found." })
    }

    // Update username if provided and different
    if (username && username !== user.username) {
      const existingUsername = await User.findOne({ username, _id: { $ne: objectUserId } })
      if (existingUsername) {
        return res.status(400).json({ message: "Username already taken." })
      }
      user.username = username
    }

    // Update email if provided and different
    if (email && email !== user.email) {
      if (!email.includes("@")) {
        return res.status(400).json({ message: "Invalid email format." })
      }

      const existingEmail = await User.findOne({ email, _id: { $ne: objectUserId } })
      if (existingEmail) {
        return res.status(400).json({ message: "Email address already exists." })
      }

      user.email = email
    }

    // Update password if provided
    if (password) {
      if (password.length < 8) {
        return res.status(400).json({ message: "Password must be at least 8 characters." })
      }
      const salt = await bcrypt.genSalt(10)
      user.password = await bcrypt.hash(password, salt)
    }

    // Update admin status if boolean
    if (typeof isAdmin === "boolean") {
      user.isAdmin = isAdmin
    }

    // Save changes
    await user.save()

    return res.status(200).json({
      message: "User updated successfully.",
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        isAdmin: user.isAdmin
      }
    })

  } catch (error) {
    return errorHandler(error, req, res)
  }
}

module.exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    await User.findByIdAndDelete(id);

    return res.status(200).json({
      message: "User deleted successfully.",
    });
  } catch (error) {
    return errorHandler(error, req, res);
  }
};