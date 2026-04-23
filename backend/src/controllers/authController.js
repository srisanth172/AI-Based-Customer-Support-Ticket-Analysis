const crypto = require('crypto');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../services/emailService');

const register = async (req, res, next) => {
  try {
    const { name, email, password, role = 'customer' } = req.body;
    // Only allow admin registration for srisanth
    if (role === 'admin') {
      if (name !== 'srisanth' || password !== 'qwerty@12') {
        return res.status(403).json({ message: 'Only the reserved admin user can be registered.' });
      }
      // Prevent duplicate admin
      const existingAdmin = await User.findOne({ name: 'srisanth', role: 'admin' });
      if (existingAdmin) {
        return res.status(400).json({ message: 'Admin user already exists.' });
      }
    }
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }
    const userName = name || email.split('@')[0];
    const user = await User.create({ name: userName, email, password, role });
    
    // Generate and send verification code via Brevo API
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    user.verificationCode = verificationCode;
    await user.save();
    
    try {
      await sendVerificationEmail(email, verificationCode);
      console.log(`Verification email sent to ${email}`);
    } catch (err) {
      console.error('Email failed to send, but user was created:', err);
    }
    
    return res.status(201).json({
      message: 'Account created successfully. Please check your email for the verification code.',
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
    const { name, password } = req.body; // 'name' here can be either username or email
    let user;
    // Restrict admin login to srisanth only
    if (name === 'srisanth') {
      user = await User.findOne({ name: 'srisanth', role: 'admin' });
      if (!user || password !== 'qwerty@12') {
        return res.status(401).json({ message: 'Invalid admin credentials' });
      }
    } else {
      user = await User.findOne({ $or: [{ name }, { email: name }] });
      if (!user || !(await user.matchPassword(password))) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      // Prevent customer login as admin
      if (user.role === 'admin' && user.name !== 'srisanth') {
        return res.status(403).json({ message: 'Admin access restricted.' });
      }
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

const verifyEmail = async (req, res, next) => {
  try {
    const { email, code } = req.body;
    const user = await User.findOne({ email, verificationCode: code });

    if (!user) {
      return res.status(400).json({ message: 'Invalid verification code' });
    }

    user.isVerified = true;
    user.verificationCode = undefined;
    await user.save();

    return res.json({ message: 'Email verified successfully' });
  } catch (error) {
    return next(error);
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'No account with that email address exists.' });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    try {
      await sendPasswordResetEmail(email, resetToken);
      return res.json({ message: 'A password reset link has been sent to your email.' });
    } catch (err) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();
      return res.status(500).json({ message: 'Error sending the email. Please try again later.' });
    }
  } catch (error) {
    return next(error);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Password reset token is invalid or has expired.' });
    }

    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    return res.json({ message: 'Success! Your password has been changed.' });
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

const updateMe = async (req, res, next) => {
  try {
    const { name, email, password, settings } = req.body;
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (name) user.name = name;
    if (email) user.email = email;
    if (password && password.trim().length >= 6) user.password = password;
    
    // Deep merge settings
    if (settings) {
      if (!user.settings) user.settings = {};
      
      if (settings.notifications) {
        user.settings.notifications = { ...user.settings.notifications, ...settings.notifications };
      }
      if (settings.appearance) {
        user.settings.appearance = { ...user.settings.appearance, ...settings.appearance };
      }
      if (settings.system) {
        user.settings.system = { ...user.settings.system, ...settings.system };
      }
      if (settings.security) {
        user.settings.security = { ...user.settings.security, ...settings.security };
      }
      // Force mongoose to recognize sub-document changes
      user.markModified('settings');
    }

    console.log(`Updating user ${user._id}: ${user.name}`);
    await user.save();
    console.log('User saved successfully');
    const updatedUser = await User.findById(req.user.userId).select('-password');
    return res.json({ message: 'Profile updated successfully', user: updatedUser });
  } catch (error) {
    console.error('Update Profile Error:', error);
    return next(error);
  }
};

const getUsers = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access restricted to administrators' });
    }
    const users = await User.find({ role: 'customer' }).select('-password');
    return res.json(users);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  register,
  login,
  verifyEmail,
  forgotPassword,
  resetPassword,
  getMe,
  updateMe,
  getUsers
};
