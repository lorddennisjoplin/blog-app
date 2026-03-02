const User = require('../models/User');
const bcrypt = require('bcrypt');
const auth = require('../auth.js');

const { errorHandler } = require('../auth');

module.exports.registerUser = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Check if username already exists
        const existingUsername = await User.findOne({ username });
        if (existingUsername) {
            return res.status(409).json({
                success: false,
                message: "Username already taken."
            });
        }

        // Check if email already exists
        const existingEmail = await User.findOne({ email });
        if (existingEmail) {
            return res.status(409).json({
                success: false,
                message: "Email already exists."
            });
        }

        // Validate email
        if (!email.includes("@")) {
            return res.status(400).json({
                success: false,
                message: "Invalid email format."
            });
        }

        // Validate password length
        if (password.length < 8) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 8 characters."
            });
        }

        // Create new user
        const newUser = new User({
            username,
            email,
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
    const { identifier, password } = req.body; // identifier = email OR username

    if (!identifier || !password) {
        return res.status(400).send({ success: false, message: "Enter your username/email and password." });
    }

    // Determine if identifier is an email
    const isEmail = identifier.includes("@");

    const query = isEmail 
        ? { email: identifier } 
        : { username: identifier };

    User.findOne(query)
        .then(user => {
            if (!user) {
                return res.status(404).send({ success: false, message: "User not found." });
            }

            const isPasswordCorrect = bcrypt.compareSync(password, user.password);
            if (!isPasswordCorrect) {
                return res.status(401).send({ success: false, message: "Incorrect password." });
            }

            // Successful login
            return res.status(200).send({ 
                success: true, 
                access: auth.createAccessToken(user),
                message: "Log in successful." 
            });
        })
        .catch(error => errorHandler(error, req, res));
};

module.exports.getProfile = (req, res) => {
    return User.findById(req.user.id)
        .select("-password")   // exclude password
        .then(user => {
            if (!user) return res.status(404).json({ message: "User not found" });
            return res.status(200).json({ user });
        })
        .catch(error => errorHandler(error, req, res));
};