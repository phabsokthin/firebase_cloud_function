const { onRequest } = require("firebase-functions/v2/https");
const admin = require('firebase-admin');
const cors = require('cors');



const corsOptions = cors({ origin: 'http://localhost:5173', methods: ['GET', 'POST', 'OPTIONS'], allowedHeaders: ['Content-Type', 'Authorization'], credentials: true });

exports.createStudent = onRequest(async (req, res) => {
    // Use the CORS middleware
    corsOptions(req, res, async () => {
        if (req.method === 'OPTIONS') {
            return res.status(204).send('');
        }

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




const corsOptionsGetAllStudent = cors({
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
});

// Cloud Function to get all student claims
exports.getAllStudentClaimsV2 = onRequest(async (req, res) => {
    // Apply CORS
    corsOptionsGetAllStudent(req, res, async () => {
        // Ensure the request method is GET
        if (req.method !== 'GET') {
            return res.status(405).send('Method Not Allowed');
        }

        try {
            const students = []; // Array to hold student claims
            let nextPageToken;

            do {
                // List users
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
            } while (nextPageToken); // Continue until all users have been retrieved

            // Send response with the list of students
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


// CORS options for the endpoint
const corsOptionsDeleteStudent = cors({
    origin: 'http://localhost:5173', // Update with your frontend URL
    methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
});

// Cloud Function to delete a student
exports.deleteStudentV2 = onRequest(async (req, res) => {
    // Apply CORS
    corsOptionsDeleteStudent(req, res, async () => {
        // Ensure the request method is DELETE
        if (req.method !== 'DELETE') {
            return res.status(405).send('Method Not Allowed');
        }

        const { uid } = req.body; // Get UID from request body

        // Validate input
        if (!uid) {
            return res.status(400).send('Missing required field: uid');
        }

        try {
            // Delete user from Firebase Authentication
            await admin.auth().deleteUser(uid);

            // Optionally, delete user data from Firestore if applicable
            const userDocRef = admin.firestore().collection('students').doc(uid);
            await userDocRef.delete(); // Assumes student data is stored in a 'students' collection

            return res.status(200).send(`Student with UID ${uid} deleted successfully.`);
        } catch (error) {
            console.error('Error deleting student:', error);
            return res.status(500).send('Internal Server Error');
        }
    });
});

exports.updateStudentV2 = onRequest(async (req, res) => {
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

        // Update user authentication details
        if (email) {
            updateData.email = email;
        }
        const claims = {};
        if (firstName) claims.firstName = firstName;
        if (lastName) claims.lastName = lastName;
        if (dateOfBirth) claims.dateOfBirth = dateOfBirth;
        if (enrollmentDate) claims.enrollmentDate = enrollmentDate;
        if (major) claims.major = major;
        
        if (Object.keys(claims).length > 0) {
            claims.role = 'student';
            await admin.auth().setCustomUserClaims(uid, claims);
        }

        await admin.auth().updateUser(uid, updateData);
        return res.status(200).send(`Student with UID ${uid} updated successfully.`);
    } catch (error) {
        console.error('Error updating student:', error);
        return res.status(500).send('Internal Server Error');
    }
});

exports.getStudentByIdV2 = onRequest(async (req, res) => {

    if (req.method !== 'GET') {
        return res.status(405).send('Method Not Allowed');
    }

    const uid = req.query.uid;

    if (!uid) {
        return res.status(400).send('Missing required query parameter: uid');
    }

    try {
        // Retrieve user from Firebase Authentication
        const userRecord = await admin.auth().getUser(uid);

        // Get user claims
        const claims = await admin.auth().getUser(uid).then(user => user.customClaims || {});

        // Prepare response data
        const response = {
            uid: userRecord.uid,
            email: userRecord.email,
            displayName: userRecord.displayName,
            claims, // Include custom claims
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