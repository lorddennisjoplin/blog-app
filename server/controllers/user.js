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

        // Check if username already exists (case-insensitive)
        const existingUsername = await User.findOne({ username: { $regex: `^${usernameNormalized}$`, $options: 'i' } });
        if (existingUsername) {
            return res.status(409).json({ success: false, message: "Username already taken." });
        }

        // Check if email already exists (case-insensitive)
        const existingEmail = await User.findOne({ email: { $regex: `^${emailNormalized}$`, $options: 'i' } });
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

module.exports.loginUser = (req, res) => {
  const { identifier, password } = req.body

  if (!identifier || !password) {
    return res.status(400).send({
      success: false,
      message: "Enter your username/email and password."
    })
  }

  const normalizedIdentifier = identifier.toLowerCase()
  const isEmail = normalizedIdentifier.includes("@")

  const query = isEmail
    ? { email: normalizedIdentifier }
    : { username: normalizedIdentifier }

  User.findOne(query)
    .then(user => {
      if (!user) {
        return res.status(404).send({
          success: false,
          message: "User not found."
        })
      }

      const isPasswordCorrect = bcrypt.compareSync(password, user.password)

      if (!isPasswordCorrect) {
        return res.status(401).send({
          success: false,
          message: "Incorrect password."
        })
      }

      return res.status(200).send({
        success: true,
        access: auth.createAccessToken(user),
        message: "Log in successful."
      })
    })
    .catch(error => errorHandler(error, req, res))
}

module.exports.getProfile = (req, res) => {
    return User.findById(req.user.id)
        .select("-password")   // exclude password
        .then(user => {
            if (!user) return res.status(404).json({ message: "User not found" });
            return res.status(200).json({ user });
        })
        .catch(error => errorHandler(error, req, res));
};

module.exports.updateProfile = async (req, res) => {
  try {
    const { username, email, password } = req.body

    const usernameNormalized = username.trim().toLowerCase()
    const emailNormalized = email.trim().toLowerCase()

    if (!username || !email) {
      return res.status(400).json({ message: "Username and email are required." })
    }

    // Username uniqueness check
    const usernameExists = await User.findOne({
      username: { $regex: `^${usernameNormalized}$`, $options: 'i' },
      _id: { $ne: req.user.id }
    })

    if (usernameExists) {
      return res.status(400).json({ message: "Username already taken." })
    }

    // Email uniqueness check
    const emailExists = await User.findOne({
      email: { $regex: `^${emailNormalized}$`, $options: 'i' },
      _id: { $ne: req.user.id }
    })

    if (emailExists) {
      return res.status(400).json({ message: "Email address already in use." })
    }

    // Basic email validation
    if (!email.includes("@")) {
      return res.status(400).json({
        message: "Invalid email format."
      })
    }

    const updateData = {
      username: usernameNormalized,
      email: emailNormalized
    }

    // Only validate password IF it exists
    if (password) {
      if (password.length < 8) {
        return res.status(400).json({
          message: "Password must be at least 8 characters."
        })
      }

      const hashedPassword = await bcrypt.hash(password, 10)
      updateData.password = hashedPassword
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      updateData,
      { new: true }
    ).select("-password")

    res.status(200).json({ user: updatedUser })

  } catch (error) {
    errorHandler(error, req, res)
  }
}