//index.js file used for the export models and schemas and better maintainability of the code base 


import userModel, { userSchema } from './user.model.js';
import studentModel, { studentSchema } from './student.model.js';
import classModel, { classSchema } from './class.model.js';


export {
    userModel,
    userSchema,
    studentModel,
    studentSchema,
    classModel,
    classSchema,

};

export default {
    User: userModel,
    Student: studentModel,
    Class: classModel,

};
