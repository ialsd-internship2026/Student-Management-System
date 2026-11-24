/**
 * Global JSDoc / Type Definitions for Aster SMS
 */

/**
 * @typedef {Object} User
 * @property {string} _id
 * @property {string} name
 * @property {string} email
 * @property {'admin' | 'teacher' | 'student'} role
 * @property {boolean} active
 */

/**
 * @typedef {Object} Course
 * @property {string} id
 * @property {string} name
 * @property {string} code
 * @property {string} type
 * @property {string} teacher
 * @property {string} status
 * @property {string} credits
 */

/**
 * @typedef {Object} Student
 * @property {string} id
 * @property {string} name
 * @property {string} studentCode
 * @property {string} section
 * @property {number} attendance
 * @property {number} score
 * @property {number} growth
 * @property {string} status
 */

/**
 * @typedef {Object} Teacher
 * @property {string} id
 * @property {string} name
 * @property {string} email
 * @property {string} department
 * @property {string[]} subjects
 * @property {string[]} assignedClasses
 */

export {};
