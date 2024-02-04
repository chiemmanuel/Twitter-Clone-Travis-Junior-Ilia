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
const signin = async (req, res) => {
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

        req.session.user = { email: user.email };

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

const updateUser = async (req, res) => {
    const { email } = req.session.user;
    const { username, bio, gender, dob, contact } = req.body;
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

    try {
        const updateValues = [];
        const updateFields = [];

        if (username) {
            updateFields.push('username');
            updateValues.push(username);
        }

        if (bio) {
            updateFields.push('bio_qoute');
            updateValues.push(bio);
        }

        if (gender) {
            updateFields.push('gender');
            updateValues.push(gender);
        }

        if (parsedDate) {
            updateFields.push('dob');
            updateValues.push(parsedDate);
        }

        if (contact) {
            updateFields.push('contact');
            updateValues.push(contact);
        }

        if (updateFields.length === 0) {
            return res.status(400).json({ error: "No fields to update" });
        }

        pool.query(
            `UPDATE users SET ${updateFields.map(field => `${field} = ?`).join(', ')} WHERE email = ?`,
            [...updateValues, email]
        );

        return res.status(200).json({ message: "User information updated successfully" });
    } catch (error) {
        console.error("Error while updating user information", error.message);
        return res.status(500).json({ error: "Failed to update user information" });
    }
};

const updatePassword = (req, res) => {
    const { email } = req.session.user;
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
        return res.status(400).json({ error: "Missing information" });
    }

    try {
        pool.query("SELECT * FROM users WHERE email = ?", [email], (err, rows) => {
            if (err) {
                console.error("Error while getting user from DB", err);
                return res.status(500).json({ error: "Failed to get user" });
            }

            const user = rows && rows.length > 0 ? rows[0] : null;

            if (!user) {
                return res.status(400).json({ message: "User not found" });
            }

            if (!bcrypt.compareSync(oldPassword, user.password)) {
                return res.status(400).json({ message: "Old password is incorrect" });
            }

            const hash = bcrypt.hashSync(newPassword, 10);
            pool.query("UPDATE users SET password = ? WHERE email = ?", [hash, email], (updateErr) => {
                if (updateErr) {
                    console.error("Error while updating password", updateErr);
                    return res.status(500).json({ error: "Failed to update password" });
                }

                return res.status(200).json({ message: "Password updated successfully" });
            });
        });
    } catch (error) {
        console.error("Error in try-catch block", error.message);
        return res.status(500).json({ error: "Internal server error" });
    }
};

const getUser = async (req, res) => {
    console.log(req.session.user);
    console.log(req.user);
    if (!req.session.user || typeof req.session.user !== 'object') {
        return res.status(400).json({ message: "Invalid user object" });
    }

    const { email } = req.session.user;
    console.log(email);

    try {
        const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);

        const user = rows[0];
        console.log(user);

        if (!user) {
            return res.status(400).json({ message: "User not found" });
        }

        return res.status(200).json(user);
    } catch (error) {
        console.error("Error while getting user from DB", error.message);
        return res.status(500).json({ error: "Failed to get user" });
    }
}

const getUsers = async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT * FROM users");

        if (!Array.isArray(rows)) {
            return res.status(500).json({ error: "Unexpected response from the database" });
        }

        return res.status(200).json(rows);
    } catch (error) {
        console.error("Error while getting users from DB", error.message);
        return res.status(500).json({ error: "Failed to get users" });
    }
};

const logout = (req, res) => {
    if (req.session.user) {
        req.session.destroy();
    }

    return res.status(200).json({ message: "Disconnected" });
};

module.exports = {
    signup,
    signin,
    updateUser,
    updatePassword,
    getUser,
    logout,
    getUsers,
};
