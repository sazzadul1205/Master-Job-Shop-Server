// index.js
const express = require("express");
const jwt = require("jsonwebtoken");
const cors = require("cors");

// Connect Database
const { connectDB } = require("./config/db");

// -------------------- Basic API Routes --------------------
const Testimonials = require("./routes/Testimonials/Testimonials");
const HomeBanner = require("./routes/HomeBanner/HomeBanner");
const NewsLetter = require("./routes/Newsletter/Newsletter");
const ChooseUs = require("./routes/ChooseUs/ChooseUs");
const Users = require("./routes/User/User");
const Blogs = require("./routes/Blogs/Blogs");
const AboutUs = require("./routes/AboutUs/AboutUs");

// -------------------- Trainers / Jobs Routes --------------------
const JobApplications = require("./routes/Jobs/JobApplications");
const Jobs = require("./routes/Jobs/Jobs");

// -------------------- Gigs Routes --------------------
const GigBids = require("./routes/Gigs/GigBids");
const Gigs = require("./routes/Gigs/Gigs");

// -------------------- Company Routes --------------------
const Company = require("./routes/Company/Company");

// -------------------- Insights Routes --------------------
const Insights = require("./routes/Insights/Insights");

// -------------------- Events Routes --------------------
const EventApplications = require("./routes/Events/EventApplications");
const Events = require("./routes/Events/Events");

// -------------------- Courses Routes --------------------
const CourseApplications = require("./routes/Courses/CourseApplications");
const Courses = require("./routes/Courses/Courses");

// -------------------- Mentorship Routes --------------------
const MentorshipApplications = require("./routes/Mentorship/MentorshipApplications");
const Mentorship = require("./routes/Mentorship/Mentorship");

// -------------------- Internship Routes --------------------
const InternshipApplications = require("./routes/Internship/InternshipApplications");
const Internship = require("./routes/Internship/Internship");

// -------------------- PDF Upload Route --------------------
const PDFUpload = require("./routes/PDFUpload/PDFUpload");

// -------------------- Become Employer / Mentor Routes --------------------
const EmployerRequest = require("./routes/EmployerRequest/EmployerRequest");
const MentorRequest = require("./routes/MentorRequest/MentorRequest");

// -------------------- Employers / Mentors Routes --------------------
const Employers = require("./routes/Employers/Employers");
const Mentors = require("./routes/Mentors/Mentors");

// -------------------- Mentor Email / Message Routes --------------------
const MentorMessages = require("./routes/Messages/MentorMessages");
const MentorEmails = require("./routes/Emails/MentorEmails");

require("dotenv").config();
const app = express();

// CORS – add your prod domains here
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://192.168.0.11:5173",
      "https://master-job-shop-server-qwbp5hp6w-sazzadul-islams-projects.vercel.app/",
    ],
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

// -------------------- Basic APP Routes --------------------
app.use("/Users", Users);
app.use("/Blogs", Blogs);
app.use("/AboutUs", AboutUs);
app.use("/ChooseUs", ChooseUs);
app.use("/NewsLetter", NewsLetter);
app.use("/Home-Banner", HomeBanner);
app.use("/Testimonials", Testimonials);

// -------------------- Trainers / Jobs APP Routes --------------------
app.use("/JobApplications", JobApplications);
app.use("/Jobs", Jobs);

// -------------------- Gigs APP Routes --------------------
app.use("/GigBids", GigBids);
app.use("/Gigs", Gigs);

// -------------------- Company APP Routes --------------------
app.use("/Company", Company);

// -------------------- Insights APP Routes --------------------
app.use("/Insights", Insights);

// -------------------- Events APP Routes --------------------
app.use("/EventApplications", EventApplications);
app.use("/Events", Events);

// -------------------- Courses APP Routes --------------------
app.use("/CourseApplications", CourseApplications);
app.use("/Courses", Courses);

// -------------------- Mentorship APP Routes --------------------
app.use("/MentorshipApplications", MentorshipApplications);
app.use("/Mentorship", Mentorship);

// -------------------- Internship APP Routes --------------------
app.use("/InternshipApplications", InternshipApplications);
app.use("/Internship", Internship);

// -------------------- PDF Upload APP Route --------------------
app.use("/PDFUpload", PDFUpload);

// -------------------- Become Employer / Mentor APP Routes --------------------
app.use("/EmployerRequest", EmployerRequest);
app.use("/MentorRequest", MentorRequest);

// -------------------- Employers / Mentors APP Routes --------------------
app.use("/Employers", Employers);
app.use("/Mentors", Mentors);

// -------------------- Mentor Emails / Messages APP Routes --------------------
app.use("/MentorEmails", MentorEmails);
app.use("/MentorMessages", MentorMessages);

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
