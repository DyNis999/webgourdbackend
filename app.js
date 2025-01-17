const express = require('express');
const http = require('http'); // Import http module
const { Server } = require('socket.io'); // Import Socket.IO
const cookieParser = require('cookie-parser');
const cors = require('cors');

// Route imports
const user = require('./routes/user');
const category = require('./routes/category');
const post = require('./routes/Post');
const chat = require('./routes/chat');

// Initialize Express
const app = express();
const server = http.createServer(app); // Create HTTP server
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000", // Update with your frontend URL in production
    credentials: true,
  },
});

// Middleware setup
app.use(cors({
  origin: "http://localhost:3000",
  credentials: true,
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(cookieParser());

// Routes
app.use('/api/v1/users', user);
app.use('/api/v1/categories', category);
app.use('/api/v1/posts', post);
app.use('/api/v1/chat', chat);

// Socket.IO logic
const onlineUsers = new Map();

io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  let userId;

  // Handle user joining
  socket.on("setUser", (id) => {
    userId = id;
    onlineUsers.set(userId, socket);
    console.log(`User ${userId} is now online`);
  });

  // Handle message sending
  socket.on("sendMessage", (data) => {
    const { userId, message } = data;
    const recipientSocket = onlineUsers.get(userId);
    if (recipientSocket) {
      recipientSocket.emit("receiveMessage", data);
    }
  });

  // Handle user disconnect
  socket.on("disconnect", () => {
    if (userId) {
      onlineUsers.delete(userId);
      console.log(`User ${userId} disconnected`);
    }
  });
});

// Start the server
server.listen(4000, () => {
  console.log("Server is running on http://localhost:4000");
});

module.exports = { app, server };
