const functions = require("firebase-functions/v2");
const admin = require('firebase-admin');
admin.initializeApp(); 



const userFunctions = require('./users/user');

const register = require('./register/register')
const student = require('./student/student')
// Export the user functions
exports.createUser = userFunctions.createUser;
exports.getUsers = userFunctions.getUsers;
exports.getUserById = userFunctions.getUserById;
exports.deleteUserById = userFunctions.deleteUserById;

exports.createUserV2 = register.createUserV2;
exports.deleteUser = register.deleteUser;
exports.updateUserV2  = register.updateUserV2;
exports.setPasswordUserAccountV2 = register.setPasswordUserAccountV2;
exports.getUsersV2 = register.getUsersV2;
exports.getAllUsersV2 = register.getAllUsersV2;
exports.getUserByEmailV2 = register.getUserByEmailV2;
exports.checkUserExistenceByEmailV2 = register.checkUserExistenceByEmailV2;
exports.setCustomUserClaimsV2 = register.setCustomUserClaimsV2;

//student
exports.createStudentV2 = student.createStudent;
exports.getAllStudentClaimsV2 = student.getAllStudentClaimsV2;
exports.deleteStudentV2 = student.deleteStudentV2;
exports.updateStudentV2 = student.updateStudentV2;
exports.getStudentByIdV2 = student.getStudentByIdV2;