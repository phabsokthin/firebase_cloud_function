const { onRequest } = require("firebase-functions/v2/https");
const admin = require('firebase-admin');
const cors = require('cors');

// Global CORS options
const corsOptions = cors({
    origin: 'http://localhost:5173', // Update with your frontend URL
    methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
});

// Helper function for applying CORS
const applyCors = (req, res, callback) => {
    corsOptions(req, res, () => {
        if (req.method === 'OPTIONS') {
            return res.status(204).send('');
        }
        callback();
    });
};

// Cloud Function to create a student
exports.createStudent = onRequest((req, res) => {
    applyCors(req, res, async () => {
        if (req.method !== 'POST') {
            return res.status(405).send('Method Not Allowed');
        }

        const { firstName, lastName, email, dateOfBirth, enrollmentDate, major } = req.body;

        // Validate input
        if (!email || !firstName || !lastName) {
            return res.status(400).send('Missing required fields: email, firstName, lastName');
        }

        try {
            const userRecord = await admin.auth().createUser({
                email,
                displayName: `${firstName} ${lastName}`,
                emailVerified: false,
                password: 'defaultPassword',
            });

            const claims = {
                firstName,
                lastName,
                dateOfBirth,
                enrollmentDate,
                major,
                role: 'student',
            };

            // Set custom claims for the user
            await admin.auth().setCustomUserClaims(userRecord.uid, claims);

            return res.status(201).send(`Student created successfully: ${userRecord.uid}`);
        } catch (error) {
            console.error('Error creating student:', error);
            return res.status(500).send('Internal Server Error');
        }
    });
});


// Cloud Function to get all student claims
exports.getAllStudentClaimsV2 = onRequest((req, res) => {
    applyCors(req, res, async () => {
        if (req.method !== 'GET') {
            return res.status(405).send('Method Not Allowed');
        }

        try {
            const students = [];
            let nextPageToken;

            do {
                const listUsersResult = await admin.auth().listUsers(100, nextPageToken);
                nextPageToken = listUsersResult.pageToken;

                listUsersResult.users.forEach(user => {
                    if (user.customClaims && user.customClaims.role === 'student') {
                        students.push({
                            uid: user.uid,
                            email: user.email,
                            claims: user.customClaims,
                        });
                    }
                });
            } while (nextPageToken);

            return res.status(200).json({
                success: true,
                students,
            });
        } catch (error) {
            console.error('Error retrieving student claims:', error);
            return res.status(500).send('Internal Server Error');
        }
    });
});

// Cloud Function to delete a student
exports.deleteStudentV2 = onRequest((req, res) => {
    applyCors(req, res, async () => {
        if (req.method !== 'DELETE') {
            return res.status(405).send('Method Not Allowed');
        }

        const { uid } = req.body;

        if (!uid) {
            return res.status(400).send('Missing required field: uid');
        }

        try {
            await admin.auth().deleteUser(uid);

            const userDocRef = admin.firestore().collection('students').doc(uid);
            await userDocRef.delete();

            return res.status(200).send(`Student with UID ${uid} deleted successfully.`);
        } catch (error) {
            console.error('Error deleting student:', error);
            return res.status(500).send('Internal Server Error');
        }
    });
});

// Cloud Function to get a student by ID
exports.getStudentByIdV2 = onRequest((req, res) => {
    applyCors(req, res, async () => {
        if (req.method !== 'GET') {
            return res.status(405).send('Method Not Allowed');
        }

        const uid = req.query.uid;

        if (!uid) {
            return res.status(400).send('Missing required query parameter: uid');
        }

        try {
            const userRecord = await admin.auth().getUser(uid);

            const response = {
                uid: userRecord.uid,
                email: userRecord.email,
                displayName: userRecord.displayName,
                claims: userRecord.customClaims || {},
            };

            return res.status(200).json({
                success: true,
                student: response,
            });
        } catch (error) {
            console.error('Error retrieving student:', error);
            return res.status(500).send('Internal Server Error');
        }
    });
});


// Cloud Function to update a student
exports.updateStudentV2 = onRequest(async (req, res) => {
    applyCors(req, res, async () => {
        // Ensure the request method is PATCH or POST
        if (req.method !== 'PATCH' && req.method !== 'POST') {
            return res.status(405).send('Method Not Allowed');
        }

        const uid = req.query.uid; // Get UID from query parameter
        const { firstName, lastName, email, dateOfBirth, enrollmentDate, major } = req.body;

        // Validate input
        if (!uid) {
            return res.status(400).send('Missing required query parameter: uid');
        }

        try {
            // Prepare update object
            const updateData = {};
            const claims = {};

            // Update user authentication details
            if (email) {
                updateData.email = email;
            }

            // Prepare custom claims
            if (firstName) claims.firstName = firstName;
            if (lastName) claims.lastName = lastName;
            if (dateOfBirth) claims.dateOfBirth = dateOfBirth;
            if (enrollmentDate) claims.enrollmentDate = enrollmentDate;
            if (major) claims.major = major;

            // Set custom claims if there are any
            if (Object.keys(claims).length > 0) {
                claims.role = 'student';
                await admin.auth().setCustomUserClaims(uid, claims);
            }

            // Update user in Firebase Authentication if needed
            if (Object.keys(updateData).length > 0) {
                await admin.auth().updateUser(uid, updateData);
            }

            return res.status(200).send(`Student with UID ${uid} updated successfully.`);
        } catch (error) {
            logError('Error updating student:', error);
            return res.status(500).send('Internal Server Error');
        }
    });
});