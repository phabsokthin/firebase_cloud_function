const functions = require("firebase-functions/v2");
const admin = require('firebase-admin');
admin.initializeApp(); // Initialize the admin SDK

const userFunctions = require('./users/user');

const register = require('./register/register')
// Export the user functions
exports.createUser = userFunctions.createUser;
exports.getUsers = userFunctions.getUsers;
exports.getUserById = userFunctions.getUserById;
exports.deleteUserById = userFunctions.deleteUserById;

exports.createUserV2 = register.createUserV2;
exports.deleteUser = register.deleteUser;
