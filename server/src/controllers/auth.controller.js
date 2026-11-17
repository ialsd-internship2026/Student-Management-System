import userModel from '../models/user.model.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import 'dotenv/config';

const isSecure = process.env.NODE_ENV === 'production' && process.env.COOKIE_SECURE === 'true';

export const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: isSecure,
    sameSite: isSecure ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
};

export const register = async (req, res) => {
    try {
        const { userName, name, email, passWord, password, role, subjects, assignedClassIds } = req.body;
        const finalPassword = passWord || password;

        if (!email) {
            return res.status(400).json({ message: "Email is required." });
        }

        if (!finalPassword) {
            return res.status(400).json({ message: "Password is required." });
        }

        const isUserExist = await userModel.findOne({
            $or: [
                ...(userName ? [{ userName: userName.trim() }] : []),
                { email: email.trim().toLowerCase() }
            ]
        });

        if (isUserExist) {
            return res.status(409).json({
                message: "Username or email is already registered."
            });
        }

        const hash = await bcrypt.hash(finalPassword, 10);

        const user = await userModel.create({
            userName: userName ? userName.trim() : (name ? name.toLowerCase().replace(/\s+/g, '_') : undefined),
            name: name ? name.trim() : userName,
            email: email.trim().toLowerCase(),
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

        return res.status(201).json({
            message: "User registered successfully",
            user: userResponse,
            token
        });

    } catch (error) {
        console.error('[Auth Error] Register:', error);
        if (error.code === 11000) {
            return res.status(409).json({ message: "User account details already exist." });
        }
        return res.status(500).json({
            message: error.message || "Internal server error"
        });
    }
};

export const login = async (req, res) => {
    try {
        const { userName, email, passWord, password } = req.body;
        const finalPassword = passWord || password;

        const queryConditions = [];
        if (userName) queryConditions.push({ userName: userName.trim() });
        if (email) queryConditions.push({ email: email.trim().toLowerCase() });

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

        return res.status(200).json({
            message: "Login successful",
            user: userResponse,
            isuserExist: userResponse,
            token
        });

    } catch (error) {
        console.error('[Auth Error] Login:', error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message
        });
    }
};

export const logout = async (req, res) => {
    res.clearCookie("token", COOKIE_OPTIONS);
    return res.status(200).json({ message: 'Logged out successfully' });
};

export const getMe = async (req, res) => {
    try {
        const user = await userModel.findById(req.user.id)
            .select('-passWord')
            .populate('assignedClassIds', 'name term');
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        return res.status(200).json({ user });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

// Backward-compatible named exports
export const registerUser = register;
export const loginUser = login;
export const logoutUser = logout;

export default {
    register,
    login,
    logout,
    getMe,
    registerUser,
    loginUser,
    logoutUser
};
