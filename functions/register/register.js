const { onRequest } = require("firebase-functions/v2/https");
const admin = require('firebase-admin');

exports.createUserV2 = onRequest({ region: "asia-southeast1" }, async (req, res) => {
    try {

        const { email, password, role } = req.body;
        if (!email || !password || !role) {
            res.status(400).send('Email, password, and role are required.');
            return;
        }
        const allowedRoles = ['admin', 'user', 'moderator'];
        if (!allowedRoles.includes(role)) {
            res.status(400).send('Invalid role specified.');
            return;
        }
        const userRecord = await admin.auth().createUser({
            email,
            password,
        });
        await admin.auth().setCustomUserClaims(userRecord.uid, { role });
        res.status(201).json({
            user: {
                uid: userRecord.uid,
                email: userRecord.email,
                role: role
            },
            success: true,
            message: "User created successfully",
        });
    } catch (error) {
        console.error("Error creating user:", error);
        res.status(500).json({
            success: false,
            error: { message: error.message, code: error.code },
        });
    }
});


exports.updateUserV2 = onRequest({ region: "asia-southeast1" }, async (req, res) => {
    try {
        const { uid, email, password, displayName, role } = req.body;

        if (!uid) {
            return res.status(400).json({ success: false, message: 'User ID (uid) is required.' });
        }

        // Prepare an object with the updated fields
        const updateFields = {};
        if (email) updateFields.email = email;
        if (password) updateFields.password = password;
        if (displayName) updateFields.displayName = displayName;

        // Update the user details
        const updatedUserRecord = await admin.auth().updateUser(uid, updateFields);

        // Update custom claims if role is provided
        if (role) {
            const allowedRoles = ['admin', 'user', 'moderator']; 
            if (!allowedRoles.includes(role)) {
                return res.status(400).json({ success: false, message: 'Invalid role specified.' });
            }
            await admin.auth().setCustomUserClaims(uid, { role });
        }

        // Respond with the updated user information
        res.status(200).json({
            success: true,
            user: {
                uid: updatedUserRecord.uid,
                email: updatedUserRecord.email,
                displayName: updatedUserRecord.displayName,
                role: role || null 
            },
            message: "User updated successfully",
        });
    } catch (error) {
        console.error("Error updating user:", error); 
        res.status(500).json({
            success: false,
            error: { message: error.message, code: error.code },
        });
    }
});

exports.deleteUser = onRequest({ region: "asia-southeast1" }, async (req, res) => {
    try {
        const { uid } = req.body; // User ID to be deleted
        if (!uid) {
            return res.status(400).json({ success: false, message: 'User ID is required.' });
        }
        // Delete the user
        await admin.auth().deleteUser(uid);
        // Respond with success message
        res.status(200).json({
            success: true,
            message: `User with UID ${uid} deleted successfully.`,
        });
    } catch (error) {
        console.error("Error deleting user:", error);
        res.status(500).json({
            success: false,
            error: { message: error.message, code: error.code },
        });
    }
});


exports.setPasswordUserAccountV2 = onRequest({ region: "asia-southeast1" }, async (req, res) => {
    try {
        const { uid, newPassword } = req.body;
        
        if (!uid || !newPassword) {
            return res.status(400).json({ success: false, message: 'User ID (uid) and new password are required.' });
        }

        // Update the user's password
        const updatedUserRecord = await admin.auth().updateUser(uid, {
            password: newPassword,
        });

        // Respond with success message
        res.status(200).json({
            success: true,
            message: `Password for user with UID ${uid} has been updated successfully.`,
        });
    } catch (error) {
        console.error("Error updating password:", error); 
        res.status(500).json({
            success: false,
            error: { message: error.message, code: error.code },
        });
    }
});

//get usersByID send to https post
exports.getUsersV2 = onRequest({ region: "asia-southeast1" }, async (req, res) => {
    try {
        const { uid, email } = req.body;

        if (!uid && !email) {
            return res.status(400).json({ success: false, message: 'Either uid or email is required.' });
        }

        let userRecord;
        
        if (uid) {
            userRecord = await admin.auth().getUser(uid);
        } else if (email) {
            userRecord = await admin.auth().getUserByEmail(email);
        }

        res.status(200).json({
            success: true,
            user: {
                uid: userRecord.uid,
                email: userRecord.email,
                displayName: userRecord.displayName || null,
                phoneNumber: userRecord.phoneNumber || null,
                photoURL: userRecord.photoURL || null,
                customClaims: userRecord.customClaims || null, 
                disabled: userRecord.disabled, 
                metadata: userRecord.metadata, 
            },
            message: "User fetched successfully",
        });
    } catch (error) {
        console.error("Error fetching user:", error); 
        res.status(500).json({
            success: false,
            error: { message: error.message, code: error.code },
        });
    }
});

//get all User
exports.getAllUsersV2 = onRequest({ region: "asia-southeast1" }, async (req, res) => {
    try {
        let users = [];
        let nextPageToken; 
        do {
            const listUsersResult = await admin.auth().listUsers(100, nextPageToken);
            users = users.concat(listUsersResult.users); // Append fetched users to the list
            nextPageToken = listUsersResult.pageToken; // Update pageToken for next batch if any
        } while (nextPageToken); 

        const userData = users.map(userRecord => ({
            uid: userRecord.uid,
            email: userRecord.email,
            displayName: userRecord.displayName || null,
            phoneNumber: userRecord.phoneNumber || null,
            photoURL: userRecord.photoURL || null,
            customClaims: userRecord.customClaims || null, 
            disabled: userRecord.disabled, 
            metadata: userRecord.metadata,
        }));

        // Respond with the list of users
        res.status(200).json({
            success: true,
            users: userData,
            message: "Users fetched successfully",
        });
    } catch (error) {
        console.error("Error fetching users:", error); // Log error for debugging
        res.status(500).json({
            success: false,
            error: { message: error.message, code: error.code },
        });
    }
});

//getUser By Email
exports.getUserByEmailV2 = onRequest({ region: "asia-southeast1" }, async (req, res) => {
    try {
        // Extract email from request query parameters (GET method)
        const { email } = req.query;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Email is required.",
            });
        }
        // Fetch user by email
        const userRecord = await admin.auth().getUserByEmail(email);
        // Respond with user information
        res.status(200).json({
            success: true,
            user: {
                uid: userRecord.uid,
                email: userRecord.email,
                displayName: userRecord.displayName || null,
                phoneNumber: userRecord.phoneNumber || null,
                photoURL: userRecord.photoURL || null,
                customClaims: userRecord.customClaims || null, // Custom claims if set
                disabled: userRecord.disabled,
                metadata: userRecord.metadata, // Metadata like creation time, last sign-in
            },
            message: "User fetched successfully",
        });
    } catch (error) {
        console.error("Error fetching user by email:", error);

        // Handle cases where the user is not found or other errors
        if (error.code === 'auth/user-not-found') {
            return res.status(404).json({
                success: false,
                message: "User not found.",
            });
        }

        // Handle other errors
        res.status(500).json({
            success: false,
            error: { message: error.message, code: error.code },
        });
    }
});

//getUser By Email V2
exports.checkUserExistenceByEmailV2 = onRequest({ region: "asia-southeast1" }, async (req, res) => {
    try {

        const { email } = req.query;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Email is required.",
            });
        }

        // Attempt to get the user by email
        const userRecord = await admin.auth().getUserByEmail(email);
        return res.status(200).json({
            success: true,
            exists: true,
            user: {
                uid: userRecord.uid,
                email: userRecord.email,
                displayName: userRecord.displayName || null,
            },
            message: "User exists."
        });
    } catch (error) {
        if (error.code === 'auth/user-not-found') {
            return res.status(404).json({
                success: true,
                exists: false,
                message: "User does not exist.",
            });
        }

        console.error("Error checking user existence:", error);
        return res.status(500).json({
            success: false,
            error: { message: error.message, code: error.code },
        });
    }
});

//set role throw claims 
exports.setCustomUserClaimsV2 = onRequest({ region: "asia-southeast1" }, async (req, res) => {
    try {
        // Extract uid and custom claims from request body
        const { uid, claims } = req.body;

        if (!uid || !claims) {
            return res.status(400).json({
                success: false,
                message: "User UID and claims are required.",
            });
        }

        // Set custom claims on the user
        await admin.auth().setCustomUserClaims(uid, claims);

        // Respond with success message
        return res.status(200).json({
            success: true,
            message: `Custom claims set for user with UID: ${uid}`,
        });
    } catch (error) {
        console.error("Error setting custom claims:", error);

        return res.status(500).json({
            success: false,
            error: { message: error.message, code: error.code },
        });
    }
});
