// index.js
const express = require("express");
const jwt = require("jsonwebtoken");
const cors = require("cors");

// Connect Database
const { connectDB } = require("./config/db");

// Basic API Routes
const Testimonials = require("./routes/Testimonials/Testimonials");
const HomeBanner = require("./routes/HomeBanner/HomeBanner");
const NewsLetter = require("./routes/NewsLetter/NewsLetter");
const ChooseUs = require("./routes/ChooseUs/ChooseUs");
const Users = require("./routes/User/User");
const Blogs = require("./routes/Blogs/Blogs");

// Trainers API routes
const JobApplications = require("./routes/Jobs/JobApplications");
const Jobs = require("./routes/Jobs/Jobs");

// Gigs API routes
const GigBids = require("./routes/Gigs/GigBids");
const Gigs = require("./routes/Gigs/Gigs");

// Company API routes
const Company = require("./routes/Company/Company");

// Insights API routes
const Insights = require("./routes/Insights/Insights");

// Events API routes
const EventApplications = require("./routes/Events/EventApplications");
const Events = require("./routes/Events/Events");

// Courses API routes
const CourseApplications = require("./routes/Courses/CourseApplications");
const Courses = require("./routes/Courses/Courses");

// Mentorship API routes
const MentorshipApplications = require("./routes/Mentorship/MentorshipApplications");
const Mentorship = require("./routes/Mentorship/Mentorship");

// Internship API routes
const InternshipApplications = require("./routes/Internship/InternshipApplications");
const Internship = require("./routes/Internship/Internship");

// PDF Upload API route
const PDFUpload = require("./routes/PDFUpload/PDFUpload");

// Insights API routes
const AboutUs = require("./routes/AboutUs/AboutUs");

// become employer API route
const EmployerRequest = require("./routes/EmployerRequest/EmployerRequest");

require("dotenv").config();
const app = express();

// CORS – add your prod domains here
app.use(
  cors({
    origin: ["http://localhost:5173", "http://192.168.0.11:5173"],
    credentials: true,
  })
);

app.use(express.json());

// Connect to the database
connectDB();

// Auth endpoint: issues JWT
app.post("/jwt", async (req, res) => {
  try {
    const { user } = req.body;
    if (!user || typeof user !== "object") {
      return res.status(400).json({ message: "Missing user object." });
    }
    const { id, email } = user;
    if (!id || !email) {
      return res.status(400).json({ message: "Invalid user data." });
    }
    const payload = { id, email };
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "10d",
      issuer: "www.Master-Job-Shop-Auth.com",
    });
    res.status(200).json({ token });
  } catch (error) {
    console.error("JWT generation error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
});

app.use("/Users", Users);
app.use("/Blogs", Blogs);
app.use("/ChooseUs", ChooseUs);
app.use("/NewsLetter", NewsLetter);
app.use("/Home-Banner", HomeBanner);
app.use("/Testimonials", Testimonials);

app.use("/JobApplications", JobApplications);
app.use("/Jobs", Jobs);

app.use("/GigBids", GigBids);
app.use("/Gigs", Gigs);

app.use("/Company", Company);

app.use("/Insights", Insights);

app.use("/EventApplications", EventApplications);
app.use("/Events", Events);

app.use("/CourseApplications", CourseApplications);
app.use("/Courses", Courses);

app.use("/MentorshipApplications", MentorshipApplications);
app.use("/Mentorship", Mentorship);

app.use("/InternshipApplications", InternshipApplications);
app.use("/Internship", Internship);

app.use("/PDFUpload", PDFUpload);

app.use("/AboutUs", AboutUs);

app.use("/EmployerRequest", EmployerRequest);

// Root health-check
app.get("/", (req, res) => {
  res.send("Master Job Shop Server is Running");
});

// Error handlers
process.on("uncaughtException", (err) => {
  console.error("There was an uncaught error", err);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Export for Vercel serverless
module.exports = app;
