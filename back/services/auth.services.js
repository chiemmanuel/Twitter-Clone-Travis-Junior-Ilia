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

        if (!username || !password || !email || !bio || !gender || !dob || !contact) {
            return res.status(statusCodes.badRequest).json({ error: "Missing information" });
        }

        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(statusCodes.userAlreadyExists).json({ message: "User with this email already exists" });
        }

        const hash = await bcrypt.hash(password, 10);
        const profile_img = "default_silouhette_img.png";

        const newUser = new User({
            email,
            username,
            profile_img,
            password: hash,
            bio,
            gender,
            dob,
            contact,
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

        if (!email || !password) {
            return res.status(statusCodes.badRequest).json({ error: "Missing information" });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(statusCodes.notFound).json({ message: "User not found" });
        }

        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
            return res.status(statusCodes.badRequest).json({ message: "Email or password don't match" });
        }

        req.session.user = { username: user.username, email: user.email };
        console.log(req.session.user);

        const token = jwt.sign(
            { user: { username: user.username, email: user.email } },
            process.env.JWT_SECRET_KEY,
            {
                expiresIn: "1h",
            }
        );

        return res.status(statusCodes.success).json({ "token": token });
    } catch (error) {
        console.error("Error while getting user from MongoDB", error.message);
        return res.status(statusCodes.queryError).json({ message: "Failed to get user" });
    }
};

module.exports = {
    signup,
    login
};
