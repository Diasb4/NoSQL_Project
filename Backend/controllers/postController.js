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
    if (!post.author.equals(req.user._id)) return res.status(403).json({ message: 'Not authorized' });
    post.content = req.body.content ?? post.content;
    post.image = req.body.image ?? post.image;
    post.updatedAt = Date.now();
    await post.save();
    res.json(post);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    if (!post.author.equals(req.user._id)) return res.status(403).json({ message: 'Not authorized' });
    await post.remove();
    res.json({ message: 'Post deleted' });
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