const mongoose = require('mongoose');

const challengeSchema = new mongoose.Schema({
    topic: String,
    section: Number,
    title: String,
    description: String,
    sampleQuery: String,
    expectedOutput: String,
    programmingLanguage: String, // Only used for PROGRAMMING topic
    completedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
});

module.exports = mongoose.model('Challenge', challengeSchema);