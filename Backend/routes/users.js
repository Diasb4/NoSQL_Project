const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  getUsers,
  searchUsers,
  getUserById,
  updateUser,
  deleteUser,
  followUser,
  unfollowUser,
  topFollowed
} = require('../controllers/userController');

router.get('/search', searchUsers);
router.get('/top-followed', topFollowed);
router.get('/', getUsers);
router.get('/:id', getUserById);
router.put('/:id', auth, updateUser);
router.delete('/:id', auth, deleteUser);
router.post('/:id/follow', auth, followUser);
router.post('/:id/unfollow', auth, unfollowUser);

module.exports = router;