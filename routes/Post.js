const express = require('express');
const postController = require('../controllers/PostController');
const authJwt = require('../middleware/auth');
const upload = require('../utils/multer');

const router = express.Router();

// Get top contributors
router.get('/top-contributors', postController.getTopContributors);

// Create a new post
router.post('/', [authJwt.isAuthenticatedUser, upload.array('images')], postController.createPost);
// Get all posts
router.get('/', postController.getPosts);
// Create a Archive post
router.post('/archive', [authJwt.isAuthenticatedUser, upload.array('images')], postController.archivePost);
// Get all Archive
router.get('/archive', postController.getArchives);

// Get a single post by ID
router.get('/:id', postController.getPostById);

// Update a post by ID
router.put('/:id', [authJwt.isAuthenticatedUser, upload.array('images')], postController.updatePost);

// Delete a post by ID
router.delete('/:id', authJwt.isAuthenticatedUser, postController.deletePost);
// Delete a Archive by ID
router.delete('/archive/:id', authJwt.isAuthenticatedUser, postController.deleteArchive);



// Add a new comment to a post
router.post('/:postId/comments', authJwt.isAuthenticatedUser, postController.addComment);

// Add a reply to a comment within a post
router.post('/:postId/comments/:commentId/replies', authJwt.isAuthenticatedUser, postController.addReply);

// Update a comment by ID
router.put('/:postId/comments/:commentId', authJwt.isAuthenticatedUser, postController.updateComment);

// Delete a comment by ID
router.delete('/:postId/comments/:commentId', authJwt.isAuthenticatedUser, postController.deleteComment);

// Get posts by a specific user
router.get('/user/:userId', postController.getUserPosts);

// Like or unlike a post
router.post('/:postId/like', authJwt.isAuthenticatedUser, postController.likePost);

// Edit a reply within a comment
router.put('/:postId/comments/:commentId/replies/:replyId', authJwt.isAuthenticatedUser, postController.editReply);

// Delete a reply within a comment
router.delete('/:postId/comments/:commentId/replies/:replyId', authJwt.isAuthenticatedUser, postController.deleteReply);


router.put('/status/:id', authJwt.isAuthenticatedUser, postController.updatePostStatus);

module.exports = router;