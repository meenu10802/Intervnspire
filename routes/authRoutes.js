const express = require('express');
const router = express.Router();
const User = require('../models/user');

router.post('/register', async (req, res) => {
  try {
    const { name, email, department, year, programmingLanguage, password } = req.body;

    console.log('Form data:', req.body);

    if (!name || !email || !department || !year || !programmingLanguage || !password) {
      return res.render('register', {
        error: 'All fields are required',
        success: null,
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.render('register', {
        error: 'Email already exists',
        success: null,
      });
    }
router.get('/me', async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const user = await User.findById(req.session.userId);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    res.json({ id: user._id, score: user.score });
  } catch (err) {
    console.error('Get User Error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});
    const user = new User({
      name,
      email,
      department,
      year: Number(year),
      programmingLanguage,
      password,
    });

    const savedUser = await user.save();
    console.log('User saved:', savedUser);

    res.render('register', {
      success: 'Registration successful! Redirecting to login...',
      error: null,
    });
  } catch (err) {
    console.error('Registration Error:', err.message);
    res.render('register', {
      error: `Server error during registration: ${err.message}`,
      success: null,
    });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.render('login', {
        error: 'Email and password are required',
        success: null,
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.render('login', {
        error: 'Invalid credentials',
        success: null,
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.render('login', {
        error: 'Invalid credentials',
        success: null,
      });
    }

    req.session.userId = user._id;
    console.log('Session set:', req.session.userId);

    res.redirect('/home');
  } catch (err) {
    console.error('Login Error:', err.message);
    res.render('login', {
      error: `Server error during login: ${err.message}`,
      success: null,
    });
  }
});

module.exports = router;