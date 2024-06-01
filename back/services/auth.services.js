const statusCodes = require('../constants/statusCodes');
const User = require('../models/userModel'); // Adjust the path based on your project structure
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const { createNeo4jSession } = require('../neo4j.config');

/**
 * This function handles user signup by creating a new user in the MongoDB database
 * @param {*} req: The request object
 * @param {*} res: The response object
 * @returns: The res object with a status code and a message indicating the success or failure of the signup
 */
const signup = async (req, res) => {
    const session = createNeo4jSession();

    try {
        const { username, email, password, bio, gender, dob, contact } = req.body;

        if (!username || !password || !email || !dob) {
            return res
                .status(statusCodes.badRequest)
                .json({ error: "Missing information" });
        }

        if (password.length < 8) {
            return res
                .status(statusCodes.badRequest)
                .json({ error: "Password should be at least 8 characters long" });
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res
                .status(statusCodes.badRequest)
                .json({ error: "Invalid email" });
        }

        // Check if user already exists and username is unique
        const userExistsQuery = `
            MATCH (u:User)
            WHERE u.email = $email OR u.username = $username
            RETURN u
        `;

        const result = await session.run(userExistsQuery, { email, username });

        if (result.records.length > 0) {
            const existingUser = result.records[0].get('u').properties;
            if (existingUser.username === username) {
                return res
                    .status(statusCodes.userAlreadyExists)
                    .json({ message: "User with this username already exists" });
            }
            if (existingUser.email === email) {
                return res
                    .status(statusCodes.userAlreadyExists)
                    .json({ message: "User with this email already exists" });
            }
        }

        const hash = await bcrypt.hash(password, 10);
        const profile_img = "https://res.cloudinary.com/dqqel2q07/image/upload/v1708218630/default_profile_img.jpg";

        const createUserQuery = `
            CREATE (u:User {
                email: $email,
                username: $username,
                profile_img: $profile_img,
                password: $hash,
                bio: $bio,
                gender: $gender,
                dob: $dob,
                contact: $contact
            })
            RETURN u
        `;

        await session.run(createUserQuery, {
            email,
            username,
            profile_img,
            hash,
            bio: bio || "",
            gender: gender || "",
            dob,
            contact: contact || ""
        });

        return res
            .status(statusCodes.success)
            .json({ message: "User registered successfully" });

    } catch (err) {
        console.error("Error while saving user to neo4j database:", err);
        return res
            .status(statusCodes.queryError)
            .json({ message: "Failed to register a user" });

    } finally {
        await session.close();
    }
};

/**
 * This function handles user login by validating credentials and generating a JWT token
 * @param {*} req: The request object
 * @param {*} res: The response object
 * @returns: The res object with a status code and a message containing a JWT token on successful login
 */
const login = async (req, res) => {
    const session = createNeo4jSession();

    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res
                .status(statusCodes.badRequest)
                .json({ error: "Missing information" });
        }

        const fetchUserQuery = `
            MATCH (u:User {email: $email})
            RETURN u
        `;

        const result = await session.run(fetchUserQuery, { email });
        const userRecord = result.records[0];

        if (!userRecord) {
            return res
                .status(statusCodes.notFound)
                .json({ message: "Email or password don't match" });
        }

        const user = userRecord.get('u').properties;
        const userId = userRecord.get('u').identity.toInt();

        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            return res
                .status(statusCodes.badRequest)
                .json({ message: "Email or password don't match" });
        }

        req.session.user = { _id: userId, username: user.username, email: user.email };
        
        const token = jwt.sign(
            { user: { _id: userId, username: user.username, email: user.email } },
            process.env.JWT_SECRET_KEY,
            {
                expiresIn: "1h",
            }
        );

        return res
            .status(statusCodes.success)
            .json({ 
                "token": token, 
                "_id": userId, 
                "username": user.username, 
                "email": user.email,
                "profile_img": user.profile_img,
                "following": user.following,
            });

    } catch (error) {
        return res
            .status(statusCodes.queryError)
            .json({ message: "Failed to get user" });

    } finally {
        await session.close();
    }
};

module.exports = {
    signup,
    login
};
