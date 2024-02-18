const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require('../models/userModel'); // Adjust the path based on your project structure
const statusCodes = require('../constants/statusCodes');

/**
 * This function handles user signup by creating a new user in the MongoDB database
 * @param {*} req: The request object
 * @param {*} res: The response object
 * @returns: The res object with a status code and a message indicating the success or failure of the signup
 */
const signup = async (req, res) => {
    try {
        const { username, email, password, bio, gender, dob, contact } = req.body;

        if (!username || !password || !email || !dob) {
            return res.status(statusCodes.badRequest).json({ error: "Missing information" });
        }

        if (password.length < 8) {
            return res.status(statusCodes.badRequest).json({ error: "Password should be at least 8 characters long" });
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(statusCodes.badRequest).json({ error: "Invalid email" });
        }
        // Check if user already exists and username is unique
        const existingUser = await User.findOne({ email });
        const existingUsername = await User.findOne({ username });

        if (existingUsername) {
            return res.status(statusCodes.userAlreadyExists).json({ message: "User with this username already exists" });
        }

        if (existingUser) {
            return res.status(statusCodes.userAlreadyExists).json({ message: "User with this email already exists" });
        }

        const hash = await bcrypt.hash(password, 10);
        const profile_img = "default_silouhette_img.png";// Add a default image for the user from cloudinary

        const newUser = new User({
            email,
            username,
            profile_img: profile_img || "",
            password: hash,
            bio: bio || "",
            gender: gender || "",
            dob,
            contact: contact || "",
            followers: [],
            following: [],
            bookmarked_tweets: [],
            liked_tweets: [],
            blocked_users: [],
        });

        await newUser.save();

        return res.status(statusCodes.success).json({ message: "User registered successfully" });
    } catch (err) {
        console.error("Error while saving user to MongoDB", err);
        return res.status(statusCodes.queryError).json({ message: "Failed to save user" });
    }
};

/**
 * This function handles user login by validating credentials and generating a JWT token
 * @param {*} req: The request object
 * @param {*} res: The response object
 * @returns: The res object with a status code and a message containing a JWT token on successful login
 */
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log(email, password)
        console.log("login user in")

        if (!email || !password) {
            console.log("Missing information")
            return res.status(statusCodes.badRequest).json({ error: "Missing information" });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(statusCodes.notFound).json({ message: "User not found" });
        }

        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
            console.log("Email or password don't match")
            return res.status(statusCodes.badRequest).json({ message: "Email or password don't match" });
        }

        req.session.user = { _id: user._id, username: user.username, email: user.email };
        console.log(req.session.user);

        const token = jwt.sign(
            { user: { _id: user._id, username: user.username, email: user.email } },
            process.env.JWT_SECRET_KEY,
            {
                expiresIn: "1h",
            }
        );

        return res.status(statusCodes.success).json({ "token": token, "_id": user._id, "username": user.username, "email": user.email});
    } catch (error) {
        console.error("Error while getting user from MongoDB", error.message);
        return res.status(statusCodes.queryError).json({ message: "Failed to get user" });
    }
};

module.exports = {
    signup,
    login
};
