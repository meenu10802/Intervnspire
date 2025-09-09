const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const questionRoutes = require('./routes/questionRoutes');
const cors = require('cors');
const dotenv = require('dotenv');
const express = require('express');
const session = require('express-session');
const { initializeDB, resetDB } = require('./config/sqlite');
const sqlite3 = require('sqlite3').verbose();
const app = express();
const path = require('path');
dotenv.config();
connectDB();

const db = initializeDB();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'your_session_secret',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 }
  })
);

app.get('/', (req, res) => {
  console.log('GET /');
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/register', (req, res) => {
  console.log('GET /register');
  res.render('register', { error: null, success: null });
});

app.get('/login', (req, res) => {
  console.log('GET /login');
  res.render('login', { error: null, success: null });
});

app.get('/home', async (req, res) => {
  if (!req.session.userId) {
    console.log('GET /home: No userId in session');
    return res.redirect('/login');
  }
  try {
    const User = require('./models/user');
    const user = await User.findById(req.session.userId);
    if (!user) {
      console.log('GET /home: User not found for ID:', req.session.userId);
      return res.redirect('/login');
    }
    console.log('GET /home: Rendering for user:', user._id);
    res.render('home', {
      programmingLanguage: user.programmingLanguage.charAt(0).toUpperCase() + user.programmingLanguage.slice(1),
      userId: user._id,
      score: user.score // Pass score to home page
    });
  } catch (err) {
    console.error('Home Route Error:', err.message);
    res.redirect('/login');
  }
});

app.get('/about', (req, res) => {
  res.render('about');
});

app.get('/about/me', (req, res) => {
  res.render('about-me');
});

app.get('/concepts/:topic', async (req, res) => {
  if (!req.session.userId) {
    console.log('GET /concepts/:topic: No userId in session');
    return res.redirect('/login');
  }
  try {
    const User = require('./models/user');
    const user = await User.findById(req.session.userId);
    if (!user) {
      console.log('GET /concepts/:topic: User not found for ID:', req.session.userId);
      return res.redirect('/login');
    }
    const rawTopic = req.params.topic.toUpperCase();
    let displayTopic;
    if (rawTopic === 'PROGRAMMING') {
      displayTopic = user.programmingLanguage.charAt(0).toUpperCase() + user.programmingLanguage.slice(1) + ' Secrets';
    } else {
      displayTopic = rawTopic === 'DBMS' ? 'DBMS Depths' :
                     rawTopic === 'NETWORKING' ? 'Networking Currents' :
                     rawTopic === 'WEB' ? 'Web Reefs' : 'Code Waves';
    }
    console.log('GET /concepts/:topic: Rendering for topic:', rawTopic, 'Display Topic:', displayTopic);
    res.render('concepts', {
      topic: displayTopic,
      userId: user._id,
      rawTopic: rawTopic,
      programmingLanguage: user.programmingLanguage
    });
  } catch (err) {
    console.error('Concepts Route Error:', err.message);
    res.redirect('/login');
  }
});

app.get('/api/:topic/questions', async (req, res) => {
  try {
    const topic = req.params.topic.toUpperCase();
    const userId = req.session.userId;
    if (!userId) {
      console.log('GET /api/:topic/questions: No userId in session');
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const User = require('./models/user');
    const user = await User.findById(userId);
    if (!user) {
      console.log('GET /api/:topic/questions: User not found for ID:', userId);
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const Question = require('./models/question');
    let query = { topic, subTopic: 'Concepts' };
    if (topic === 'PROGRAMMING') {
      query.programmingLanguage = user.programmingLanguage;
    }
    const questions = await Question.find(query);
    console.log(`API: Found ${questions.length} questions`);
    res.json(questions);
  } catch (err) {
    console.error('API Error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/questions/complete', async (req, res) => {
  try {
    const { questionId, topic, completed } = req.body;
    const userId = req.session.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const Question = require('./models/question');
    if (completed) {
      await Question.updateOne(
        { _id: questionId },
        { $addToSet: { completedBy: userId } }
      );
      console.log(`API: Marked question ${questionId} as complete for user ${userId}`);
    } else {
      await Question.updateOne(
        { _id: questionId },
        { $pull: { completedBy: userId } }
      );
      console.log(`API: Unmarked question ${questionId} for user ${userId}`);
    }
    const total = await Question.countDocuments({ topic: topic.toUpperCase(), subTopic: 'Concepts' });
    const completedCount = await Question.countDocuments({ topic: topic.toUpperCase(), subTopic: 'Concepts', completedBy: userId });
    const progress = total ? (completedCount / total) * 100 : 0;
    console.log(`API: Updated progress for topic=${topic}. Total: ${total}, Completed: ${completedCount}, Progress: ${progress}%`);
    res.status(200).json({ progress });
  } catch (err) {
    console.error('Complete Question Error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/questions/save-note', async (req, res) => {
  try {
    const { questionId, content } = req.body;
    const userId = req.session.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const Question = require('./models/question');
    await Question.updateOne(
      { _id: questionId },
      { $push: { notes: { userId, content, createdAt: new Date() } } }
    );
    res.status(200).json({ message: 'Note saved' });
  } catch (err) {
    console.error('Save Note Error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/questions/progress/:topic', async (req, res) => {
  try {
    const topic = req.params.topic.toUpperCase();
    const userId = req.session.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const Question = require('./models/question');
    const total = await Question/SessioncountDocuments({ topic, subTopic: 'Concepts' });
    const completed = await Question.countDocuments({ topic, subTopic: 'Concepts', completedBy: userId });
    const progress = total ? (completed / total) * 100 : 0;
    console.log(`API: Progress for topic=${topic}. Total: ${total}, Completed: ${completed}, Progress: ${progress}%`);
    res.json({ progress });
  } catch (err) {
    console.error('Progress Error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/logout', (req, res) => {
  console.log('GET /logout: Destroying session');
  req.session.destroy(() => {
    res.redirect('/login');
  });
});

app.get('/challenges/:topic', async (req, res) => {
  if (!req.session.userId) {
    console.log('GET /challenges/:topic: No userId in session');
    return res.redirect('/login');
  }
  try {
    const User = require('./models/user');
    const user = await User.findById(req.session.userId);
    if (!user) {
      console.log('GET /challenges/:topic: User not found for ID:', req.session.userId);
      return res.redirect('/login');
    }
    const rawTopic = req.params.topic.toUpperCase();
    res.render('challenges', {
      topic: rawTopic === 'DBMS' ? 'DBMS Depths' : rawTopic,
      userId: user._id,
      rawTopic,
      score: user.score // Correctly passing score
    });
  } catch (err) {
    console.error('Challenges Route Error:', err.message);
    res.redirect('/login');
  }
});

app.get('/api/questions/challenges/dbms/:section', async (req, res) => {
  try {
    const section = req.params.section;
    const userId = req.session.userId;
    if (!userId) {
      console.log('GET /api/questions/challenges/dbms/:section: No userId in session');
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const Challenge = require('./models/challenge');
    const challenges = await Challenge.find({ topic: 'DBMS', section: section }).limit(10);
    console.log(`API: Found ${challenges.length} challenges for DBMS section=${section}`);
    res.json(challenges);
  } catch (err) {
    console.error('DBMS Challenges Error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/questions/challenges/dbms/validate', async (req, res) => {
  try {
    const { challengeId, userQuery } = req.body;
    const userId = req.session.userId;
    if (!userId) {
      console.log('POST /api/questions/challenges/dbms/validate: No userId in session');
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const Challenge = require('./models/challenge');
    const User = require('./models/user');
    const challenge = await Challenge.findById(challengeId);
    if (!challenge) {
      console.log('Challenge not found for ID:', challengeId);
      return res.status(404).json({ error: 'Challenge not found' });
    }

    // Reset SQLite database
    await new Promise((resolve) => resetDB(db, resolve));

    // Execute user query
    const userResult = await new Promise((resolve, reject) => {
      db.all(userQuery, [], (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      });
    });

    // Execute correct query
    const correctResult = await new Promise((resolve, reject) => {
      db.all(challenge.correctQuery, [], (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      });
    });

    // Compare results (deep comparison of rows)
    const isCorrect = JSON.stringify(userResult) === JSON.stringify(correctResult);

    if (isCorrect && !challenge.completedBy.includes(userId)) {
      await Challenge.updateOne(
        { _id: challengeId },
        { $addToSet: { completedBy: userId } }
      );
      await User.updateOne(
        { _id: userId },
        { $inc: { score: 10 } } // Award 10 points per correct query
      );
      console.log(`API: Query correct for challenge ${challengeId}, user ${userId}, score updated`);
    }

    res.json({ isCorrect });
  } catch (err) {
    console.error('Query Validation Error:', err.message);
    res.status(500).json({ error: 'Query execution failed: ' + err.message });
  }
});

app.use('/api/questions', questionRoutes);
app.use('/api/auth', authRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));