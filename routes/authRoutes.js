const express = require('express');
const { authenticateUser,signOut } = require('../controllers/authController');
const router = express.Router();

router.post('/signout', signOut);

router.post('/login', authenticateUser);

module.exports = router;
