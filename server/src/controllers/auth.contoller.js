const userModel = require('../models/user.model');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const isSecure = process.env.NODE_ENV === 'production' && process.env.COOKIE_SECURE === 'true';

const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: isSecure,
    sameSite: isSecure ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
};

const registerUser = async (req, res) => {
    try {
        const { userName, name, email, passWord, password, role, subjects, assignedClassIds } = req.body;
        const finalPassword = passWord || password;

        if (!finalPassword) {
            return res.status(400).json({ message: "Password is required." });
        }

        const isUserExist = await userModel.findOne({
            $or: [
                ...(userName ? [{ userName }] : []),
                ...(email ? [{ email }] : [])
            ]
        });

        if (isUserExist) {
            return res.status(409).json({
                message: "Username or email is already registered."
            });
        }

        const hash = await bcrypt.hash(finalPassword, 10);

        const user = await userModel.create({
            userName: userName || (name ? name.toLowerCase().replace(/\s+/g, '_') : undefined),
            name: name || userName,
            email,
            passWord: hash,
            role: role || 'teacher',
            subjects: subjects || [],
            assignedClassIds: assignedClassIds || []
        });

        const token = jwt.sign(
            {
                id: user._id,
                role: user.role,
                assignedClassIds: user.assignedClassIds || []
            },
            process.env.JWT_PRIVATE || "default_jwt_secret",
            { expiresIn: '7d' }
        );

        res.cookie('token', token, COOKIE_OPTIONS);

        const userResponse = {
            _id: user._id,
            name: user.name,
            userName: user.userName,
            email: user.email,
            role: user.role,
            subjects: user.subjects,
            assignedClassIds: user.assignedClassIds
        };

        res.status(201).json({
            message: "User registered successfully",
            user: userResponse,
            token
        });

    } catch (error) {
        console.error('[Auth Error] Register:', error);
        if (error.code === 11000) {
            return res.status(409).json({ message: "User account details already exist." });
        }
        res.status(500).json({
            message: error.message || "Internal server error"
        });
    }
};

const loginUser = async (req, res) => {
    try {
        const { userName, email, passWord, password } = req.body;
        const finalPassword = passWord || password;

        const queryConditions = [];
        if (userName) queryConditions.push({ userName });
        if (email) queryConditions.push({ email });

        if (queryConditions.length === 0) {
            return res.status(400).json({ message: "Username or email is required." });
        }

        if (!finalPassword) {
            return res.status(400).json({ message: "Password is required." });
        }

        const user = await userModel.findOne({ $or: queryConditions });

        if (!user) {
            return res.status(401).json({
                message: "User not found. Please check your credentials."
            });
        }

        const isValidPassword = await bcrypt.compare(finalPassword, user.passWord);

        if (!isValidPassword) {
            return res.status(401).json({
                message: "Invalid password. Please try again."
            });
        }

        const token = jwt.sign(
            {
                id: user._id,
                role: user.role,
                assignedClassIds: user.assignedClassIds || []
            },
            process.env.JWT_PRIVATE || "default_jwt_secret",
            { expiresIn: '7d' }
        );

        res.cookie("token", token, COOKIE_OPTIONS);

        const userResponse = {
            _id: user._id,
            name: user.name || user.userName,
            userName: user.userName,
            email: user.email,
            role: user.role,
            subjects: user.subjects || [],
            assignedClassIds: user.assignedClassIds || []
        };

        res.status(200).json({
            message: "Login successful",
            user: userResponse,
            isuserExist: userResponse, // maintain backward compatibility
            token
        });

    } catch (error) {
        console.error('[Auth Error] Login:', error);
        res.status(500).json({
            message: "Internal server error",
            error: error.message
        });
    }
};

const logoutUser = async (req, res) => {
    res.clearCookie("token", COOKIE_OPTIONS);
    res.status(200).json({ message: 'Logged out successfully' });
};

const getMe = async (req, res) => {
    try {
        const user = await userModel.findById(req.user.id)
            .select('-passWord')
            .populate('assignedClassIds', 'name term');
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.status(200).json({ user });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { registerUser, loginUser, logoutUser, getMe };
