const express = require('express');
const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(cookieParser());
const isProduction = process.env.NODE_ENV === 'production';
app.use(session({
  secret: process.env.SESSION_SECRET || 'knowzilla-secret-key-change-in-prod',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: isProduction,          // HTTPS only on Vercel
    sameSite: isProduction ? 'none' : 'lax',  // cross-origin cookies on Vercel
    maxAge: 24 * 60 * 60 * 1000   // 24h
  }
}));
app.use(cors({
  credentials: true,
  origin: function (origin, callback) {
    // Allow no-origin (same-origin), localhost, 127.0.0.1, and *.vercel.app
    if (
      !origin ||
      /https?:\/\/localhost(:\d+)?$/.test(origin) ||
      /https?:\/\/127\.0\.0\.1(:\d+)?$/.test(origin) ||
      /https?:\/\/[a-zA-Z0-9-]+\.vercel\.app$/.test(origin)
    ) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static HTML/CSS/JS from current dir
app.use(express.static(__dirname));

// MongoDB connection with local fallback
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ MongoDB Atlas Connected");
  } catch (err) {
    console.log("⚠️ MongoDB Atlas failed, trying local fallback:", err.message);
    try {
      await mongoose.connect("mongodb://127.0.0.1:27017/knowzilla");
      console.log("✅ Local MongoDB Connected");
    } catch (localErr) {
      console.log("❌ MongoDB Error: Both Atlas and Local connections failed.");
    }
  }
};
connectDB();

// Schemas
const userSchema = new mongoose.Schema({
  name: String,
  registration_no: { type: String, unique: true },
  email: { type: String, unique: true },
  phone_no: String,
  class: String,
  password: String,
  created_at: { type: Date, default: Date.now }
});

const contactSchema = new mongoose.Schema({
  name: String,
  phone: String,
  email: String,
  message: String,
  submitted_at: { type: Date, default: Date.now }
});

const reviewSchema = new mongoose.Schema({
  name: String,
  phone: String,
  email: String,
  message: String,
  submitted_at: { type: Date, default: Date.now }
});

const subscriptionSchema = new mongoose.Schema({
  email: { type: String, unique: true },
  subscribed_at: { type: Date, default: Date.now }
});

const quizAttemptSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  username: String,
  subject: String,
  score: Number,
  total: Number,
  percentage: Number,
  completed_at: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const Contact = mongoose.model('Contact', contactSchema);
const Review = mongoose.model('Review', reviewSchema);
const Subscription = mongoose.model('Subscription', subscriptionSchema);
const QuizAttempt = mongoose.model('QuizAttempt', quizAttemptSchema);

const userProfileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', unique: true },
  username: String,
  registration_no: String,
  email: String,
  phone_no: String,
  class: String,
  totalQuizzes: { type: Number, default: 0 },
  highScore: { type: Number, default: 0 },
  avgScore: { type: Number, default: 0 },
  updated_at: { type: Date, default: Date.now }
});

const UserProfile = mongoose.model('UserProfile', userProfileSchema);

// Helper to dynamically redirect back to the client's origin (e.g. port 3000 vs 5000)
const getRedirectUrl = (req, targetPath) => {
  const referer = req.get('Referer');
  if (referer) {
    try {
      const url = new URL(referer);
      return `${url.origin}${targetPath}`;
    } catch (e) {
      // ignore
    }
  }
  return targetPath;
};

// ============ API Routes ============

app.post('/api/register', async (req, res) => {
  try {
    const { name, registration_no, email, phone_no, class: cls, password } = req.body;
    const hashed = await bcrypt.hash(password, 10);
    const user = new User({ name, registration_no, email, phone_no, class: cls, password: hashed });
    await user.save();
    
    // Create initial UserProfile in Atlas
    const profile = new UserProfile({
      userId: user._id,
      username: user.name,
      registration_no: user.registration_no,
      email: user.email,
      phone_no: user.phone_no,
      class: user.class,
      totalQuizzes: 0,
      highScore: 0,
      avgScore: 0
    });
    await profile.save();

    req.session.user = { registration_no, name };
    if (req.xhr || (req.headers['accept'] && req.headers['accept'].includes('application/json'))) {
      return res.json({ success: true, user: { registration_no, name } });
    }
    res.redirect(getRedirectUrl(req, '/login.html?success=registered'));
  } catch (err) {
    let msg = 'An unknown error occurred';
    if (err.code === 11000) {
      msg = 'Registration number or email already exists.';
    }
    if (req.xhr || (req.headers['accept'] && req.headers['accept'].includes('application/json'))) {
      return res.status(400).json({ error: msg });
    }
    if (err.code === 11000) {
      res.redirect(getRedirectUrl(req, '/login.html?error=duplicate'));
    } else {
      res.redirect(getRedirectUrl(req, '/login.html?error=unknown'));
    }
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { registration_no, password } = req.body;
    const user = await User.findOne({ registration_no });
    if (user && await bcrypt.compare(password, user.password)) {
      req.session.user = { registration_no, name: user.name };
      if (req.xhr || (req.headers['accept'] && req.headers['accept'].includes('application/json'))) {
        return res.json({ success: true, user: { registration_no, name: user.name } });
      }
      res.redirect(getRedirectUrl(req, '/index.html'));
    } else {
      if (req.xhr || (req.headers['accept'] && req.headers['accept'].includes('application/json'))) {
        return res.status(401).json({ error: 'Invalid credentials. Please check your registration number and password.' });
      }
      res.redirect(getRedirectUrl(req, '/login.html?error=invalid'));
    }
  } catch (err) {
    if (req.xhr || (req.headers['accept'] && req.headers['accept'].includes('application/json'))) {
      return res.status(500).json({ error: 'An unknown error occurred' });
    }
    res.redirect(getRedirectUrl(req, '/login.html?error=unknown'));
  }
});

app.post('/api/contact', async (req, res) => {
  try {
    console.log('Contact form data:', req.body);
    const { name, phone, email, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const contact = new Contact({ name, phone, email, message });
    await contact.save();
    console.log('Contact saved:', contact._id);
    res.json({ success: true, message: 'Message sent successfully!' });
  } catch (err) {
    console.error('Contact save error:', err);
    res.status(500).json({ error: 'Failed to save contact' });
  }
});

app.post('/api/review', async (req, res) => {
  try {
    const { name, phone, email, message } = req.body;
    await new Review({ name, phone, email, message }).save();
    res.json({ success: true, message: 'Review submitted successfully!' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to submit review' });
  }
});

app.post('/api/subscribe', async (req, res) => {
  try {
    console.log('Subscribe data:', req.body);
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email required' });
    }
    const subscription = new Subscription({ email });
    await subscription.save();
    console.log('Subscription saved:', subscription._id);
    res.json({ success: true, message: 'Subscribed successfully!' });
  } catch (err) {
    console.error('Subscribe error:', err);
    if (err.code === 11000) {
      return res.status(409).json({ error: 'Email already subscribed' });
    }
    res.status(500).json({ error: 'Failed to subscribe' });
  }
});

app.get('/api/session', async (req, res) => {
  if (req.session && req.session.user) {
    res.json({ user: req.session.user });
  } else {
    res.json({ user: null });
  }
});

app.post('/api/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ success: true });
  });
});

app.get('/api/reviews', async (req, res) => {
  const reviews = await Review.find().sort({ submitted_at: -1 });
  res.json(reviews);
});

// Quiz Score Submission
app.post('/api/submit-score', async (req, res) => {
  try {
    if (!req.session || !req.session.user) {
      return res.status(401).json({ error: 'Unauthorized. Please login first.' });
    }
    const { subject, score, total, percentage } = req.body;
    const user = await User.findOne({ registration_no: req.session.user.registration_no });
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }
    const attempt = new QuizAttempt({
      userId: user._id,
      username: user.name,
      subject,
      score,
      total,
      percentage,
      completed_at: new Date()
    });
    await attempt.save();

    // Fetch attempts to aggregate
    const attempts = await QuizAttempt.find({ userId: user._id });
    const totalQuizzes = attempts.length;
    const highScore = attempts.reduce((max, a) => Math.max(max, a.percentage), 0);
    const avgScore = totalQuizzes > 0
      ? Math.round(attempts.reduce((sum, a) => sum + a.percentage, 0) / totalQuizzes)
      : 0;

    // Update UserProfile
    await UserProfile.findOneAndUpdate(
      { userId: user._id },
      {
        username: user.name,
        registration_no: user.registration_no,
        email: user.email,
        phone_no: user.phone_no,
        class: user.class,
        totalQuizzes,
        highScore,
        avgScore,
        updated_at: new Date()
      },
      { upsert: true }
    );

    res.json({ success: true, message: 'Score submitted successfully!' });
  } catch (err) {
    console.error('Submit score error:', err);
    res.status(500).json({ error: 'Failed to submit score.' });
  }
});

// User Profile Stats & History
app.get('/api/profile', async (req, res) => {
  try {
    if (!req.session || !req.session.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const user = await User.findOne({ registration_no: req.session.user.registration_no });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Find UserProfile or create it on the fly if missing (for old users)
    let profile = await UserProfile.findOne({ userId: user._id });
    if (!profile) {
      const attempts = await QuizAttempt.find({ userId: user._id });
      const totalQuizzes = attempts.length;
      const highScore = attempts.reduce((max, a) => Math.max(max, a.percentage), 0);
      const avgScore = totalQuizzes > 0
        ? Math.round(attempts.reduce((sum, a) => sum + a.percentage, 0) / totalQuizzes)
        : 0;

      profile = new UserProfile({
        userId: user._id,
        username: user.name,
        registration_no: user.registration_no,
        email: user.email,
        phone_no: user.phone_no,
        class: user.class,
        totalQuizzes,
        highScore,
        avgScore
      });
      await profile.save();
    }

    const attempts = await QuizAttempt.find({ userId: user._id }).sort({ completed_at: -1 });
    
    res.json({
      user: {
        name: profile.username || user.name,
        registration_no: profile.registration_no || user.registration_no,
        email: profile.email || user.email,
        phone_no: profile.phone_no || user.phone_no,
        class: profile.class || user.class
      },
      stats: {
        totalQuizzes: profile.totalQuizzes,
        highScore: profile.highScore,
        avgScore: profile.avgScore
      },
      attempts
    });
  } catch (err) {
    console.error('Profile fetch error:', err);
    res.status(500).json({ error: 'Failed to load profile data' });
  }
});

// Leaderboard stand-out ranking
app.get('/api/leaderboard', async (req, res) => {
  try {
    const activeProfiles = await UserProfile.find().sort({ highScore: -1, totalQuizzes: -1 }).limit(20);
    const leaderboard = activeProfiles.map(p => ({
      _id: p.userId,
      username: p.username,
      highScore: p.highScore,
      totalQuizzes: p.totalQuizzes
    }));
    res.json(leaderboard);
  } catch (err) {
    console.error('Leaderboard fetch error:', err);
    res.status(500).json({ error: 'Failed to load leaderboard' });
  }
});

// SPA fallback — MUST be after all API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

const listenWithFallback = (expressApp, preferredPort, label, onListening) => {
  const startPort = Number(preferredPort) || 0;
  const server = expressApp.listen(startPort);

  server.on('listening', () => {
    const { port } = server.address();
    console.log(`${label} running on http://localhost:${port}`);
    if (onListening) onListening(port);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE' && startPort > 0) {
      const nextPort = startPort + 1;
      console.log(`Port ${startPort} is busy, trying ${nextPort}...`);
      listenWithFallback(expressApp, nextPort, label, onListening);
      return;
    }

    throw err;
  });
};

const PORT = process.env.PORT || 5000;
listenWithFallback(app, PORT, 'API server', (port) => {
  console.log(`Open the website at http://localhost:${port}/index.html`);
});

// Start separate frontend static website server on port 3000
const frontendApp = express();
frontendApp.use(express.static(__dirname));
frontendApp.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});
listenWithFallback(frontendApp, process.env.FRONTEND_PORT || 3000, 'Static website');
