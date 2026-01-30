const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  createPost,
  getPosts,
  getPostById,
  getPostsByUser,
  updatePost,
  deletePost,
  likePost,
  unlikePost
} = require('../controllers/postController');
const {
  addComment,
  getCommentsForPost,
  updateComment,
  deleteComment
} = require('../controllers/commentController');

// posts
router.post('/', auth, createPost);
router.get('/', getPosts);

// ⚠️ сначала user
router.get('/user/:id', getPostsByUser);

// ⚠️ потом id
router.get('/:id', getPostById);

router.put('/:id', auth, updatePost);
router.delete('/:id', auth, deletePost);
router.post('/:id/like', auth, likePost);
router.post('/:id/unlike', auth, unlikePost);

// comments
router.post('/:postId/comments', auth, addComment);
router.get('/:postId/comments', getCommentsForPost);
router.put('/comments/:id', auth, updateComment);
router.delete('/comments/:id', auth, deleteComment);

module.exports = router;