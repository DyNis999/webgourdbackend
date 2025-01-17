const express = require("express");
const chatController = require("../controllers/chatController");
const authJwt = require('../middleware/auth');

const router = express.Router();

router.get("/chats", authJwt.isAuthenticatedUser, chatController.getChats);
router.get("/messages/:senderId/:receiverId", authJwt.isAuthenticatedUser, chatController.getMessages);
router.post("/messages", authJwt.isAuthenticatedUser, chatController.createMessage);
router.put("/messages/read", authJwt.isAuthenticatedUser, chatController.markMessagesAsRead);
router.delete("/:id", authJwt.isAuthenticatedUser, chatController.deleteMessage);

module.exports = router;
