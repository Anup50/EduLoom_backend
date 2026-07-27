const socketIo = require("socket.io");
const { NOTIFICATION_EVENTS } = require("../utils/notifications");

let io = null;
const connectedUsers = {};

// Keep global references for backward compatibility
global.connectedUsers = connectedUsers;

const initSocket = (server, options = {}) => {
  const defaultCors = {
    origin: ["http://localhost:5173"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  };

  io = socketIo(server, {
    cors: options.cors || defaultCors,
  });

  global.io = io;

  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}`);

    socket.on("register", (userId) => {
      if (userId) {
        connectedUsers[userId.toString()] = socket.id;
        console.log(`✅ User ${userId} registered with socket ${socket.id}`);
        socket.join(`user_${userId}`);
        socket.emit("connection_established", {
          message: "Connected to notification service",
          userId: userId,
        });
      } else {
        console.log("No userId provided for registration");
      }
    });

    socket.on(NOTIFICATION_EVENTS.NOTIFICATION_READ, async (data) => {
      try {
        const { notificationId, userId } = data;
        console.log(`Notification ${notificationId} marked as read by user ${userId}`);
      } catch (error) {
        console.error("Error handling notification acknowledgment:", error);
      }
    });

    socket.on("disconnect", () => {
      Object.keys(connectedUsers).forEach((userId) => {
        if (connectedUsers[userId] === socket.id) {
          delete connectedUsers[userId];
          console.log(`User ${userId} disconnected`);
        }
      });
    });
  });

  return io;
};

const getIo = () => io;
const getConnectedUsers = () => connectedUsers;

module.exports = {
  initSocket,
  getIo,
  getConnectedUsers,
};
