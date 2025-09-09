const mongoose = require('mongoose');

const challengeSchema = new mongoose.Schema({
  topic: String,
  section: String,
  title: String,
  description: String,
  sampleQuery: String,
  correctQuery: String,
  expectedOutput: String,
  hint: String, // Added for hints
  timeLimit: Number, // Time limit in seconds (e.g., 300 for 5 minutes)
  programmingLanguage: String,
  completedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
});

module.exports = mongoose.model('Challenge', challengeSchema);