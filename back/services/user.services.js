const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require('../boot/database/mysql_db_connect');

// Update user information
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

            // Update session's username if changed
            req.session.user.username = username;
        }

        if (bio) {
            updateFields.push('bio_quote');
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

        await pool.query(
            `UPDATE users SET ${updateFields.map(field => `${field} = ?`).join(', ')} WHERE email = ?`,
            [...updateValues, email]
        );

        return res.status(200).json({ message: "User information updated successfully" });
    } catch (error) {
        console.error("Error while updating user information", error.message);
        return res.status(500).json({ error: "Failed to update user information" });
    }
};

// Update user password
const updatePassword = async (req, res) => {
    const { email } = req.session.user;
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
        return res.status(400).json({ error: "Missing information" });
    }

    try {
        console.log(email);
        const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
        const user = rows[0];
        console.log(user);

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
    } catch (error) {
        console.error("Error in try-catch block", error.message);
        return res.status(500).json({ error: "Internal server error" });
    }
};

// Get user information
const getUser = async (req, res) => {
    console.log("here");
    console.log(req.session.user);
    if (!req.session.user || typeof req.session.user !== 'object') {
        return res.status(400).json({ message: "Invalid user object" });
    }
    console.log("here 2");
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

// Get all users
const getUsers = async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT * FROM users");

        return res.status(200).json(rows);
    } catch (error) {
        console.error("Error while getting users from DB", error.message);
        return res.status(500).json({ error: "Failed to get users" });
    }
};

// User logout
const logout = (req, res) => {
    if (req.session.user) {
        req.session.destroy();
    }

    return res.status(200).json({ message: "Disconnected" });
};

module.exports = {
    updateUser,
    updatePassword,
    getUser,
    logout,
    getUsers,
};
