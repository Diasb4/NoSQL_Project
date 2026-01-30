const Comment = require('../models/Comment');
const Post = require('../models/Post');

exports.addComment = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ message: 'Text required' });
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    const comment = await Comment.create({
    post: post._id,
    author: req.user._id,
    text
    });

    await comment.populate('author', 'username');

    post.commentsCount = (post.commentsCount || 0) + 1;
    await post.save();
    await post.save();
    res.status(201).json(comment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Mass delete comments by user (admin or the user themself)
exports.deleteCommentsByUser = async (req, res) => {
  try {
    const targetId = req.params.id;
    if (!req.user._id.equals(targetId) && req.user.role !== 'admin') return res.status(403).json({ message: 'Not authorized' });
    // aggregate counts per post for that user's comments so we can decrement commentsCount
    const agg = await Comment.aggregate([
      { $match: { author: require('mongoose').Types.ObjectId(targetId) } },
      { $group: { _id: '$post', cnt: { $sum: 1 } } }
    ]);
    // decrement counts on posts
    await Promise.all(agg.map(async item => {
      await Post.findByIdAndUpdate(item._id, { $inc: { commentsCount: -item.cnt } });
    }));
    const r = await Comment.deleteMany({ author: targetId });
    res.json({ deletedCount: r.deletedCount || r.n || 0 });
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
    if (!comment.author.equals(req.user._id) && req.user.role !== 'admin') return res.status(403).json({ message: 'Not authorized' });
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
    if (!comment.author.equals(req.user._id) && req.user.role !== 'admin') return res.status(403).json({ message: 'Not authorized' });

    const post = await Post.findById(comment.post);
    if (post) {
      post.commentsCount = Math.max(0, (post.commentsCount || 1) - 1);
      await post.save();
    }


    await Comment.findByIdAndDelete(comment._id);

    res.json({ message: 'Comment deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
