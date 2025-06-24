const express = require('express');
const router = express.Router();
const Question = require('../models/question');
const User = require('../models/user');
const Challenge = require('../models/challenge');
//This is an API endpoint that returns a JSON list of questions for a specific topic, used by concepts.js to populate the question list in concepts.ejs
//Triggered By: A fetch request from concepts.js when concepts.ejs loads (e.g., fetch('/api/dbms/questions') or fetch('/api/programming/questions')).
router.get('/:topic/questions', async (req, res) => {
  try {
    const userId = req.session.userId;
    if (!userId) {
      console.log('Unauthorized: No userId in session');
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const user = await User.findById(userId);
    if (!user) {
      console.log('User not found for ID:', userId);
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const topic = req.params.topic.toUpperCase();
    console.log(`API: Fetching questions for topic=${topic}, subTopic=Concepts`);
    const query = { topic, subTopic: 'Concepts' };
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
router.get('/concepts/:topic', async (req, res) => {
  try {
    const topic = req.params.topic.toUpperCase();
    console.log('Fetching concepts for topic:', topic);
    
    // For debugging, remove auth checks temporarily
    const query = { topic, subTopic: 'Concepts' };
    console.log('Query:', query);
    
    const questions = await Question.find(query);
    console.log('Questions found:', questions.length);
    
    res.json(questions);
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/challenges/:topic', async (req, res) => {
  try {
    const userId = req.session.userId;
    console.log('Rendering challenges page for topic:', req.params.topic.toUpperCase(), 'User ID:', userId);
    if (!userId) {
      console.log('Unauthorized: No userId in session');
      return res.redirect('/login');
    }
    const user = await User.findById(userId);
    if (!user) {
      console.log('User not found for ID:', userId);
      return res.redirect('/login');
    }
    const topic = req.params.topic.toUpperCase();
    res.render('challenges', {
      topic: topic === 'DBMS' ? 'DBMS Depths' :
             topic === 'NETWORKING' ? 'Networking Currents' :
             topic === 'WEBDEV' ? 'Web Reefs' : 'Code Waves',
      userId: user._id
    });
  } catch (err) {
    console.error('Challenges Route Error:', err.message);
    res.redirect('/login');
  }
});

router.get('/challenges/data/:topic', async (req, res) => {
  try {
    const userId = req.session.userId;
    console.log('Fetching challenges data for topic:', req.params.topic.toUpperCase(), 'User ID:', userId);
    if (!userId) {
      console.log('Unauthorized: No userId in session');
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const user = await User.findById(userId);
    if (!user) {
      console.log('User not found for ID:', userId);
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const query = { topic: req.params.topic.toUpperCase() };
    if (req.params.topic.toUpperCase() === 'PROGRAMMING') {
      query.programmingLanguage = user.programmingLanguage;
    }
    const challenges = await Challenge.find(query).sort({ section: 1 });
    console.log('Challenges found:', challenges.length);
    res.json(challenges);
  } catch (err) {
    console.error('Fetch Challenges Error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/complete', async (req, res) => {
  try {
    const { questionId, challengeId, topic } = req.body;
    const userId = req.session.userId;
    console.log('Marking complete:', { questionId, challengeId, topic, userId });
    if (!userId) {
      console.log('Unauthorized: No userId in session');
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const user = await User.findById(userId);
    if (!user) {
      console.log('User not found for ID:', userId);
      return res.status(401).json({ error: 'Unauthorized' });
    }
    let totalItems, completedItems;

    if (questionId) {
      await Question.updateOne(
        { _id: questionId },
        { $addToSet: { completedBy: userId } }
      );
      const query = { topic: topic.toUpperCase() || 'DBMS', subTopic: 'Concepts' };
      if (query.topic === 'PROGRAMMING') {
        query.programmingLanguage = user.programmingLanguage;
      }
      totalItems = await Question.countDocuments(query);
      completedItems = await Question.countDocuments({
        ...query,
        completedBy: userId,
      });
    } else if (challengeId) {
      await Challenge.updateOne(
        { _id: challengeId },
        { $addToSet: { completedBy: userId } }
      );
      const query = { topic: topic.toUpperCase() || 'DBMS' };
      if (query.topic === 'PROGRAMMING') {
        query.programmingLanguage = user.programmingLanguage;
      }
      totalItems = await Challenge.countDocuments(query);
      completedItems = await Challenge.countDocuments({
        ...query,
        completedBy: userId,
      });
    } else {
      return res.status(400).json({ error: 'Question or Challenge ID required' });
    }

    const progress = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;
    console.log('Progress calculated:', progress);
    res.json({ progress });
  } catch (err) {
    console.error('Complete Item Error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/save-note', async (req, res) => {
  try {
    const { questionId, content } = req.body;
    const userId = req.session.userId;
    console.log('Saving note for question:', questionId, 'User ID:', userId);
    if (!userId) {
      console.log('Unauthorized: No userId in session');
      return res.status(401).json({ error: 'Unauthorized' });
    }
    await Question.updateOne(
      { _id: questionId },
      { $push: { notes: { userId, content } } }
    );
    res.json({ message: 'Note saved' });
  } catch (err) {
    console.error('Save Note Error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/progress/:topic', async (req, res) => {
  try {
    const userId = req.session.userId;
    console.log('Fetching progress for topic:', req.params.topic.toUpperCase(), 'User ID:', userId);
    if (!userId) {
      console.log('Unauthorized: No userId in session');
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const user = await User.findById(userId);
    if (!user) {
      console.log('User not found for ID:', userId);
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const query = { topic: req.params.topic.toUpperCase() };
    if (req.params.topic.toUpperCase() === 'PROGRAMMING') {
      query.programmingLanguage = user.programmingLanguage;
    }
    const totalQuestions = await Question.countDocuments({ ...query, subTopic: 'Concepts' });
    const completedQuestions = await Question.countDocuments({
      ...query,
      subTopic: 'Concepts',
      completedBy: userId,
    });
    const totalChallenges = await Challenge.countDocuments(query);
    const completedChallenges = await Challenge.countDocuments({
      ...query,
      completedBy: userId,
    });
    const totalItems = totalQuestions + totalChallenges;
    const completedItems = completedQuestions + completedChallenges;
    const progress = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;
    console.log('Progress:', { totalQuestions, completedQuestions, totalChallenges, completedChallenges, progress });
    res.json({ progress });
  } catch (err) {
    console.error('Fetch Progress Error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/overall-progress', async (req, res) => {
  try {
    const userId = req.session.userId;
    console.log('Fetching overall progress for User ID:', userId);
    if (!userId) {
      console.log('Unauthorized: No userId in session');
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const user = await User.findById(userId);
    if (!user) {
      console.log('User not found for ID:', userId);
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const topics = ['DBMS', 'NETWORKING', 'WEBDEV', 'PROGRAMMING'];
    let totalItems = 0;
    let completedItems = 0;
    for (const topic of topics) {
      const query = { topic };
      if (topic === 'PROGRAMMING') {
        query.programmingLanguage = user.programmingLanguage;
      }
      const totalQuestions = await Question.countDocuments({ ...query, subTopic: 'Concepts' });
      const completedQuestions = await Question.countDocuments({
        ...query,
        subTopic: 'Concepts',
        completedBy: userId,
      });
      const totalChallenges = await Challenge.countDocuments(query);
      const completedChallenges = await Challenge.countDocuments({
        ...query,
        completedBy: userId,
      });
      totalItems += totalQuestions + totalChallenges;
      completedItems += completedQuestions + completedChallenges;
    }
    const progress = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;
    console.log('Overall Progress:', progress);
    res.json({ progress });
  } catch (err) {
    console.error('Fetch Overall Progress Error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;