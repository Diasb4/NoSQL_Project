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
  unlikePost,
  stats,
  deletePostsWithoutLikes
} = require('../controllers/postController');
const {
  addComment,
  getCommentsForPost,
  updateComment,
  deleteComment,
  deleteCommentsByUser
} = require('../controllers/commentController');

router.post('/', auth, createPost);
router.get('/', getPosts);
router.get('/stats', stats); // aggregation endpoint
router.delete('/without-likes', auth, deletePostsWithoutLikes); // admin-only mass-delete posts with no likes

router.get('/user/:id', getPostsByUser);

router.post('/:postId/comments', auth, addComment);
router.get('/:postId/comments', getCommentsForPost);
router.put('/comments/:id', auth, updateComment);
router.delete('/comments/:id', auth, deleteComment);
router.delete('/comments/by-user/:id', auth, deleteCommentsByUser);

router.get('/:id', getPostById);
router.put('/:id', auth, updatePost);
router.delete('/:id', auth, deletePost);
router.post('/:id/like', auth, likePost);
router.post('/:id/unlike', auth, unlikePost);


module.exports = router;