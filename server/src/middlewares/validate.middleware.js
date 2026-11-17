import { body, validationResult } from 'express-validator';

export const validateRequest = (req, res, next) => {
    const error = validationResult(req);

    if (!error.isEmpty()) {
        const errorMsg = error.array().map(err => err.msg).join(', ');
        return res.status(400).json({ message: errorMsg, errors: error.array() });
    }
    return next();
};

export const validationRules = [
    body('userName').isString().withMessage("Username must be a string").isLength({ min: 3, max: 20 }).withMessage("Username must be between 3 and 20 characters long"),
    body('email').isEmail().withMessage("Invalid email address"),
    body('passWord').isLength({ min: 6 }).withMessage("Password must contain at least 6 characters"),

    validateRequest
];

export default {
    validationRules,
    validateRequest
};
