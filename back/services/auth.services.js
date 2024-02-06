const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require('../boot/database/mysql_db_connect');
const statusCodes = require('../constants/statusCodes');

/**
 * This function handles user signup by creating a new user in the database
 * @param {*} req: The request object
 * @param {*} res: The response object
 * @returns: The res object with a status code and a message indicating the success or failure of the signup
 */
const signup = async (req, res) => {
    try {
        const { username, email, password, bio, gender, dob, contact } = req.body;
        let followers = 0;
        let following = 0;
        let created_at = new Date().toISOString().slice(0, 19).replace('T', ' ');

        // Parse the incoming date string
        const parsedDate = new Date(dob);

        // Check if the parsed date is a valid date
        if (!isNaN(parsedDate)) {
            // Format the date to 'YYYY-MM-DD'
            const formattedDate = parsedDate.toISOString().split('T')[0];
            // Now, `formattedDate` can be used to store in MySQL
            console.log(formattedDate);
        } else {
            console.error("Invalid date format");
            // Handle the case where the incoming date is invalid
            return res.status(statusCodes.badRequest).json({ error: "Invalid date format" });
        }

        if (!username || !password || !email || !bio || !gender || !dob || !contact) {
            return res.status(statusCodes.badRequest).json({ error: "Missing information" });
        }

        const hash = bcrypt.hashSync(password, 10);

        const [existingUsers] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);

        if (existingUsers && existingUsers.length > 0) {
            return res.status(statusCodes.userAlreadyExists).json({ message: "User with this email already exists" });
        }

        await pool.query(
            "INSERT INTO users (email, username, password, bio_quote, gender, dob, contact, followers_count, following_count, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [email, username, hash, bio, gender, parsedDate, contact, followers, following, created_at]
        );

        return res.status(statusCodes.success).json({ message: "User registered successfully" });
    } catch (err) {
        console.error("Error while saving user to DB", err);
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

        const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);

        const user = rows[0];

        if (!user) {
            return res.status(statusCodes.notFound).json({ message: "User not found" });
        }

        if (!bcrypt.compareSync(password, user.password)) {
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

        return res.status(statusCodes.success).json({ token });
    } catch (error) {
        console.error("Error while getting user from DB", error.message);
        return res.status(statusCodes.queryError).json({ message: "Failed to get user" });
    }
};

module.exports = {
    signup,
    login
};
