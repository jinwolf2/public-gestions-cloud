// routes/userRoutes.js
const express = require('express');
const { registerUser, loginUser, getUserProfile, updateDiskSpace } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/profile', protect, getUserProfile);
router.put('/update-disk/:id', protect, updateDiskSpace);


module.exports = router;
