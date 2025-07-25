const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const User = require('./models/User');
const Score = require('./models/Score');
const nodemailer = require('nodemailer');
const app = express();
app.use(cors());
app.use(express.json());

// Configure your email transporter (example uses Gmail)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'roshangamit009@gmail.com',      // replace with your email
    pass: 'slckajdixeofpbfa'         // use an App Password, not your real password
  }
});

// ✅ REGISTER Route
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password, shift } = req.body;
    const userId = uuidv4();
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ msg: 'Email already registered' });
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ userId, username, email, password: hashedPassword, shift });
    await user.save();
    const initialScore = shift === 'fulltime' ? 200 : 100;
    const score = new Score({
      userId: user._id,
      username,
      score: initialScore,
      shift, // <-- add this line
      entries: [] // ⬅ Ready to store short/excess/holiday
    });
    await score.save();
    res.json({ msg: 'Registration successful!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// ✅ LOGIN Route

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: 'User not found' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: 'Invalid credentials' });

    res.json({
      token: 'dummy-token', // You can later replace this with JWT
      user: {
        username: user.username,
        email: user.email,
        userId: user.userId,
        shift: user.shift // <-- Add this line!
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Get Score by userId or username
app.get('/api/score/:user', async (req, res) => {
  try {
    const userParam = req.params.user;
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(userParam);
    const query = isObjectId ? { userId: userParam } : { username: userParam };

    let scoreDoc = await Score.findOne(query);
    if (!scoreDoc) return res.status(404).json({ msg: 'Score not found' });

    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    // Calculate last month's 25th date string
    let lastMonth = currentMonth - 1;
    let year = currentYear;
    if (lastMonth < 0) {
      lastMonth = 11;
      year -= 1;
    }
    const last25Date = new Date(year, lastMonth, 25);
    const last25Str = `${last25Date.getFullYear()}-${String(last25Date.getMonth() + 1).padStart(2, '0')}-${String(last25Date.getDate()).padStart(2, '0')}`;

    // Check if last month's 25th entry exists
    const hasLast25 = scoreDoc.entries.some(entry => entry.date === last25Str);

    // If last month's 25th entry is found, start new calendar and refresh score
    if (hasLast25) {
      let shift = scoreDoc.shift;
      if (!shift) {
        const user = await User.findOne({ username: scoreDoc.username });
        shift = user?.shift || 'parttime';
      }
      scoreDoc.score = shift === 'fulltime' ? 200 : 100; // <-- update score by shift
      scoreDoc.entries = []; // Remove last month's records
      scoreDoc.shift = shift;
      await scoreDoc.save();
    }

    res.json({
      score: scoreDoc.score,
      entries: scoreDoc.entries,
      shift: scoreDoc.shift,
      missingLast25: !hasLast25
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Add or update score entry by username
app.post('/api/score/entry', async (req, res) => {
  try {
    const { username, date, status, rupees } = req.body;
    const scoreDoc = await Score.findOne({ username });
    if (!scoreDoc) return res.status(404).json({ msg: 'Score not found' });

    // Check if date already exists
    const alreadyExists = scoreDoc.entries.some(entry => entry.date === date);
    if (alreadyExists) {
      return res.status(400).json({ msg: 'Date already used' });
    }

    const rupeeAmount = parseFloat(rupees);
    let scoreChange = 0;
    if (status === 'short' || status === 'excess') {
      scoreChange = -Math.abs(rupeeAmount);
    }

    scoreDoc.score += scoreChange;
    scoreDoc.entries.push({ date, status, rupees: rupeeAmount });

    // If entry is for the 25th, reset score and entries for next month
    const entryDate = new Date(date);
    if (entryDate.getDate() === 25) {
      let shift = scoreDoc.shift;
      if (!shift) {
        const user = await User.findOne({ username: scoreDoc.username });
        shift = user?.shift || 'parttime';
      }
      scoreDoc.score = shift === 'fulltime' ? 200 : 100;
      scoreDoc.entries = [];
      scoreDoc.shift = shift;
      await scoreDoc.save();
      return res.json({
        msg: 'Entry added and new month started',
        score: scoreDoc.score,
        entries: scoreDoc.entries,
        shift: scoreDoc.shift,
        newMonth: true
      });
    }

    await scoreDoc.save();

    res.json({
      msg: 'Entry added',
      score: scoreDoc.score,
      entries: scoreDoc.entries,
      shift: scoreDoc.shift,
      newMonth: false
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Leaderboard: Get all users sorted by score (descending)
app.get('/api/leaderboard', async (req, res) => {
  try {
    const leaders = await Score.find({}, { username: 1, score: 1, shift: 1, _id: 0 }) // <-- add shift: 1
      .sort({ score: -1 });
    res.json(leaders);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

const otpStore = {}; // Temporary in-memory storage

// Send OTP
app.post('/api/auth/send-otp', async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ success: false, msg: 'User not found' });

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  otpStore[email] = { otp, expires: Date.now() + 5 * 60 * 1000 };

  // Send OTP via email using Nodemailer
  try {
    await transporter.sendMail({
      from: '"Cashier Simulator" <yourgmail@gmail.com>', // sender address
      to: email,                                         // receiver
      subject: 'Your OTP Code',
      text: `Your OTP code is: ${otp}`,
      html: `<p>Your OTP code is: <b>${otp}</b></p>`
    });
    res.json({ success: true, msg: 'OTP sent' });
  } catch (err) {
    console.error('Email send error:', err);
    res.status(500).json({ success: false, msg: 'Failed to send OTP email' });
  }
});

// Verify OTP
app.post('/api/auth/verify-otp', (req, res) => {
  const { email, otp } = req.body;
  const record = otpStore[email];
  if (!record || record.otp !== otp || Date.now() > record.expires) {
    return res.status(400).json({ success: false, msg: 'Invalid or expired OTP' });
  }
  res.json({ success: true });
});

// Reset password
app.post('/api/auth/reset-password', async (req, res) => {
  const { email, newPassword } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ success: false, msg: 'User not found' });

  const hashed = await bcrypt.hash(newPassword, 10);
  user.password = hashed;
  await user.save();
  delete otpStore[email];

  res.json({ success: true, msg: 'Password reset successfully' });
});


// ✅ MongoDB Atlas Connection
mongoose
  .connect('mongodb+srv://roshangamit009:92827262@cluster0.vvp3jit.mongodb.net/CashierSimulator?retryWrites=true&w=majority&appName=Cluster0')
  .then(() => {
    app.listen(5000, () => console.log('🚀 Server running at https:5000'));
  })
  .catch(err => console.error('❌ MongoDB connection failed:', err));
