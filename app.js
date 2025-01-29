const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cookieParser = require('cookie-parser');
const cors = require('cors');

const user = require('./routes/user');
const category = require('./routes/category');
const post = require('./routes/Post');
const chat = require('./routes/chat');
const gourdType = require('./routes/gourdtype');
const gourdvariety = require('./routes/gourdvariety');
const monitoring = require('./routes/Monitoring');
const dashboard = require('./routes/dashboard');

const app = express();
// const server = http.createServer(app);

app.use(cors({
  origin: "http://localhost:3000",
  credentials: true,
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(cookieParser());

app.use('/api/v1/users', user);
app.use('/api/v1/categories', category);
app.use('/api/v1/posts', post);
app.use('/api/v1/chat', chat);
app.use ('/api/v1/gourdType', gourdType);
app.use ('/api/v1/gourdVariety', gourdvariety);
app.use ('/api/v1/Monitoring', monitoring);
app.use ('/api/v1/Dashboard', dashboard);

const server = app.listen(4000, () => {
  console.log("Server is running on http://localhost:4000");
});

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  },
  pingTimeout: 60000,
  pingInterval: 25000,
  transports: ['websocket', 'polling']
});

const onlineUsers = new Map();
io.on("connection", (socket) => {
  // console.log(`User connected: ${socket.id}`);

  let userId;

  socket.on("joinRoom", (data) => {
    // console.log("dito :", data);
    const { userId } = data;
    onlineUsers.set(userId, socket);
  });

  socket.on("setUser", async (id) => {
    userId = id;
    if (userId) {
      onlineUsers.set(userId, socket.id);
      // console.log(`User ${userId} is now online`);
      // console.log("Online Users:", Array.from(onlineUsers.entries()));

      io.emit("onlineUsers", Array.from(onlineUsers.keys()));
    }
  });

  socket.on("sendMessage", (data) => {
    const { recipientId, message, senderId } = data;
    console.log("Received message:", data);
    const recipientSocketId = onlineUsers.get(recipientId);
    console.log("Recipient Socket ID:", recipientSocketId);

    if (recipientSocketId) {
      recipientSocketId.emit("receiveMessage", {
        senderId,
        message,
        timestamp: new Date()
      });
    } else {
      // console.log(`User ${recipientId} is offline. Message not delivered.`);
    }
  });

  socket.on("deleteMessage", (data) => {
    const { messageId, userId } = data;
    console.log("Delete message request:", data);
    io.emit("messageDeleted", { messageId, userId });
  });

  socket.on("disconnect", (reason) => {
    // console.log("Disconnect reason:", reason);
    for (const [userId, socketId] of onlineUsers.entries()) {
      if (socketId === socket.id) {
        onlineUsers.delete(userId);
        // console.log(`User ${userId} disconnected`);
        io.emit("onlineUsers", Array.from(onlineUsers.keys()));
        // console.log("Nagdisconnected na siya");
        break;
      }
    }
    
    console.log("Current online users:", Array.from(onlineUsers.entries()));
  });
});



module.exports = { app, server };
