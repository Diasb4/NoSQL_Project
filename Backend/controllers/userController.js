const User = require('../models/User');

exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Public search endpoint (works without auth) - query param: q
exports.searchUsers = async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    if (!q) return res.json([]);
    // case-insensitive partial match on username or email
    const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    const users = await User.find({ $or: [{ username: regex }, { email: regex }] }).select('-password').limit(50);
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password').populate('followers following', 'username');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const updates = req.body;
    // prevent password change here (or handle separately)
    delete updates.password;
    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true }).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.followUser = async (req, res) => {
  try {
    const targetId = req.params.id;
    const me = req.user;
    if (me._id.equals(targetId)) return res.status(400).json({ message: "Can't follow yourself" });
    const target = await User.findById(targetId);
    if (!target) return res.status(404).json({ message: 'User not found' });
    if (target.followers.includes(me._id)) return res.status(400).json({ message: 'Already following' });
    target.followers.push(me._id);
    me.following.push(target._id);
    await target.save();
    await me.save();
    res.json({ message: 'Followed' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.unfollowUser = async (req, res) => {
  try {
    const targetId = req.params.id;
    const me = req.user;
    const target = await User.findById(targetId);
    if (!target) return res.status(404).json({ message: 'User not found' });
    target.followers = target.followers.filter(id => !id.equals(me._id));
    me.following = me.following.filter(id => !id.equals(target._id));
    await target.save();
    await me.save();
    res.json({ message: 'Unfollowed' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Top followed users (simple aggregation)
exports.topFollowed = async (req, res) => {
  try {
    const top = await User.aggregate([
      { $project: { username: 1, email: 1, followersCount: { $size: { $ifNull: ['$followers', []] } } } },
      { $sort: { followersCount: -1 } },
      { $limit: 20 }
    ]);
    res.json(top);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};