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
    body('name').isString().withMessage("Name must be a string").trim().isLength({ min: 2, max: 100 }).withMessage("Name must be between 2 and 100 characters long"),
    body('email').isEmail().withMessage("Invalid email address"),
    body('password').custom((value, { req }) => {
        const pw = value || req.body.passwordHash || req.body.passWord;
        if (!pw || pw.length < 6) {
            throw new Error("Password must contain at least 6 characters");
        }
        return true;
    }),
    body('role').optional().isIn(['teacher', 'student', 'admin']).withMessage("Role must be 'teacher', 'student', or 'admin'"),

    validateRequest
];

export default {
    validationRules,
    validateRequest
};
