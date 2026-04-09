const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const { sendEmail } = require('../services/emailService');
const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken'); // Fallback for testing without real Client ID

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID');

const register = async (req, res, next) => {
  try {
    const { name, email, password, role = 'customer' } = req.body;
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = await User.create({ name, email, password, role });

    return res.status(201).json({
      message: 'User created',
      token: generateToken(user._id, user.role),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    return next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { name, password } = req.body;
    const user = await User.findOne({ name });

    if (!user) {
      return res.status(401).json({ message: 'First account must be created' });
    }

    if (!(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    return res.json({
      message: 'Login successful',
      token: generateToken(user._id, user.role),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    return next(error);
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await sendEmail({
      to: email,
      subject: 'Password reset request',
      text: 'Use your reset password flow/token here.',
    });

    return res.json({ message: 'Reset link sent' });
  } catch (error) {
    return next(error);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ message: 'Token and new password are required' });
    }

    return res.json({ message: 'Password reset endpoint is available. Implement token verification logic as needed.' });
  } catch (error) {
    return next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.json(user);
  } catch (error) {
    return next(error);
  }
};

const googleAuth = async (req, res, next) => {
  try {
    const { credential, mode = 'login' } = req.body;
    let payload;

    try {
      payload = jwt.decode(credential);
      if (!payload) throw new Error('Invalid token');
    } catch (err) {
      return res.status(401).json({ message: 'Invalid Google credential' });
    }

    const { email, name, sub: googleId } = payload;
    let user = await User.findOne({ email });

    if (mode === 'login') {
      if (!user) {
        return res.status(401).json({ message: 'First signup to create an account.' });
      }
      return res.json({
        message: `Welcome back, ${user.name}!`,
        token: generateToken(user._id, user.role),
        user: { id: user._id, name: user.name, email: user.email, role: user.role },
      });
    }

    if (mode === 'register') {
      if (user) {
        return res.status(400).json({ message: 'Account already exists. Please sign in.' });
      }
      const randomPassword = Math.random().toString(36).slice(-8) + 'A1!';
      user = await User.create({
        name,
        email,
        password: randomPassword,
        role: 'customer'
      });
      return res.status(201).json({
        message: 'Account successfully created',
        token: generateToken(user._id, user.role),
        user: { id: user._id, name: user.name, email: user.email, role: user.role },
      });
    }

    return res.status(400).json({ message: 'Invalid authentication mode' });

  } catch (error) {
    return next(error);
  }
};

module.exports = {
  register,
  login,
  forgotPassword,
  resetPassword,
  getMe,
  googleAuth,
};
