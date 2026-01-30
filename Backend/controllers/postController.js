const Post = require('../models/Post');
const User = require('../models/User');

exports.createPost = async (req, res) => {
  try {
    const { content, image } = req.body;
    if (!content) return res.status(400).json({ message: 'Content required' });
    const post = await Post.create({ author: req.user._id, content, image });
    res.status(201).json(post);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getPosts = async (req, res) => {
  try {
    const posts = await Post.find().populate('author', 'username').sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getPostById = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate('author', 'username');
    if (!post) return res.status(404).json({ message: 'Post not found' });
    res.json(post);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getPostsByUser = async (req, res) => {
  try {
    const posts = await Post.find({ author: req.params.id }).populate('author', 'username').sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updatePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    // allow author or admin to update
    if (!post.author.equals(req.user._id) && req.user.role !== 'admin') return res.status(403).json({ message: 'Not authorized' });
    // Allow updating multiple fields via $set (whitelist)
    const allowed = ['content','image'];
    const toSet = {};
    allowed.forEach(k => { if (k in req.body) toSet[k] = req.body[k]; });
    if (Object.keys(toSet).length === 0) return res.status(400).json({ message: 'No valid fields to update' });
    toSet.updatedAt = Date.now();
    const updated = await Post.findByIdAndUpdate(req.params.id, { $set: toSet }, { new: true }).populate('author', 'username');
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    // author or admin can delete
    if (!post.author.equals(req.user._id) && req.user.role !== 'admin')
      return res.status(403).json({ message: 'Not authorized' });

    // вместо post.remove()
    await post.deleteOne();

    res.json({ message: 'Post deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// Aggregation endpoint: stats per user (posts count, avg likes, avg comments)
exports.stats = async (req, res) => {
  try {
    const result = await Post.aggregate([
      { $project: { author: 1, likesCount: { $size: { $ifNull: ['$likes', []] } }, commentsCount: { $ifNull: ['$commentsCount', 0] } } },
      { $group: { _id: '$author', posts: { $sum: 1 }, avgLikes: { $avg: '$likesCount' }, avgComments: { $avg: '$commentsCount' } } },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
      { $project: { _id: 0, authorId: '$_id', username: '$user.username', posts: 1, avgLikes: { $round: ['$avgLikes', 2] }, avgComments: { $round: ['$avgComments', 2] } } }
    ]);
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Mass deletion: delete posts without likes (admin-only)
exports.deletePostsWithoutLikes = async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Admin only' });
    const r = await Post.deleteMany({ likes: { $size: 0 } });
    res.json({ deletedCount: r.deletedCount || r.n || 0 });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.likePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    if (post.likes.includes(req.user._id)) return res.status(400).json({ message: 'Already liked' });
    post.likes.push(req.user._id);
    await post.save();
    res.json({ message: 'Liked' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.unlikePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    post.likes = post.likes.filter(id => !id.equals(req.user._id));
    await post.save();
    res.json({ message: 'Unliked' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};