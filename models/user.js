const mongoose = require('mongoose');
const bcrypt = require('bcryptjs'); 
//You're actually creating a document using that schema and saving it to the users collection in the preptrack database.
const userSchema = new mongoose.Schema({
    name: String,
    email: { type: String, required: true, unique: true },
    department: String,
    year: Number,
    programmingLanguage: String,
    password: { type: String, required: true }
});

// Mongoose Middleware to hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next(); // only hash if password is modified
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

// Optional: Method to compare passwords.
// adds custom method to all instances of the User
userSchema.methods.comparePassword = function (enteredPassword) {
    return bcrypt.compare(enteredPassword, this.password); //hash the entered passw with already hashed pass in database
};

module.exports = mongoose.model('User', userSchema);
// This code defines a Mongoose schema for a User model, including password hashing and comparison methods.