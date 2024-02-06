const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require('../boot/database/mysql_db_connect');
const statusCodes = require('../constants/statusCodes');
const logger = require("../middleware/winston");

/**
 * This function updates user information in the database based on the provided fields
 * @param {*} req: The request object
 * @param {*} res: The response object
 * @returns: The res object with a status code and a message indicating the success or failure of the update
 */
const updateUser = async (req, res) => {
    try {
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
            return res.status(statusCodes.badRequest).json({ error: "Invalid date format" });
        }

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
            return res.status(statusCodes.badRequest).json({ error: "No fields to update" });
        }

        // Update user information in the database
        await pool.query(
            `UPDATE users SET ${updateFields.map(field => `${field} = ?`).join(', ')} WHERE email = ?`,
            [...updateValues, email]
        );

        return res.status(statusCodes.success).json({ message: "User information updated successfully" });
    } catch (error) {
        console.error("Error while updating user information", error.message);
        return res.status(statusCodes.queryError).json({ error: "Failed to update user information" });
    }
};

/**
 * This function updates the user password in the database
 * @param {*} req: The request object
 * @param {*} res: The response object
 * @returns: The res object with a status code and a message indicating the success or failure of the update
 */
const updatePassword = async (req, res) => {
    try {
        const { email } = req.session.user;
        const { oldPassword, newPassword } = req.body;

        if (!oldPassword || !newPassword) {
            return res.status(statusCodes.badRequest).json({ error: "Missing information" });
        }

        if (oldPassword === newPassword) {
            return res.status(statusCodes.badRequest).json({ error: "Old and new passwords cannot be the same" });
        }

        // Fetch user information from the database
        const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
        const user = rows[0];

        if (!user) {
            return res.status(statusCodes.badRequest).json({ message: "User not found" });
        }

        // Compare old password with the stored hashed password
        if (!bcrypt.compareSync(oldPassword, user.password)) {
            return res.status(statusCodes.badRequest).json({ message: "Old password is incorrect" });
        }

        // Hash and update the new password
        const hash = bcrypt.hashSync(newPassword, 10);
        await pool.query("UPDATE users SET password = ? WHERE email = ?", [hash, email], (updateErr) => {
            if (updateErr) {
                console.error("Error while updating password", updateErr);
                return res.status(statusCodes.queryError).json({ error: "Failed to update password" });
            }
        });
        return res.status(statusCodes.success).json({ message: "Password updated successfully" });
    } catch (error) {
        console.error("Error in try-catch block", error.message);
        return res.status(statusCodes.queryError).json({ error: "Internal server error" });
    }
};

/**
 * This function retrieves user information from the database
 * @param {*} req: The request object
 * @param {*} res: The response object
 * @returns: The res object with a status code and the user information in the message
 */
const getcurrentUser = async (req, res) => {
    try {
        console.log("here");
        console.log(req.session.user);
        if (!req.session.user || typeof req.session.user !== 'object') {
            return res.status(statusCodes.badRequest).json({ message: "Invalid user object" });
        }
        console.log("here 2");
        const { email } = req.session.user;
        console.log(email);

        // Fetch user information from the database based on the email
        const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);

        const user = rows[0];
        console.log(user);

        if (!user) {
            return res.status(statusCodes.badRequest).json({ message: "User not found" });
        }

        return res.status(statusCodes.success).json(user);
    } catch (error) {
        console.error("Error while getting user from DB", error.message);
        return res.status(statusCodes.queryError).json({ error: "Failed to get user" });
    }
};

/**
 * This function retrieves user information from the database based on the username
 * @param {*} req: The request object with the username in params
 * @param {*} res: The response object
 * @returns: The res object with a status code and the user information in the message
 */
const getUserbyUsername = async (req, res) => {
    try {
        const { username } = req.params;
        logger.info(`Fetching user with username: ${username}`);

        // Fetch user information from the database based on the username
        const [rows] = await pool.query("SELECT * FROM users WHERE username = ?", [username]);
        const user = rows[0];

        if (!user) {
            return res.status(statusCodes.badRequest).json({ message: "User not found" });
        }

        return res.status(statusCodes.success).json(user);
    } catch (error) {
        console.error("Error while getting user from DB", error.message);
        return res.status(statusCodes.queryError).json({ error: "Failed to get user" });
    }
};

/**
 * This function logs the user out by destroying the session
 * @param {*} req: The request object
 * @param {*} res: The response object
 * @returns: The res object with a status code and a message indicating the success of the logout
 */
const logout = (req, res) => {
    try {
        // Check if the user is already logged out
        if (!req.session.user || typeof req.session.user !== 'object') {
            return res.status(400).json({ message: "User is already logged out" });
        }
        // Remove the user object from the session
        req.session.user = null;
        // Destroy the session to log the user out
        req.session.destroy((err) => {
            if (err) {
                console.error("Error while destroying session:", err);
                return res.status(500).json({ error: "Failed to log out user" });
            }

            return res.status(200).json({ message: "User successfully logged out" });
        });
    } catch (error) {
        console.error("Error during logout:", error.message);
        return res.status(500).json({ error: "Internal server error" });
    }
};

module.exports = {
    updateUser,
    updatePassword,
    getcurrentUser,
    logout,
    getUserbyUsername,
};
