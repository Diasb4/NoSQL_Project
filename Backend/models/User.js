const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  bio: { type: String, default: '' },
  role: { type: String, enum: ['user','admin'], default: 'user' },
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdAt: { type: Date, default: Date.now }
});

// Indexes for faster username/email search (unique already creates indexes but explicit is clearer)
UserSchema.index({ username: 1 });
UserSchema.index({ email: 1 });

module.exports = mongoose.model('User', UserSchema);