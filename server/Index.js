const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const User = require('./models/User');
const Score = require('./models/Score');
const app = express();
app.use(cors());
app.use(express.json());

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
        userId: user.userId
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

    // Check if it's a valid ObjectId (userId), else treat as username
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(userParam);
    const query = isObjectId ? { userId: userParam } : { username: userParam };

    const scoreDoc = await Score.findOne(query);
    if (!scoreDoc) return res.status(404).json({ msg: 'Score not found' });

    res.json({ score: scoreDoc.score, entries: scoreDoc.entries });
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
    await scoreDoc.save();

    res.json({
      msg: 'Entry added',
      score: scoreDoc.score,
      entries: scoreDoc.entries
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});


// ✅ MongoDB Atlas Connection
mongoose
  .connect('mongodb+srv://roshangamit009:92827262@cluster0.vvp3jit.mongodb.net/CashierSimulator?retryWrites=true&w=majority&appName=Cluster0')
  .then(() => {
    app.listen(5000, () => console.log('🚀 Server running at https://cashier-simulator.onrender.com'));
  })
  .catch(err => console.error('❌ MongoDB connection failed:', err));
