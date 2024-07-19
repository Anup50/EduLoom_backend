require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDb = require("./config/db");
const http = require("http");
const socketIo = require("socket.io");
const { NOTIFICATION_EVENTS } = require("./utils/notifications");

const UserRoute = require("./routes/userRoute");
const TutorRoute = require("./routes/tutorRoute");
const AuthRoute = require("./routes/AuthRoute");
const SubjectRoute = require("./routes/SubjectRoute");
const StudentRoute = require("./routes/StudentRoute");
const WalletRoute = require("./routes/WalletRoute");
const BookingRoute = require("./routes/BookingRoute");
const connectedUsers = require("./socketStore");
const NotificationRoute = require("./routes/NotificationRoute");
const SessionRoute = require("./routes/SessionRoute");
const EarningRoute = require("./routes/EarningRoute");
const ReviewRoute = require("./routes/ReviewRoute");
const CategoriesRoute = require("./routes/CategoriesRoute");
const EnrollmentRoute = require("./routes/EnrollmentRoute");
const LessonRoute = require("./routes/LessonRoute");
const NoteRoute = require("./routes/NoteRoute");
const QuizRoute = require("./routes/QuizRoute");
const CourseRoute = require("./routes/CourseRoute");
const Cloudinary = require("./routes/Cloudinary");
const QuizResultRoute = require("./routes/QuizResultRoute");
const ContactRoute = require("./routes/ContactRoute");
const app = express();
const server = http.createServer(app);

module.exports = { app };

// global.io = socketIo(server, {
//   cors: {
//     origin: "https://tutor-me-web-client.vercel.app",
//     methods: ["GET", "POST", "PUT", "DELETE"],
//     credentials: true,
//   },
// });
global.io = socketIo(server, {
  cors: {
    origin: ["http://localhost:5173"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  },
});

global.connectedUsers = {};

// Socket connection handling
global.io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Handle user registration
  socket.on("register", (userId) => {
    if (userId) {
      // Store the socket id for this user
      global.connectedUsers[userId.toString()] = socket.id;
      console.log(`✅ User ${userId} registered with socket ${socket.id}`);

      // Join a personal room for this user
      socket.join(`user_${userId}`);

      // Notify the user that connection is established
      socket.emit("connection_established", {
        message: "Connected to notification service",
        userId: userId,
      });
    } else {
      console.log("No userId provided for registration");
    }
  });

  // Handle notification acknowledgment
  socket.on(NOTIFICATION_EVENTS.NOTIFICATION_READ, async (data) => {
    try {
      const { notificationId, userId } = data;
      console.log(
        `Notification ${notificationId} marked as read by user ${userId}`
      );
      // You can add additional handling here if needed
    } catch (error) {
      console.error("Error handling notification acknowledgment:", error);
    }
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    // Remove user from connected users
    Object.keys(global.connectedUsers).forEach((userId) => {
      if (global.connectedUsers[userId] === socket.id) {
        delete global.connectedUsers[userId];
        console.log(`User ${userId} disconnected`);
      }
    });
  });
});

connectDb();
const allowedOrigins = [
  // "https://tutor-me-web-client.vercel.app", // production
  "http://localhost:5173", // local dev
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
  })
);

// app.use(
//   cors({
//     origin: "https://tutor-me-web-client.vercel.app",
//     methods: ["GET", "POST", "PUT", "DELETE"],
//     credentials: true,
//   })
// );
app.use(express.json());

app.use("/auth", AuthRoute);
app.use("/api/users", UserRoute);
app.use("/api/tutors", TutorRoute);
app.use("/api/subjects", SubjectRoute);
app.use("/api/student", StudentRoute);
app.use("/api/transaction", WalletRoute);
app.use("/api/bookings", BookingRoute);
app.use("/api/notifications", NotificationRoute);
app.use("/api/sessions", SessionRoute);
app.use("/api/earning", EarningRoute);
app.use("/api/review", ReviewRoute);
app.use("/api/categories", CategoriesRoute);
app.use("/api/enrollments", EnrollmentRoute);
app.use("/api/lessons", LessonRoute);
app.use("/api/notes", NoteRoute);
app.use("/api/quizzes", QuizRoute);
app.use("/api/courses", CourseRoute);
app.use("/api/cloudinary", Cloudinary);
app.use("/api/quiz-results", QuizResultRoute);
app.use("/api/contact", ContactRoute);

const port = process.env.PORT || 5000;
// server.listen(port, () => {
//   console.log(` Server Running at http://localhost:${port}`);
// });

// module.exports = { app };

if (process.env.NODE_ENV !== "test") {
  server.listen(port, () => {
    console.log(`✅ Server Running at http://localhost:${port}`);
  });
}

module.exports = { app, server };
