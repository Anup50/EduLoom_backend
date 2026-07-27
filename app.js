require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDb = require("./config/db");
const http = require("http");
const { initSocket } = require("./services/socketService");

const UserRoute = require("./routes/UserRoute");
const TutorRoute = require("./routes/TutorRoute");
const AuthRoute = require("./routes/AuthRoute");
const SubjectRoute = require("./routes/SubjectRoute");
const StudentRoute = require("./routes/StudentRoute");
const WalletRoute = require("./routes/WalletRoute");
const BookingRoute = require("./routes/BookingRoute");
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
const CloudinaryRoute = require("./routes/CloudinaryRoute");
const QuizResultRoute = require("./routes/QuizResultRoute");
const ContactRoute = require("./routes/ContactRoute");

const app = express();
const server = http.createServer(app);

// Initialize Socket.io via socketService
initSocket(server);

connectDb();

const allowedOrigins = [
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
app.use("/api/cloudinary", CloudinaryRoute);
app.use("/api/quiz-results", QuizResultRoute);
app.use("/api/contact", ContactRoute);

const port = process.env.PORT || 5000;

if (process.env.NODE_ENV !== "test") {
  server.listen(port, () => {
    console.log(`✅ Server Running at http://localhost:${port}`);
  });
}

module.exports = { app, server };
