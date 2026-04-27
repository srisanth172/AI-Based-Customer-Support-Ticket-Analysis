const crypto = require('crypto');
const axios = require('axios');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../services/emailService');
const Notification = require('../models/Notification');

const register = async (req, res, next) => {
  try {
    const { name, email, password, role = 'customer' } = req.body;
    // Only allow admin registration for srisanth
    if (role === 'admin') {
      if (name !== 'srisanth' || password !== 'shiva@05') {
        return res.status(403).json({ message: 'Only the reserved admin user can be registered with the correct credentials.' });
      }
      // Prevent duplicate admin
      const existingAdmin = await User.findOne({ name: 'srisanth', role: 'admin' });
      if (existingAdmin) {
        return res.status(400).json({ message: 'Admin user already exists.' });
      }
    }

    const existingUserByEmail = await User.findOne({ email });
    if (existingUserByEmail) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Handle Username Collision
    const baseName = (name || email.split('@')[0]).trim();
    let finalName = baseName;
    let counter = 1;

    // Check if name exists, if so append number
    while (await User.findOne({ name: { $regex: new RegExp(`^${finalName}$`, 'i') } })) {
      finalName = `${baseName}${counter}`;
      counter++;
    }

    const user = await User.create({ name: finalName, email, password, role });

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
    const { name: loginName, password } = req.body;
    console.log(`Login attempt for: ${loginName}`);

    if (!loginName || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    const trimmedPassword = password.trim();
    const identifier = loginName.toLowerCase().trim();

    // Find user by email (direct) or name (case-insensitive)
    const user = await User.findOne({
      $or: [
        { email: identifier },
        { name: { $regex: new RegExp(`^${identifier}$`, 'i') } }
      ]
    }).sort({ role: 1 }); // 'admin' comes before 'customer' alphabetically

    if (!user) {
      console.log(`Login failed: User not found for ${identifier}`);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    console.log(`User found during login: ${user.email}, role: ${user.role}`);
    console.log(`Password sent length: ${password ? password.length : 0}`);

    const isMatch = await user.matchPassword(trimmedPassword);
    if (!isMatch) {
      console.log(`Login failed: Password mismatch for ${identifier}. User password hash length in DB: ${user.password ? user.password.length : 'none'}`);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Restrict admin login to srisanth only
    if (user.role === 'admin' && user.name.toLowerCase() !== 'srisanth') {
      console.log(`Login restricted: Admin role but name is ${user.name}`);
      return res.status(403).json({ message: 'Admin access restricted.' });
    }

    console.log(`Login successful for: ${user.name} (${user.role})`);
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

const googleLogin = async (req, res, next) => {
  try {
    const { token, code } = req.body;
    console.log('[Google Login] Payload received:', { hasToken: !!token, hasCode: !!code });

    let email, name, email_verified;

    if (code) {
      console.log('[Google Login] Processing as code/access_token');
      // Auth-code flow (from custom button)
      try {
        if (!process.env.GOOGLE_CLIENT_SECRET) {
          throw new Error('GOOGLE_CLIENT_SECRET is not configured on the server');
        }
        const tokenRes = await axios.post('https://oauth2.googleapis.com/token', {
          code,
          client_id: process.env.GOOGLE_CLIENT_ID,
          client_secret: process.env.GOOGLE_CLIENT_SECRET,
          redirect_uri: 'postmessage',
          grant_type: 'authorization_code',
        });
        const idToken = tokenRes.data.id_token;
        const info = await axios.get(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`);
        email = info.data.email;
        name = info.data.name;
        email_verified = info.data.email_verified;
      } catch (exchangeErr) {
        console.warn('[Google Login] Exchange failed, trying fallback:', exchangeErr.message);
        // Fallback: If code was actually an id_token or access_token
        if (code.includes('.')) {
          console.log('[Google Login] Fallback: Treating as ID Token');
          const info = await axios.get(`https://oauth2.googleapis.com/tokeninfo?id_token=${code}`);
          email = info.data.email;
          name = info.data.name;
          email_verified = info.data.email_verified;
        } else {
          console.log('[Google Login] Fallback: Treating as Access Token');
          const info = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${code}` }
          });
          console.log('[Google Login] Userinfo received for email:', info.data.email);
          email = info.data.email;
          name = info.data.name;
          email_verified = info.data.email_verified || true;
        }
      }
    } else if (token) {
      // Direct token flow (id_token or access_token)
      console.log('[Google Login] Processing as direct token');
      const segments = token.split('.');
      if (segments.length === 3) {
        console.log('[Google Login] Treating as JWT (ID Token)');
        const info = await axios.get(`https://oauth2.googleapis.com/tokeninfo?id_token=${token}`);
        email = info.data.email;
        name = info.data.name;
        email_verified = info.data.email_verified;
      } else {
        console.log('[Google Login] Treating as Access Token');
        const info = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log('[Google Login] Userinfo received for email:', info.data.email);
        email = info.data.email;
        name = info.data.name;
        email_verified = info.data.email_verified || true;
      }
    } else {
      return res.status(400).json({ message: 'No token or code provided' });
    }

    if (email_verified === 'false' || email_verified === false) {
      return res.status(400).json({ message: 'Email not verified by Google' });
    }

    let user = await User.findOne({ email });
    if (!user) {
      const randomPassword = crypto.randomBytes(16).toString('hex');
      user = await User.create({
        name: name || email.split('@')[0],
        email,
        password: randomPassword,
        role: 'customer',
        isVerified: true
      });
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
    console.error('Google login error:', error.response?.data || error.message);
    return res.status(401).json({ message: 'Invalid Google token' });
  }

};

const verifyEmail = async (req, res, next) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      return res.status(400).json({ message: 'Email and code are required' });
    }
    const user = await User.findOne({ email, verificationCode: code.trim() });

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

const resendOTP = async (req, res, next) => {
  try {
    const { email } = req.body;
    console.log('Resend OTP requested for:', email);
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: 'Email already verified' });
    }

    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    user.verificationCode = verificationCode;
    await user.save();

    try {
      await sendVerificationEmail(email, verificationCode);
      return res.json({ message: 'A new verification code has been sent to your email.' });
    } catch (err) {
      console.error('Resend OTP failed:', err);
      return res.status(500).json({ message: 'Failed to send verification email. Please try again.' });
    }
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
    if (password && password.trim().length >= 6) {
      user.password = password;
      // Notify Admin
      await Notification.create({
        recipient: 'admin',
        title: 'User Password Changed',
        description: `Customer ${user.email} (${user.name}) has changed their password.`,
        type: 'warning'
      });
    }

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
  googleLogin,
  verifyEmail,
  resendOTP,
  forgotPassword,
  resetPassword,
  getMe,
  updateMe,
  getUsers
};
