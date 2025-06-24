const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
    topic: String,
    subTopic: String,
    question: String,
    answer: String,
    programmingLanguage: String, // Only used for PROGRAMMING topic
    completedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    notes: [{
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        content: String,
        createdAt: { type: Date, default: Date.now }
    }]
});

module.exports = mongoose.model('Question', questionSchema);