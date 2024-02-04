const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require('../boot/database/mysql_db_connect');

// User signup
const signup = async (req, res) => {
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
    }

    if (!username || !password || !email || !bio || !gender || !dob || !contact) {
        return res.status(400).json({ error: "Missing information" });
    }

    const hash = bcrypt.hashSync(password, 10);

    try {
        const [existingUsers] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);

        if (existingUsers && existingUsers.length > 0) {
            return res.status(400).json({ message: "User with this email already exists" });
        }

        await pool.query(
            "INSERT INTO users (email, username, password, bio_quote, gender, dob, contact, followers_count, following_count, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [email, username, hash, bio, gender, parsedDate, contact, followers, following, created_at]
        );

        return res.status(200).json({ message: "User registered successfully" });
    } catch (err) {
        console.error("Error while saving user to DB", err);
        return res.status(500).json({ message: "Failed to save user" });
    }
};

// User signin
const login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: "Missing information" });
    }

    try {
        const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);

        const user = rows[0];

        if (!user) {
            return res.status(400).json({ message: "User not found" });
        }

        if (!bcrypt.compareSync(password, user.password)) {
            return res.status(400).json({ message: "Email or password don't match" });
        }

        req.session.user = { username: user.username, email: user.email };
        console.log(req.session.user);

        const token = jwt.sign(
            { user: { email: user.email } },
            process.env.JWT_SECRET_KEY,
            {
                expiresIn: "1h",
            }
        );

        return res.status(200).json({ token });
    } catch (error) {
        console.error("Error while getting user from DB", error.message);
        return res.status(500).json({ error: "Failed to get user" });
    }
};

module.exports = {
    signup,
    login
};