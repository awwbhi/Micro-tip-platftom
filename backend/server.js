/**
 * ============================================================================
 * Micro-Tip Platform - Node.js API Server
 * ============================================================================
 * A comprehensive RESTful API server for a micro-tipping platform.
 * Features include user authentication, tip management, and account handling.
 * ============================================================================
 */

// ============================================================================
// IMPORTS & DEPENDENCIES
// ============================================================================
// Import required modules for the server
const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// ============================================================================
// ENVIRONMENT SETUP
// ============================================================================
// Load environment variables from .env file
dotenv.config();

// Initialize Express application
const app = express();

// Define port and database connection string from environment variables
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/micro-tip-platform';
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_change_in_production';
const JWT_EXPIRE = process.env.JWT_EXPIRE || '7d';

// ============================================================================
// MIDDLEWARE CONFIGURATION
// ============================================================================

// Apply security headers using helmet middleware
app.use(helmet());

// Enable CORS (Cross-Origin Resource Sharing) for cross-domain requests
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));

// Parse incoming JSON requests
app.use(express.json({ limit: '10mb' }));

// Parse URL-encoded form data
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// ============================================================================
// RATE LIMITING
// ============================================================================
// Implement rate limiting to prevent abuse and DDoS attacks

// General rate limiter: 100 requests per 15 minutes per IP
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Authentication rate limiter: 5 requests per 15 minutes per IP
// Stricter limits for login/register endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many authentication attempts, please try again later.',
  skipSuccessfulRequests: true, // Don't count successful requests
});

// Apply general rate limiter to all routes
app.use(generalLimiter);

// ============================================================================
// DATABASE CONNECTION
// ============================================================================
// Establish connection to MongoDB database

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('✓ MongoDB connected successfully'))
  .catch(err => console.error('✗ MongoDB connection error:', err));

// ============================================================================
// DATABASE SCHEMAS & MODELS
// ============================================================================

// USER SCHEMA
// Defines the structure and validation for user documents
const userSchema = new mongoose.Schema({
  // Basic user information
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters'],
    maxlength: [30, 'Username cannot exceed 30 characters'],
    lowercase: true,
    match: [/^[a-zA-Z0-9_-]+$/, 'Username can only contain alphanumeric characters, underscores, and hyphens'],
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Invalid email format'],
  },
  // Password stored as hashed value for security
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false, // Don't include password in default queries
  },
  // User profile information
  displayName: {
    type: String,
    trim: true,
    maxlength: [50, 'Display name cannot exceed 50 characters'],
  },
  bio: {
    type: String,
    maxlength: [500, 'Bio cannot exceed 500 characters'],
  },
  avatar: {
    type: String, // URL to avatar image
    default: null,
  },
  // Account balance tracking
  balance: {
    type: Number,
    default: 0,
    min: [0, 'Balance cannot be negative'],
  },
  // Account statistics
  totalTipsReceived: {
    type: Number,
    default: 0,
    min: 0,
  },
  totalTipsGiven: {
    type: Number,
    default: 0,
    min: 0,
  },
  // Account status
  isVerified: {
    type: Boolean,
    default: false,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  // Timestamps for account creation and updates
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// TIP SCHEMA
// Defines the structure for tip transactions
const tipSchema = new mongoose.Schema({
  // References to user documents
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Sender ID is required'],
  },
  recipientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Recipient ID is required'],
  },
  // Tip details
  amount: {
    type: Number,
    required: [true, 'Tip amount is required'],
    min: [0.01, 'Tip amount must be greater than 0'],
    max: [10000, 'Tip amount cannot exceed 10000'],
  },
  message: {
    type: String,
    maxlength: [500, 'Tip message cannot exceed 500 characters'],
  },
  // Tip status tracking
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending',
  },
  // Transaction reference
  transactionId: {
    type: String,
    unique: true,
  },
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
  },
  completedAt: Date,
});

// TRANSACTION SCHEMA
// Records all financial transactions for auditing and history
const transactionSchema = new mongoose.Schema({
  // User involved in transaction
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  // Transaction details
  type: {
    type: String,
    enum: ['deposit', 'withdrawal', 'tip_sent', 'tip_received'],
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  description: String,
  // Related tip (if applicable)
  tipId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tip',
  },
  // Balance before and after transaction
  balanceBefore: Number,
  balanceAfter: Number,
  // Transaction status
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending',
  },
  // Timestamp
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Create models from schemas
const User = mongoose.model('User', userSchema);
const Tip = mongoose.model('Tip', tipSchema);
const Transaction = mongoose.model('Transaction', transactionSchema);

// ============================================================================
// MIDDLEWARE - AUTHENTICATION & AUTHORIZATION
// ============================================================================

/**
 * Authentication Middleware
 * Verifies JWT token and attaches user information to request object
 * Usage: app.use(authenticate) or app.get('/protected', authenticate, handler)
 */
const authenticate = (req, res, next) => {
  try {
    // Extract token from Authorization header (format: "Bearer <token>")
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No authentication token provided',
      });
    }

    // Extract the token part
    const token = authHeader.substring(7);

    // Verify and decode the JWT token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Attach user ID to request for use in subsequent handlers
    req.userId = decoded.id;
    
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
      error: error.message,
    });
  }
};

/**
 * Optional Authentication Middleware
 * Attempts to authenticate but doesn't fail if token is missing
 * Useful for endpoints that work with or without authentication
 */
const optionalAuthenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, JWT_SECRET);
      req.userId = decoded.id;
    }
    
    next();
  } catch (error) {
    // Silently continue without user authentication
    next();
  }
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Generate JWT token for authenticated user
 * @param {String} userId - User's MongoDB ID
 * @returns {String} - JWT token
 */
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: JWT_EXPIRE });
};

/**
 * Hash password for secure storage
 * @param {String} password - Plain text password
 * @returns {String} - Hashed password
 */
const hashPassword = async (password) => {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
};

/**
 * Compare plain text password with hashed password
 * @param {String} plainPassword - Plain text password from user input
 * @param {String} hashedPassword - Hashed password from database
 * @returns {Boolean} - True if passwords match, false otherwise
 */
const comparePassword = async (plainPassword, hashedPassword) => {
  return bcrypt.compare(plainPassword, hashedPassword);
};

/**
 * Generate unique transaction ID
 * Format: TXN_TIMESTAMP_RANDOM
 * @returns {String} - Unique transaction ID
 */
const generateTransactionId = () => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `TXN_${timestamp}_${random}`;
};

// ============================================================================
// ROUTES - HEALTH CHECK
// ============================================================================

/**
 * Health Check Endpoint
 * GET /health
 * Returns server status and basic information
 */
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// ============================================================================
// ROUTES - AUTHENTICATION (register, login, logout)
// ============================================================================

/**
 * User Registration
 * POST /api/auth/register
 * Creates a new user account with provided credentials
 * 
 * Request Body:
 *   - username (string, required): Unique username
 *   - email (string, required): Unique email address
 *   - password (string, required): Password (min 6 characters)
 *   - displayName (string, optional): User's display name
 * 
 * Response: User object with auth token
 */
app.post('/api/auth/register', authLimiter, async (req, res) => {
  try {
    const { username, email, password, displayName } = req.body;

    // Validate required fields
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username, email, and password are required',
      });
    }

    // Check if user already exists (by username or email)
    const existingUser = await User.findOne({
      $or: [{ username }, { email }],
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Username or email already exists',
      });
    }

    // Hash the password before storing
    const hashedPassword = await hashPassword(password);

    // Create new user document
    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      displayName: displayName || username,
    });

    // Save user to database
    await newUser.save();

    // Generate authentication token
    const token = generateToken(newUser._id);

    // Return success response with user data and token
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        userId: newUser._id,
        username: newUser.username,
        email: newUser.email,
        displayName: newUser.displayName,
      },
      token,
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Error during registration',
      error: error.message,
    });
  }
});

/**
 * User Login
 * POST /api/auth/login
 * Authenticates user and returns JWT token
 * 
 * Request Body:
 *   - email (string, required): User's email
 *   - password (string, required): User's password
 * 
 * Response: User object with auth token
 */
app.post('/api/auth/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }

    // Find user by email (need to select password field specifically)
    const user = await User.findOne({ email }).select('+password');

    // Check if user exists
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Check if user account is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'This account has been deactivated',
      });
    }

    // Compare provided password with stored hashed password
    const isPasswordValid = await comparePassword(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Generate authentication token
    const token = generateToken(user._id);

    // Return success response
    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        userId: user._id,
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        balance: user.balance,
      },
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Error during login',
      error: error.message,
    });
  }
});

/**
 * User Logout
 * POST /api/auth/logout
 * Logs out user (client-side token removal is primary)
 * This endpoint is here for completeness and audit logging
 */
app.post('/api/auth/logout', authenticate, (req, res) => {
  try {
    // In a stateless JWT system, logout is handled client-side
    // by removing the token from storage
    // This endpoint can be used for audit logging if needed
    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error during logout',
      error: error.message,
    });
  }
});

// ============================================================================
// ROUTES - ACCOUNT MANAGEMENT
// ============================================================================

/**
 * Get Current User Profile
 * GET /api/account/profile
 * Returns authenticated user's profile information
 * Requires: Valid JWT token in Authorization header
 */
app.get('/api/account/profile', authenticate, async (req, res) => {
  try {
    // Find user by ID from authenticated request
    const user = await User.findById(req.userId).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Return user profile
    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching profile',
      error: error.message,
    });
  }
});

/**
 * Update User Profile
 * PUT /api/account/profile
 * Updates user's profile information
 * Requires: Valid JWT token in Authorization header
 * 
 * Request Body (all optional):
 *   - displayName (string): User's display name
 *   - bio (string): User's biography
 *   - avatar (string): URL to avatar image
 */
app.put('/api/account/profile', authenticate, async (req, res) => {
  try {
    const { displayName, bio, avatar } = req.body;

    // Find and update user
    const user = await User.findByIdAndUpdate(
      req.userId,
      {
        // Only update fields that are provided
        ...(displayName && { displayName }),
        ...(bio && { bio }),
        ...(avatar && { avatar }),
        updatedAt: new Date(),
      },
      { new: true, runValidators: true } // Return updated document and run validators
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: user,
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating profile',
      error: error.message,
    });
  }
});

/**
 * Change Password
 * POST /api/account/change-password
 * Allows user to change their password
 * Requires: Valid JWT token in Authorization header
 * 
 * Request Body:
 *   - currentPassword (string, required): User's current password
 *   - newPassword (string, required): New password (min 6 characters)
 */
app.post('/api/account/change-password', authenticate, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Validate required fields
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required',
      });
    }

    // Validate new password length
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters',
      });
    }

    // Find user with password field
    const user = await User.findById(req.userId).select('+password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await comparePassword(
      currentPassword,
      user.password
    );

    if (!isCurrentPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect',
      });
    }

    // Hash new password
    const hashedNewPassword = await hashPassword(newPassword);

    // Update password
    user.password = hashedNewPassword;
    user.updatedAt = new Date();
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({
      success: false,
      message: 'Error changing password',
      error: error.message,
    });
  }
});

/**
 * Get User Account Statistics
 * GET /api/account/stats
 * Returns user's account statistics (balance, tips, etc.)
 * Requires: Valid JWT token in Authorization header
 */
app.get('/api/account/stats', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Get tip statistics
    const tipsReceived = await Tip.countDocuments({
      recipientId: req.userId,
      status: 'completed',
    });

    const tipsSent = await Tip.countDocuments({
      senderId: req.userId,
      status: 'completed',
    });

    // Calculate total tips received amount
    const totalTipsReceivedAmount = await Tip.aggregate([
      {
        $match: {
          recipientId: mongoose.Types.ObjectId(req.userId),
          status: 'completed',
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
        },
      },
    ]);

    // Calculate total tips sent amount
    const totalTipsSentAmount = await Tip.aggregate([
      {
        $match: {
          senderId: mongoose.Types.ObjectId(req.userId),
          status: 'completed',
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: {
        balance: user.balance,
        totalTipsReceived: tipsReceived,
        totalTipsSent: tipsSent,
        totalAmountReceived:
          totalTipsReceivedAmount.length > 0
            ? totalTipsReceivedAmount[0].total
            : 0,
        totalAmountSent:
          totalTipsSentAmount.length > 0 ? totalTipsSentAmount[0].total : 0,
        accountCreatedAt: user.createdAt,
        isVerified: user.isVerified,
      },
    });
  } catch (error) {
    console.error('Stats fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching account statistics',
      error: error.message,
    });
  }
});

/**
 * Deactivate Account
 * POST /api/account/deactivate
 * Deactivates user's account (soft delete)
 * Requires: Valid JWT token in Authorization header
 * 
 * Request Body:
 *   - password (string, required): User's password for confirmation
 */
app.post('/api/account/deactivate', authenticate, async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password is required for account deactivation',
      });
    }

    // Find user with password field
    const user = await User.findById(req.userId).select('+password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Password is incorrect',
      });
    }

    // Deactivate account
    user.isActive = false;
    user.updatedAt = new Date();
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Account deactivated successfully',
    });
  } catch (error) {
    console.error('Account deactivation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deactivating account',
      error: error.message,
    });
  }
});

// ============================================================================
// ROUTES - TIP MANAGEMENT
// ============================================================================

/**
 * Send a Tip
 * POST /api/tips/send
 * Creates a new tip transaction
 * Requires: Valid JWT token in Authorization header
 * 
 * Request Body:
 *   - recipientId (string, required): Recipient's user ID
 *   - amount (number, required): Tip amount (0.01 - 10000)
 *   - message (string, optional): Tip message (max 500 chars)
 */
app.post('/api/tips/send', authenticate, async (req, res) => {
  try {
    const { recipientId, amount, message } = req.body;

    // Validate required fields
    if (!recipientId || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Recipient ID and amount are required',
      });
    }

    // Validate amount
    if (amount < 0.01 || amount > 10000) {
      return res.status(400).json({
        success: false,
        message: 'Tip amount must be between 0.01 and 10000',
      });
    }

    // Check if sender and recipient are different
    if (req.userId === recipientId) {
      return res.status(400).json({
        success: false,
        message: 'You cannot send a tip to yourself',
      });
    }

    // Find sender
    const sender = await User.findById(req.userId);
    if (!sender) {
      return res.status(404).json({
        success: false,
        message: 'Sender not found',
      });
    }

    // Check if sender has sufficient balance
    if (sender.balance < amount) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient balance',
        currentBalance: sender.balance,
        requiredAmount: amount,
      });
    }

    // Find recipient
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({
        success: false,
        message: 'Recipient not found',
      });
    }

    // Create transaction ID
    const transactionId = generateTransactionId();

    // Create tip document
    const tip = new Tip({
      senderId: req.userId,
      recipientId,
      amount,
      message: message || null,
      transactionId,
      status: 'completed', // Assuming instant processing
      completedAt: new Date(),
    });

    // Save tip
    await tip.save();

    // Update sender balance (deduct tip amount)
    sender.balance -= amount;
    sender.totalTipsGiven += 1;
    sender.updatedAt = new Date();
    await sender.save();

    // Update recipient balance (add tip amount)
    recipient.balance += amount;
    recipient.totalTipsReceived += 1;
    recipient.updatedAt = new Date();
    await recipient.save();

    // Create transaction records
    const senderTransaction = new Transaction({
      userId: req.userId,
      type: 'tip_sent',
      amount,
      description: `Tip sent to ${recipient.username}`,
      tipId: tip._id,
      balanceBefore: sender.balance + amount,
      balanceAfter: sender.balance,
      status: 'completed',
    });

    const recipientTransaction = new Transaction({
      userId: recipientId,
      type: 'tip_received',
      amount,
      description: `Tip received from ${sender.username}`,
      tipId: tip._id,
      balanceBefore: recipient.balance - amount,
      balanceAfter: recipient.balance,
      status: 'completed',
    });

    await senderTransaction.save();
    await recipientTransaction.save();

    // Return success response
    res.status(201).json({
      success: true,
      message: 'Tip sent successfully',
      data: {
        tipId: tip._id,
        transactionId: tip.transactionId,
        amount: tip.amount,
        recipient: {
          id: recipient._id,
          username: recipient.username,
          displayName: recipient.displayName,
        },
        senderNewBalance: sender.balance,
        createdAt: tip.createdAt,
      },
    });
  } catch (error) {
    console.error('Send tip error:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending tip',
      error: error.message,
    });
  }
});

/**
 * Get Tip History
 * GET /api/tips/history
 * Returns user's tip history (sent and received)
 * Requires: Valid JWT token in Authorization header
 * 
 * Query Parameters:
 *   - type (string, optional): 'sent' or 'received' (default: both)
 *   - limit (number, optional): Maximum results (default: 20, max: 100)
 *   - skip (number, optional): Number of results to skip for pagination (default: 0)
 */
app.get('/api/tips/history', authenticate, async (req, res) => {
  try {
    const { type, limit = 20, skip = 0 } = req.query;

    // Validate limit (max 100 to prevent abuse)
    const queryLimit = Math.min(parseInt(limit) || 20, 100);
    const querySkip = parseInt(skip) || 0;

    // Build query based on type
    let query = {};
    if (type === 'sent') {
      query.senderId = req.userId;
    } else if (type === 'received') {
      query.recipientId = req.userId;
    } else {
      // Both sent and received
      query.$or = [{ senderId: req.userId }, { recipientId: req.userId }];
    }

    // Fetch tips with pagination
    const tips = await Tip.find(query)
      .populate('senderId', 'username displayName avatar')
      .populate('recipientId', 'username displayName avatar')
      .sort({ createdAt: -1 })
      .limit(queryLimit)
      .skip(querySkip);

    // Count total for pagination info
    const total = await Tip.countDocuments(query);

    res.status(200).json({
      success: true,
      data: tips,
      pagination: {
        total,
        limit: queryLimit,
        skip: querySkip,
        pages: Math.ceil(total / queryLimit),
      },
    });
  } catch (error) {
    console.error('Tip history fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching tip history',
      error: error.message,
    });
  }
});

/**
 * Get Tip Details
 * GET /api/tips/:tipId
 * Returns details of a specific tip
 * 
 * URL Parameters:
 *   - tipId (string): Tip document ID
 */
app.get('/api/tips/:tipId', optionalAuthenticate, async (req, res) => {
  try {
    const { tipId } = req.params;

    // Validate MongoDB ID format
    if (!tipId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid tip ID format',
      });
    }

    // Find tip
    const tip = await Tip.findById(tipId)
      .populate('senderId', 'username displayName avatar')
      .populate('recipientId', 'username displayName avatar');

    if (!tip) {
      return res.status(404).json({
        success: false,
        message: 'Tip not found',
      });
    }

    res.status(200).json({
      success: true,
      data: tip,
    });
  } catch (error) {
    console.error('Tip details fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching tip details',
      error: error.message,
    });
  }
});

/**
 * Get User's Leaderboard Standing
 * GET /api/tips/leaderboard/top
 * Returns top users by tips received or given
 * 
 * Query Parameters:
 *   - sortBy (string, optional): 'received' or 'given' (default: 'received')
 *   - limit (number, optional): Number of top users (default: 10, max: 50)
 */
app.get('/api/tips/leaderboard/top', async (req, res) => {
  try {
    const { sortBy = 'received', limit = 10 } = req.query;
    const queryLimit = Math.min(parseInt(limit) || 10, 50);

    // Determine sort field based on sortBy parameter
    let sortField = 'totalTipsReceived';
    let aggregationPipeline;

    if (sortBy === 'given') {
      aggregationPipeline = [
        {
          $match: { isActive: true },
        },
        {
          $sort: { totalTipsGiven: -1 },
        },
        {
          $limit: queryLimit,
        },
        {
          $project: {
            username: 1,
            displayName: 1,
            avatar: 1,
            totalTipsGiven: 1,
            totalTipsReceived: 1,
            balance: 1,
          },
        },
      ];
    } else {
      aggregationPipeline = [
        {
          $match: { isActive: true },
        },
        {
          $sort: { totalTipsReceived: -1 },
        },
        {
          $limit: queryLimit,
        },
        {
          $project: {
            username: 1,
            displayName: 1,
            avatar: 1,
            totalTipsReceived: 1,
            totalTipsGiven: 1,
            balance: 1,
          },
        },
      ];
    }

    const leaderboard = await User.aggregate(aggregationPipeline);

    res.status(200).json({
      success: true,
      sortBy,
      data: leaderboard,
    });
  } catch (error) {
    console.error('Leaderboard fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching leaderboard',
      error: error.message,
    });
  }
});

// ============================================================================
// ROUTES - USER DISCOVERY
// ============================================================================

/**
 * Search Users
 * GET /api/users/search
 * Searches for users by username or display name
 * 
 * Query Parameters:
 *   - q (string, required): Search query
 *   - limit (number, optional): Maximum results (default: 10, max: 50)
 */
app.get('/api/users/search', async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required',
      });
    }

    const queryLimit = Math.min(parseInt(limit) || 10, 50);

    // Search for users matching the query (case-insensitive)
    const searchRegex = new RegExp(q, 'i');
    const users = await User.find({
      isActive: true,
      $or: [{ username: searchRegex }, { displayName: searchRegex }],
    })
      .select('username displayName avatar totalTipsReceived')
      .limit(queryLimit);

    res.status(200).json({
      success: true,
      query: q,
      data: users,
    });
  } catch (error) {
    console.error('User search error:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching users',
      error: error.message,
    });
  }
});

/**
 * Get User Public Profile
 * GET /api/users/:userId
 * Returns public profile information of a user
 * 
 * URL Parameters:
 *   - userId (string): User's MongoDB ID or username
 */
app.get('/api/users/:userId', optionalAuthenticate, async (req, res) => {
  try {
    const { userId } = req.params;

    let user;

    // Check if userId is a valid MongoDB ID
    if (userId.match(/^[0-9a-fA-F]{24}$/)) {
      user = await User.findById(userId);
    } else {
      // Search by username
      user = await User.findOne({ username: userId });
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Don't show password and sensitive info
    const userProfile = {
      _id: user._id,
      username: user.username,
      displayName: user.displayName,
      bio: user.bio,
      avatar: user.avatar,
      totalTipsReceived: user.totalTipsReceived,
      totalTipsGiven: user.totalTipsGiven,
      createdAt: user.createdAt,
    };

    res.status(200).json({
      success: true,
      data: userProfile,
    });
  } catch (error) {
    console.error('User profile fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user profile',
      error: error.message,
    });
  }
});

// ============================================================================
// ROUTES - TRANSACTION HISTORY
// ============================================================================

/**
 * Get Transaction History
 * GET /api/transactions
 * Returns user's transaction history
 * Requires: Valid JWT token in Authorization header
 * 
 * Query Parameters:
 *   - type (string, optional): Transaction type filter
 *   - limit (number, optional): Maximum results (default: 20, max: 100)
 *   - skip (number, optional): Number of results to skip (default: 0)
 */
app.get('/api/transactions', authenticate, async (req, res) => {
  try {
    const { type, limit = 20, skip = 0 } = req.query;

    const queryLimit = Math.min(parseInt(limit) || 20, 100);
    const querySkip = parseInt(skip) || 0;

    // Build query
    let query = { userId: req.userId };
    if (type) {
      query.type = type;
    }

    // Fetch transactions with pagination
    const transactions = await Transaction.find(query)
      .sort({ createdAt: -1 })
      .limit(queryLimit)
      .skip(querySkip)
      .populate('tipId');

    const total = await Transaction.countDocuments(query);

    res.status(200).json({
      success: true,
      data: transactions,
      pagination: {
        total,
        limit: queryLimit,
        skip: querySkip,
        pages: Math.ceil(total / queryLimit),
      },
    });
  } catch (error) {
    console.error('Transaction history fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching transaction history',
      error: error.message,
    });
  }
});

// ============================================================================
// ERROR HANDLING MIDDLEWARE
// ============================================================================

/**
 * 404 Not Found Handler
 * Handles requests to undefined routes
 */
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    path: req.path,
    method: req.method,
  });
});

/**
 * Global Error Handler
 * Catches unhandled errors in route handlers
 */
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);

  // Determine status code
  const statusCode = err.statusCode || err.status || 500;

  // Return error response
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err : {},
  });
});

// ============================================================================
// SERVER START
// ============================================================================

// Start the server on specified port
const server = app.listen(PORT, () => {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`✓ Server running on http://localhost:${PORT}`);
  console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`✓ Database: ${MONGODB_URI}`);
  console.log(`${'='.repeat(60)}\n`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('\nSIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    mongoose.connection.close(false, () => {
      console.log('MongoDB connection closed');
      process.exit(0);
    });
  });
});

// Export app for testing
module.exports = app;
