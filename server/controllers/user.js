const User = require('../models/User');
const bcrypt = require('bcrypt');
const auth = require('../auth.js');

const { errorHandler } = require('../auth');

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

module.exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found." });
    return res.status(200).json({ user });
  } catch (error) {
    return errorHandler(error, req, res);
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

    return res.status(200).json({ user: updatedUser });

  } catch (error) {
    return errorHandler(error, req, res);
  }
};