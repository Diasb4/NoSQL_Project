const Comment = require('../models/Comment');
const Post = require('../models/Post');

exports.addComment = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ message: 'Text required' });
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    const comment = await Comment.create({ post: post._id, author: req.user._id, text });
    post.commentsCount = (post.commentsCount || 0) + 1;
    await post.save();
    res.status(201).json(comment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getCommentsForPost = async (req, res) => {
  try {
    const comments = await Comment.find({ post: req.params.postId }).populate('author', 'username').sort({ createdAt: -1 });
    res.json(comments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });
    if (!comment.author.equals(req.user._id)) return res.status(403).json({ message: 'Not authorized' });
    comment.text = req.body.text ?? comment.text;
    await comment.save();
    res.json(comment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });
    if (!comment.author.equals(req.user._id)) return res.status(403).json({ message: 'Not authorized' });
    const post = await Post.findById(comment.post);
    if (post) {
      post.commentsCount = Math.max(0, (post.commentsCount || 1) - 1);
      await post.save();
    }
    await comment.remove();
    res.json({ message: 'Comment deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};