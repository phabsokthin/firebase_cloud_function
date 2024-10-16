const { onRequest } = require("firebase-functions/v2/https");
const admin = require('firebase-admin');

exports.createUserV2 = onRequest({ region: "asia-southeast1" }, async (req, res) => {
    try {

        const { email, password, role } = req.body;
        if (!email || !password || !role) {
            res.status(400).send('Email, password, and role are required.');
            return;
        }

        const allowedRoles = ['admin', 'user', 'moderator']; // Define allowed roles here
        if (!allowedRoles.includes(role)) {
            res.status(400).send('Invalid role specified.');
            return;
        }
        const userRecord = await admin.auth().createUser({
            email,
            password,
        });
        // Set custom user claims

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