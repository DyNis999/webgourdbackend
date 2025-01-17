const mongoose = require("mongoose");
const { Chat } = require("../models/chat");
const { User } = require("../models/user");

// Fetch all chat messages (general)
exports.getChats = async (req, res) => {
    try {
        const chats = await Chat.aggregate([
            { $match: { room: "general" } },
            {
                $group: {
                    _id: { sender: "$sender", user: "$user" },
                    lastMessage: { $last: "$message" },
                    lastMessageIsRead: { $last: "$isRead" },
                    lastMessageTimestamp: { $last: "$createdAt" },
                },
            },
            {
                $lookup: {
                    from: "users",
                    localField: "_id.sender",
                    foreignField: "_id",
                    as: "sender",
                },
            },
            {
                $lookup: {
                    from: "users",
                    localField: "_id.user",
                    foreignField: "_id",
                    as: "user",
                },
            },
            { $unwind: "$sender" },
            { $unwind: "$user" },
            {
                $project: {
                    _id: 1,
                    lastMessage: 1,
                    lastMessageIsRead: 1,
                    lastMessageTimestamp: 1,
                    sender: {
                        _id: 1,
                        name: 1,
                        email: 1,
                        image: 1,
                    },
                    user: {
                        _id: 1,
                        name: 1,
                        email: 1,
                        image: 1,
                    },
                },
            },
        ]);

        if (!chats.length) {
            return res.status(404).json({ success: false, message: "No chats found" });
        }

        res.status(200).json({ success: true, chats });
    } catch (error) {
        res.status(500).json({ success: false, message: "Internal server error", error: error.message });
    }
};

// Fetch messages between sender and receiver
exports.getMessages = async (req, res) => {
    const { senderId, receiverId } = req.params;
    console.log({ senderId, receiverId });

    try {
        const messages = await Chat.find({
            $or: [
                { user: senderId, sender: receiverId },
                { user: receiverId, sender: senderId },
            ],
        })
            .populate("user", "name email image")
            .populate("sender", "name email image")
            .sort({ createdAt: 1 });

        if (!messages.length) {
            return res.status(404).json({ message: "No messages found between these users" });
        }

        res.status(200).json({ messages });
    } catch (error) {
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
};

// Create a new chat message
exports.createMessage = async (req, res) => {
    try {
        const { user, sender, message, room } = req.body;

        if (!user || !sender || !message) {
            return res.status(400).json({ success: false, message: "Recipient, sender, and message are required" });
        }

        const newChat = new Chat({ user, sender, message, room: room || "general" });
        const savedChat = await newChat.save();
        await savedChat.populate("sender", "name email image");

        res.status(201).json({ success: true, message: "Chat created successfully", chat: savedChat });
    } catch (error) {
        res.status(500).json({ message: "Error creating message", error: error.message });
    }
};

// Mark messages as read
exports.markMessagesAsRead = async (req, res) => {
    try {
        const { messages } = req.body;
        console.log('Marking messages as read:', messages);
        if (!Array.isArray(messages)) {
            return res.status(400).json({ message: "Invalid message IDs" });
        }

        const result = await Chat.updateMany(
            { _id: { $in: messages } },
            { $set: { isRead: true } }
        );

        res.status(200).send({ message: "Messages marked as read", result });
    } catch (error) {
        res.status(500).send({ message: "Failed to mark messages as read", error: error.message });
    }
};

// Delete a chat message
exports.deleteMessage = async (req, res) => {
    try {
        const chatId = req.params.id;

        if (!mongoose.Types.ObjectId.isValid(chatId)) {
            return res.status(400).json({ success: false, message: "Invalid chat ID format" });
        }

        const deletedChat = await Chat.findByIdAndDelete(chatId);

        if (!deletedChat) {
            return res.status(404).json({ success: false, message: "Chat not found" });
        }

        res.status(200).json({ success: true, message: "Chat deleted successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Internal server error", error: error.message });
    }
};
