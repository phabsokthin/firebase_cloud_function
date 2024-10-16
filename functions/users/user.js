const { onRequest } = require("firebase-functions/v2/https");
const admin = require('firebase-admin');
const db = admin.firestore();

exports.createUser = onRequest(async (req, res) => {
    try {
        const firstName = req.body.fname;
        const lastName = req.body.lname;

        if (!firstName || !lastName) {
            res.status(400).send('First name and last name are required.');
            return;
        }

        const data = {
            firstName: firstName,
            lastName: lastName
        };
        const docRef = await db.collection('users').add(data);
        res.status(200).send(`Document created with ID: ${docRef.id} បានជោគជ័យ`);
    } catch (err) {
        res.status(500).send('Error creating document');
    }
});

exports.getUsers = onRequest(async (req, res) => {
    try {
        const snapshot = await db.collection('users').get();

        if (snapshot.empty) {
            res.status(404).send('No users found');
            return;
        }

        let users = [];
        snapshot.forEach(doc => {
            users.push({ id: doc.id, ...doc.data() });
        });

        res.status(200).json(users);
    } catch (error) {
        res.status(500).send('Error fetching users');
    }
});


exports.getUserById = onRequest(async (req, res) => {
    try {
        const userId = req.query.id;

        if (!userId) {
            res.status(400).send('User ID is required');
            return;
        }

        const docRef = db.collection('users').doc(userId);
        const doc = await docRef.get();

        if (!doc.exists) {
            res.status(404).send('User not found');
            return;
        }

        res.status(200).json({ id: doc.id, ...doc.data() });
    } catch (error) {
        res.status(500).send('Error fetching user');
    }
});

exports.deleteUserById = onRequest(async (req, res) => {
    try {
        const userId = req.query.id;

        if (!userId) {
            res.status(400).send('User ID is required');
            return;
        }

        const docRef = db.collection('users').doc(userId);
        const doc = await docRef.get();

        if (!doc.exists) {
            res.status(404).send('User not found');
            return;
        }

        await docRef.delete();
        res.status(200).send(`User with ID ${userId} deleted successfully.`);
    } catch (error) {
        res.status(500).send('Error deleting user');
    }
});