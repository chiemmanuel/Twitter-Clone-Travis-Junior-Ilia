const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require('../boot/database/mysql_db_connect'); 

// User signup
const signup = async (req, res) => {
    const { username, email, password, bio, gender, dob, contact } = req.body;
    let followers = 0;
    let following = 0;
    let created_at = new Date().toISOString().slice(0, 19).replace('T', ' ');

    if (!username || !password || !email || !bio || !gender || !dob || !contact) {
        return res.status(400).json({ error: "Missing information" });
    }

    const hash = bcrypt.hashSync(password, 10);

    try {
        const connection = await pool.getConnection();

        const [existingUsers] = await connection.query("SELECT * FROM users WHERE email = ?", [email]);
        if (existingUsers.length > 0) {
        connection.release();
        return res.status(400).json({ message: "User with this email already exists" });
        }
        await connection.query(
            "INSERT INTO users (email, username, password, bio_qoute, gender, dob, contact, followers_count, following_count, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [email, username, hash, bio, gender, dob, contact, followers, following, created_at]
        );
        connection.release();

        return res.status(200).json({ message: "User registered successfully" });
    } catch (error) {
        console.error("Error while saving user to DB", error.message);
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
        const connection = await pool.getConnection();
        const [rows] = await connection.query("SELECT * FROM users WHERE email = ?", [email]);
        connection.release();

        const user = rows[0];

        if (!user) {
            return res.status(400).json({ message: "User not found" });
        }

        if (!bcrypt.compareSync(password, user.password)) {
            return res.status(400).json({ message: "Email or password don't match" });
        }

        const token = jwt.sign(
            { user: {email: user.email } },
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
    const { email } = req.user;
    const { username, bio, gender, dob, contact } = req.body;

    try {
        const connection = await pool.getConnection();

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

        if (dob) {
            updateFields.push('dob');
            updateValues.push(dob);
        }

        if (contact) {
            updateFields.push('contact');
            updateValues.push(contact);
        }

        if (updateFields.length === 0) {
            return res.status(400).json({ error: "No fields to update" });
        }

        await connection.query(`UPDATE users SET ${updateFields.map(field => `${field} = ?`).join(', ')} WHERE email = ?`, [...updateValues, email]);

        connection.release();

        return res.status(200).json({ message: "User information updated successfully" });
    } catch (error) {
        console.error("Error while updating user information", error.message);
        return res.status(500).json({ error: "Failed to update user information" });
    }
};

// Edit user password
const updatePassword = async (req, res) => {
    const { email } = req.user;
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
        return res.status(400).json({ error: "Missing information" });
    }

    try {
        const connection = await pool.getConnection();
        const [rows] = await connection.query("SELECT * FROM users WHERE email = ?", [email]);
        const user = rows[0];

        if (!user) {
            return res.status(400).json({ message: "User not found" });
        }

        if (!bcrypt.compareSync(oldPassword, user.password)) {
            return res.status(400).json({ message: "Old password is incorrect" });
        }

        const hash = bcrypt.hashSync(newPassword, 10);
        await connection.query("UPDATE users SET password = ? WHERE email = ?", [hash, email]);

        connection.release();

        return res.status(200).json({ message: "Password updated successfully" });
    } catch (error) {
        console.error("Error while updating password", error.message);
        return res.status(500).json({ error: "Failed to update password" });
    }
};


// Get user info
const getUser = async (req, res) => {
    const { email } = req.user;

    try {
        const connection = await pool.getConnection();
        const [rows] = await connection.query("SELECT * FROM users WHERE email = ?", [email]);
        connection.release();

        const user = rows[0];

        if (!user) {
            return res.status(400).json({ message: "User not found" });
        }

        return res.status(200).json(user);
    } catch (error) {
        console.error("Error while getting user from DB", error.message);
        return res.status(500).json({ error: "Failed to get user" });
    }
};

//Get all users from the database
const getUsers = async (req, res) => {
    try {
        const connection = await pool.getConnection();
        const [rows] = await connection.query("SELECT * FROM users");
        connection.release();

        return res.status(200).json(rows);
    } catch (error) {
        console.error("Error while getting users from DB", error.message);
        return res.status(500).json({ error: "Failed to get users" });
    }
};

// Logout user and destroy token and session
const logout = (req, res) => {
        if (req.session.user) {
            delete req.session.user;
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
