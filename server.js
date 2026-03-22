const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cookieParser());
app.use(session({
  secret: 'knowzilla-secret-key-change-in-prod',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 } // 24h
}));
app.use(cors({ credentials: true, origin: ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:8000'] }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(__dirname)); // Serve static HTML/CSS/JS from current dir
const path = require('path');

app.use(express.static(__dirname));

// API routes above this line

// SPA fallback (ONLY for unknown routes)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ MongoDB Atlas Connected"))
  .catch(err => console.log("❌ MongoDB Error:", err.message));

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

const User = mongoose.model('User', userSchema);
const Contact = mongoose.model('Contact', contactSchema);
const Review = mongoose.model('Review', reviewSchema);
const Subscription = mongoose.model('Subscription', subscriptionSchema);

// API Routes
app.post('/api/register', async (req, res) => {
  try {
    const { name, registration_no, email, phone_no, class: cls, password } = req.body;
    const hashed = await bcrypt.hash(password, 10);
    const user = new User({ name, registration_no, email, phone_no, class: cls, password: hashed });
    await user.save();
    req.session.user = { registration_no, name }; // Set session
    res.redirect('/index.html?success=registered');
  } catch (err) {
    if (err.code === 11000) {
      res.redirect('/login.html?error=duplicate');
    } else {
      res.redirect('/login.html?error=unknown');
    }
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { registration_no, password } = req.body;
    const user = await User.findOne({ registration_no });
    if (user && await bcrypt.compare(password, user.password)) {
      req.session.user = { registration_no, name: user.name }; // Set session
      res.redirect('/index.html');
    } else {
      res.redirect('/login.html?error=invalid');
    }
  } catch (err) {
    res.redirect('/login.html?error=unknown');
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
  const { name, phone, email, message } = req.body;
  await new Review({ name, phone, email, message }).save();
  res.redirect('/index.html?success=1');
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
  req.session.destroy();
  res.redirect('/login.html');
});

app.get('/api/reviews', async (req, res) => {
  const reviews = await Review.find().sort({ submitted_at: -1 });
  res.json(reviews);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

