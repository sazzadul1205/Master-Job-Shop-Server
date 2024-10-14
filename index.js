const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const port = process.env.PORT || 5000;

// Middle Ware
app.use(
  cors({
    origin: ["http://localhost:5173"],
    credentials: true,
  })
);

app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@master-job-shop.46woq.mongodb.net/?retryWrites=true&w=majority&appName=Master-Job-Shop`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    // Connection
    const UsersCollection = client.db("Master-Job-Shop").collection("Users");
    const PostedJobCollection = client
      .db("Master-Job-Shop")
      .collection("Posted-Job");
    const PostedGigCollection = client
      .db("Master-Job-Shop")
      .collection("Posted-Gig");
    const CompanyProfilesCollection = client
      .db("Master-Job-Shop")
      .collection("Company-Profiles");
    const SalaryInsightCollection = client
      .db("Master-Job-Shop")
      .collection("Salary-Insight");
    const UpcomingEventsCollection = client
      .db("Master-Job-Shop")
      .collection("Upcoming-Events");
    const CoursesCollection = client
      .db("Master-Job-Shop")
      .collection("Courses");
    const MentorshipCollection = client
      .db("Master-Job-Shop")
      .collection("Mentorship");
    const InternshipCollection = client
      .db("Master-Job-Shop")
      .collection("Internship");
    const NewsLetterCollection = client
      .db("Master-Job-Shop")
      .collection("NewsLetter");
    const TestimonialsCollection = client
      .db("Master-Job-Shop")
      .collection("Testimonials");
    const WhyChooseUsCollection = client
      .db("Master-Job-Shop")
      .collection("WhyChooseUs");
    const HomeBannerCollection = client
      .db("Master-Job-Shop")
      .collection("Home-Banner");
    const AboutUsCollection = client
      .db("Master-Job-Shop")
      .collection("AboutUs");
    const BlogsCollection = client.db("Master-Job-Shop").collection("Blogs");

    // Log
    const ApplyToJobLogCollection = client
      .db("Master-Job-Shop")
      .collection("Apply-To-Job-Log");

    const ApplyToGigLogCollection = client
      .db("Master-Job-Shop")
      .collection("Apply-To-Gig-Log");

    const ApplyToUpcomingEventLogCollection = client
      .db("Master-Job-Shop")
      .collection("Apply-To-Upcoming-Event-Log");
    const ApplyToMentorshipLogCollection = client
      .db("Master-Job-Shop")
      .collection("Apply-To-Mentorship-Log");
    const ReviewToMentorshipLogCollection = client
      .db("Master-Job-Shop")
      .collection("Review-To-Mentorship-Log");
    const ApplyToCourseLogCollection = client
      .db("Master-Job-Shop")
      .collection("Apply-To-Course-Log");
    const ApplyToInternshipLogCollection = client
      .db("Master-Job-Shop")
      .collection("Apply-To-Internship-Log");
    const DeleteLogCollection = client
      .db("Master-Job-Shop")
      .collection("Delete-Log");

    //API`s
    // Users API
    // Get Users
    app.get("/Users", async (req, res) => {
      const { email } = req.query;
      if (email) {
        // If email is provided, find a specific user by email
        const query = { email };
        const result = await UsersCollection.findOne(query);
        res.send(result); // This will return null if not found
      } else {
        // If email is not provided, find all users
        const result = await UsersCollection.find().toArray();
        res.send(result);
      }
    });
    // Total Users Count API
    app.get("/UsersCount", async (req, res) => {
      const count = await UsersCollection.countDocuments();
      res.json({ count });
    });
    // Post new Users
    app.post("/Users", async (req, res) => {
      const request = req.body;
      const result = await UsersCollection.insertOne(request);
      res.send(result);
    });

    // Update User by ID (PUT)
    app.put("/Users/:id", async (req, res) => {
      const id = req.params.id; // Get the user ID from the URL params
      const updatedUser = req.body; // Get the updated user data from the request body

      try {
        // Create a filter to find the user by ID
        const filter = { _id: new ObjectId(id) };

        // Define the update operation (e.g., update the role and company code)
        const updateDoc = {
          $set: {
            role: updatedUser.role,
            companyCode: updatedUser.companyCode,
          },
        };

        // Update the user in the database
        const result = await UsersCollection.updateOne(filter, updateDoc);

        // If no documents were matched, the user doesn't exist
        if (result.matchedCount === 0) {
          return res.status(404).send({ message: "User not found" });
        }

        // Send success response
        res.send({ message: "User updated successfully", result });
      } catch (error) {
        // Send error response in case of failure
        res.status(500).send({ message: "Failed to update user", error });
      }
    });

    // Home Banner API
    // Get Home Banner
    app.get("/Home-Banner", async (req, res) => {
      const result = await HomeBannerCollection.find().toArray();
      res.send(result);
    });

    // Posted Job API
    // Get Posted Job
    app.get("/Posted-Job", async (req, res) => {
      try {
        const { companyCode } = req.query; // Get the companyCode from the query parameters
        let result;

        if (companyCode) {
          // If a companyCode is provided, find jobs that match the companyCode
          result = await PostedJobCollection.find({
            companyCode: companyCode,
          }).toArray();
        } else {
          // If no companyCode is provided, return all jobs
          result = await PostedJobCollection.find().toArray();
        }

        res.send(result);
      } catch (error) {
        console.error("Error fetching jobs:", error);
        res.status(500).send("An error occurred while fetching jobs.");
      }
    });
    // get Posed Posted Job by ID
    app.get("/Posted-Job/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await PostedJobCollection.findOne(query);
      res.send(result);
    });
    // Total Posted Jobs Count API
    app.get("/PostedJobCount", async (req, res) => {
      const count = await PostedJobCollection.countDocuments();
      res.json({ count });
    });

    // Apply for a Posted Job (update PeopleApplied array)
    app.post("/Posted-Job/:id/apply", async (req, res) => {
      const id = req.params.id; // Get the job ID from the request params
      const applicantData = req.body; // Applicant data sent from the frontend

      // Construct the query to find the job by ID
      const query = { _id: new ObjectId(id) };

      // Define the update to push the applicant data to PeopleApplied array
      const update = {
        $push: {
          PeopleApplied: applicantData,
        },
      };

      try {
        // Update the job document with the new applicant data
        const result = await PostedJobCollection.updateOne(query, update);

        // Check if the job was updated
        if (result.modifiedCount > 0) {
          res
            .status(200)
            .send({ message: "Application submitted successfully!" });
        } else {
          res
            .status(404)
            .send({ message: "Job not found or no changes made." });
        }
      } catch (error) {
        console.error("Error applying for the job:", error);
        res.status(500).send({ message: "Error applying for the job", error });
      }
    });
    // Post Home Banners
    app.post("/Posted-Job", async (req, res) => {
      const request = req.body;
      const result = await PostedJobCollection.insertOne(request);
      res.send(result);
    });

    // Delete Posted Job by ID
    app.delete("/Posted-Job/delete", async (req, res) => {
      const { jobsToDelete } = req.body; // Expecting an array of job IDs to delete

      if (!Array.isArray(jobsToDelete) || jobsToDelete.length === 0) {
        return res
          .status(400)
          .send({ message: "Invalid request. No job IDs provided." });
      }

      try {
        // Convert job IDs to ObjectId
        const objectIds = jobsToDelete.map((id) => new ObjectId(id));

        // Delete the jobs from the collection
        const result = await PostedJobCollection.deleteMany({
          _id: { $in: objectIds },
        });

        // Check if any documents were deleted
        if (result.deletedCount > 0) {
          res.status(200).send({
            message: `${result.deletedCount} job(s) deleted successfully!`,
          });
        } else {
          res
            .status(404)
            .send({ message: "No jobs found with the provided IDs." });
        }
      } catch (error) {
        console.error("Error deleting jobs:", error);
        res
          .status(500)
          .send({ message: "An error occurred while deleting jobs.", error });
      }
    });

    // Posted Gig API
    // Get Posted Gig
    app.get("/Posted-Gig", async (req, res) => {
      const result = await PostedGigCollection.find().toArray();
      res.send(result);
    });
    // get Posed Posted Gig by ID
    app.get("/Posted-Gig/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await PostedGigCollection.findOne(query);
      res.send(result);
    });
    // Total Posted Gig Count API
    app.get("/PostedGigCount", async (req, res) => {
      const count = await PostedGigCollection.countDocuments();
      res.json({ count });
    });

    // Apply for a Posted Job (update PeopleApplied array)
    app.post("/Posted-Gig/:id/apply", async (req, res) => {
      const id = req.params.id; // Get the job ID from the request params
      const bidData = req.body; // Applicant data sent from the frontend

      // Construct the query to find the job by ID
      const query = { _id: new ObjectId(id) };

      // Define the update to push the applicant data to PeopleApplied array
      const update = {
        $push: {
          peopleBided: bidData,
        },
      };

      try {
        // Update the job document with the new applicant data
        const result = await PostedGigCollection.updateOne(query, update);

        // Check if the job was updated
        if (result.modifiedCount > 0) {
          res
            .status(200)
            .send({ message: "Application submitted successfully!" });
        } else {
          res
            .status(404)
            .send({ message: "Job not found or no changes made." });
        }
      } catch (error) {
        console.error("Error applying for the job:", error);
        res.status(500).send({ message: "Error applying for the job", error });
      }
    });
    // Post Home Banners
    app.post("/Posted-Gig", async (req, res) => {
      const request = req.body;
      const result = await PostedGigCollection.insertOne(request);
      res.send(result);
    });

    // Delete Posted Gig by ID
    app.delete("/Posted-Gig/delete", async (req, res) => {
      const { gigsToDelete } = req.body; // Expecting an array of gig IDs to delete

      // Validate the input
      if (!Array.isArray(gigsToDelete) || gigsToDelete.length === 0) {
        return res
          .status(400)
          .send({ message: "Invalid request. No gig IDs provided." });
      }

      try {
        // Convert gig IDs to ObjectId
        const objectIds = gigsToDelete.map((id) => new ObjectId(id));

        // Delete the gigs from the collection
        const result = await PostedGigCollection.deleteMany({
          _id: { $in: objectIds },
        });

        // Check if any documents were deleted
        if (result.deletedCount > 0) {
          res.status(200).send({
            message: `${result.deletedCount} gig(s) deleted successfully!`,
          });
        } else {
          res
            .status(404)
            .send({ message: "No gigs found with the provided IDs." });
        }
      } catch (error) {
        console.error("Error deleting gigs:", error);
        res
          .status(500)
          .send({ message: "An error occurred while deleting gigs.", error });
      }
    });

    // Company Profiles API
    // Get Company Profiles
    app.get("/Company-Profiles", async (req, res) => {
      const result = await CompanyProfilesCollection.find().toArray();
      res.send(result);
    });
    // get Posed Company Profiles by ID
    app.get("/Company-Profiles/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await CompanyProfilesCollection.findOne(query);
      res.send(result);
    });
    // Get only Company Names and Codes
    app.get("/Company-Profiles-Names-Codes", async (req, res) => {
      try {
        const projection = { companyName: 1, companyCode: 1 }; // Select only companyName and companyCode
        const result = await CompanyProfilesCollection.find(
          {},
          { projection }
        ).toArray();
        res.send(result);
      } catch (error) {
        res
          .status(500)
          .send({ message: "Failed to fetch company names and codes", error });
      }
    });

    // Total Posted Company Profile Count API
    app.get("/CompanyProfilesCount", async (req, res) => {
      const count = await CompanyProfilesCollection.countDocuments();
      res.json({ count });
    });

    // Salary Insight API
    // Get Salary Insight
    app.get("/Salary-Insight", async (req, res) => {
      const result = await SalaryInsightCollection.find().toArray();
      res.send(result);
    });
    // get Posed Salary Insight by ID
    app.get("/Salary-Insight/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await SalaryInsightCollection.findOne(query);
      res.send(result);
    });
    // Total Posted Salary Insight Count API
    app.get("/SalaryInsightCount", async (req, res) => {
      const count = await SalaryInsightCollection.countDocuments();
      res.json({ count });
    });

    // Post Home Banners
    app.post("/Salary-Insight", async (req, res) => {
      const request = req.body;
      const result = await SalaryInsightCollection.insertOne(request);
      res.send(result);
    });

    // Delete a single Salary Insight by ID
    app.delete("/Salary-Insight/delete/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };

        const result = await SalaryInsightCollection.deleteOne(query);

        if (result.deletedCount === 1) {
          res
            .status(200)
            .send({ message: "Salary Insight deleted successfully." });
        } else {
          res.status(404).send({ message: "Salary Insight not found." });
        }
      } catch (error) {
        console.error("Error deleting salary insight:", error);
        res.status(500).send({ message: "Failed to delete Salary Insight." });
      }
    });
    // Delete multiple Salary Insights by IDs
    app.delete("/Salary-Insight/delete", async (req, res) => {
      try {
        const { insightsToDelete } = req.body;
        const objectIds = insightsToDelete.map((id) => new ObjectId(id));

        const query = { _id: { $in: objectIds } };

        const result = await SalaryInsightCollection.deleteMany(query);

        if (result.deletedCount > 0) {
          res.status(200).send({
            message: `${result.deletedCount} Salary Insights deleted successfully.`,
          });
        } else {
          res
            .status(404)
            .send({ message: "No Salary Insights found to delete." });
        }
      } catch (error) {
        console.error("Error deleting salary insights:", error);
        res.status(500).send({ message: "Failed to delete Salary Insights." });
      }
    });

    // Upcoming Events API
    // Get Upcoming Events
    app.get("/Upcoming-Events", async (req, res) => {
      const result = await UpcomingEventsCollection.find().toArray();
      res.send(result);
    });
    // get Posed Upcoming Events by ID
    app.get("/Upcoming-Events/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await UpcomingEventsCollection.findOne(query);
      res.send(result);
    });
    // Total Posted Upcoming Events Count API
    app.get("/UpcomingEventsCount", async (req, res) => {
      const count = await UpcomingEventsCollection.countDocuments();
      res.json({ count });
    });

    // Apply for a Posted Job (update PeopleApplied array)
    app.post("/Upcoming-Events/:id/apply", async (req, res) => {
      const id = req.params.id; // Get the job ID from the request params
      const applicantData = req.body; // Applicant data sent from the frontend

      // Construct the query to find the job by ID
      const query = { _id: new ObjectId(id) };

      // Define the update to push the applicant data to PeopleApplied array
      const update = {
        $push: {
          ParticipantApplications: applicantData,
        },
      };

      try {
        // Update the job document with the new applicant data
        const result = await UpcomingEventsCollection.updateOne(query, update);

        // Check if the job was updated
        if (result.modifiedCount > 0) {
          res
            .status(200)
            .send({ message: "Application submitted successfully!" });
        } else {
          res
            .status(404)
            .send({ message: "Job not found or no changes made." });
        }
      } catch (error) {
        console.error("Error applying for the job:", error);
        res.status(500).send({ message: "Error applying for the job", error });
      }
    });

    // Courses API
    // Get Courses
    app.get("/Courses", async (req, res) => {
      const result = await CoursesCollection.find().toArray();
      res.send(result);
    });
    // get Posed Courses by ID
    app.get("/Courses/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await CoursesCollection.findOne(query);
      res.send(result);
    });
    // Total Posted Courses Count API
    app.get("/CoursesCount", async (req, res) => {
      const count = await CoursesCollection.countDocuments();
      res.json({ count });
    });

    // Apply for a Posted Job (update PeopleApplied array)
    app.post("/Courses/:id/apply", async (req, res) => {
      const id = req.params.id; // Get the job ID from the request params
      const applicantData = req.body; // Applicant data sent from the frontend

      // Construct the query to find the job by ID
      const query = { _id: new ObjectId(id) };

      // Define the update to push the applicant data to PeopleApplied array
      const update = {
        $push: {
          applicants: applicantData,
        },
      };

      try {
        // Update the job document with the new applicant data
        const result = await CoursesCollection.updateOne(query, update);

        // Check if the job was updated
        if (result.modifiedCount > 0) {
          res
            .status(200)
            .send({ message: "Application submitted successfully!" });
        } else {
          res
            .status(404)
            .send({ message: "Job not found or no changes made." });
        }
      } catch (error) {
        console.error("Error applying for the job:", error);
        res.status(500).send({ message: "Error applying for the job", error });
      }
    });

    // Mentorship API
    // Get Mentorship
    app.get("/Mentorship", async (req, res) => {
      const result = await MentorshipCollection.find().toArray();
      res.send(result);
    });
    // get Posed Mentorship by ID
    app.get("/Mentorship/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await MentorshipCollection.findOne(query);
      res.send(result);
    });
    // Total Posted Mentorship Count API
    app.get("/MentorshipCount", async (req, res) => {
      const count = await MentorshipCollection.countDocuments();
      res.json({ count });
    });

    // Apply for a Posted Job (update PeopleApplied array)
    app.post("/Mentorship/:id/applyReview", async (req, res) => {
      const id = req.params.id; // Get the job ID from the request params
      const reviewData = req.body; // Applicant data sent from the frontend

      // Construct the query to find the job by ID
      const query = { _id: new ObjectId(id) };

      // Define the update to push the applicant data to PeopleApplied array
      const update = {
        $push: {
          reviews: reviewData,
        },
      };

      try {
        // Update the job document with the new applicant data
        const result = await MentorshipCollection.updateOne(query, update);

        // Check if the job was updated
        if (result.modifiedCount > 0) {
          res
            .status(200)
            .send({ message: "Application submitted successfully!" });
        } else {
          res
            .status(404)
            .send({ message: "Job not found or no changes made." });
        }
      } catch (error) {
        console.error("Error applying for the job:", error);
        res.status(500).send({ message: "Error applying for the job", error });
      }
    });
    // Apply for a Posted Job (update PeopleApplied array)
    app.post("/Mentorship/:id/applyApplicant", async (req, res) => {
      const id = req.params.id; // Get the job ID from the request params
      const applicantData = req.body; // Applicant data sent from the frontend

      // Construct the query to find the job by ID
      const query = { _id: new ObjectId(id) };

      // Define the update to push the applicant data to PeopleApplied array
      const update = {
        $push: {
          applicant: applicantData,
        },
      };

      try {
        // Update the job document with the new applicant data
        const result = await MentorshipCollection.updateOne(query, update);

        // Check if the job was updated
        if (result.modifiedCount > 0) {
          res
            .status(200)
            .send({ message: "Application submitted successfully!" });
        } else {
          res
            .status(404)
            .send({ message: "Job not found or no changes made." });
        }
      } catch (error) {
        console.error("Error applying for the job:", error);
        res.status(500).send({ message: "Error applying for the job", error });
      }
    });

    // Internship API
    // Get Internship
    app.get("/Internship", async (req, res) => {
      const result = await InternshipCollection.find().toArray();
      res.send(result);
    });
    // get Posed Internship by ID
    app.get("/Internship/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await InternshipCollection.findOne(query);
      res.send(result);
    });
    // Total Posted Internship Count API
    app.get("/InternshipCount", async (req, res) => {
      const count = await InternshipCollection.countDocuments();
      res.json({ count });
    });

    // Apply for a Posted Job (update PeopleApplied array)
    app.post("/Internship/:id/apply", async (req, res) => {
      const id = req.params.id; // Get the job ID from the request params
      const applicantData = req.body; // Applicant data sent from the frontend

      // Construct the query to find the job by ID
      const query = { _id: new ObjectId(id) };

      // Define the update to push the applicant data to PeopleApplied array
      const update = {
        $push: {
          applicants: applicantData,
        },
      };

      try {
        // Update the job document with the new applicant data
        const result = await InternshipCollection.updateOne(query, update);

        // Check if the job was updated
        if (result.modifiedCount > 0) {
          res
            .status(200)
            .send({ message: "Application submitted successfully!" });
        } else {
          res
            .status(404)
            .send({ message: "Job not found or no changes made." });
        }
      } catch (error) {
        console.error("Error applying for the job:", error);
        res.status(500).send({ message: "Error applying for the job", error });
      }
    });

    // NewsLetter API
    // Get NewsLetter
    app.get("/NewsLetter", async (req, res) => {
      const result = await NewsLetterCollection.find().toArray();
      res.send(result);
    });
    // Post new NewsLetter
    app.post("/NewsLetter", async (req, res) => {
      const request = req.body;
      const result = await NewsLetterCollection.insertOne(request);
      res.send(result);
    });
    // Total Posted NewsLetter Count API
    app.get("/NewsLetterCount", async (req, res) => {
      const count = await NewsLetterCollection.countDocuments();
      res.json({ count });
    });

    // Testimonials API
    // Get Testimonials
    app.get("/Testimonials", async (req, res) => {
      const result = await TestimonialsCollection.find().toArray();
      res.send(result);
    });
    // Total Posted Testimonials Count API
    app.get("/TestimonialsCount", async (req, res) => {
      const count = await TestimonialsCollection.countDocuments();
      res.json({ count });
    });

    // WhyChooseUs API
    // Get WhyChooseUs
    app.get("/WhyChooseUs", async (req, res) => {
      const result = await WhyChooseUsCollection.find().toArray();
      res.send(result);
    });

    // AboutUs API
    // Get AboutUs
    app.get("/AboutUs", async (req, res) => {
      const result = await AboutUsCollection.find().toArray();
      res.send(result);
    });
    // get Posed AboutUs by ID
    app.get("/AboutUs/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await AboutUsCollection.findOne(query);
      res.send(result);
    });

    // Blogs API
    // Get Blogs
    app.get("/Blogs", async (req, res) => {
      const result = await BlogsCollection.find().toArray();
      res.send(result);
    });
    // get Posed Blogs by ID
    app.get("/Blogs/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await BlogsCollection.findOne(query);
      res.send(result);
    });
    // Total Posted Blogs Count API
    app.get("/BlogsCount", async (req, res) => {
      const count = await BlogsCollection.countDocuments();
      res.json({ count });
    });

    // POST request to handle voting for a blog
    app.post("/Blogs/:id/vote", async (req, res) => {
      const id = req.params.id; // Blog ID
      const { type, email } = req.body; // Vote type ("up" or "down") and user email

      try {
        const blog = await BlogsCollection.findOne({ _id: new ObjectId(id) });

        if (!blog) {
          return res.status(404).json({ message: "Blog not found" });
        }

        let updatedBlog = { ...blog }; // Copy the existing blog data

        if (type === "up") {
          if (updatedBlog.peopleUpVoted.includes(email)) {
            // User has already upvoted, so remove their upvote
            updatedBlog.upVotes -= 1;
            updatedBlog.peopleUpVoted = updatedBlog.peopleUpVoted.filter(
              (userEmail) => userEmail !== email
            );
          } else {
            // User is upvoting for the first time
            updatedBlog.upVotes += 1;
            updatedBlog.peopleUpVoted.push(email);

            // If they previously downvoted, remove that downvote
            if (updatedBlog.peopleDownVoted.includes(email)) {
              updatedBlog.downVotes -= 1;
              updatedBlog.peopleDownVoted = updatedBlog.peopleDownVoted.filter(
                (userEmail) => userEmail !== email
              );
            }
          }
        } else if (type === "down") {
          if (updatedBlog.peopleDownVoted.includes(email)) {
            // User has already downvoted, so remove their downvote
            updatedBlog.downVotes -= 1;
            updatedBlog.peopleDownVoted = updatedBlog.peopleDownVoted.filter(
              (userEmail) => userEmail !== email
            );
          } else {
            // User is downvoting for the first time
            updatedBlog.downVotes += 1;
            updatedBlog.peopleDownVoted.push(email);

            // If they previously upvoted, remove that upvote
            if (updatedBlog.peopleUpVoted.includes(email)) {
              updatedBlog.upVotes -= 1;
              updatedBlog.peopleUpVoted = updatedBlog.peopleUpVoted.filter(
                (userEmail) => userEmail !== email
              );
            }
          }
        } else {
          return res.status(400).json({ message: "Invalid vote type" });
        }

        // Update the blog in the database
        await BlogsCollection.updateOne(
          { _id: new ObjectId(id) },
          {
            $set: {
              upVotes: updatedBlog.upVotes,
              downVotes: updatedBlog.downVotes,
              peopleUpVoted: updatedBlog.peopleUpVoted,
              peopleDownVoted: updatedBlog.peopleDownVoted,
            },
          }
        );

        res.status(200).json({ message: "Vote recorded successfully" });
      } catch (error) {
        console.error("Error updating vote:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    });

    // All the Logs

    // Apply To Job Log API
    //  get Apply To Job Log
    app.get("/Apply-To-Job-Log", async (req, res) => {
      const result = await ApplyToJobLogCollection.find().toArray();
      res.send(result);
    });
    // Post new Apply To Job Log
    app.post("/Apply-To-Job-Log", async (req, res) => {
      const request = req.body;
      const result = await ApplyToJobLogCollection.insertOne(request);
      res.send(result);
    });

    // Apply To Gig Log API
    //  get Apply To Gig Log
    app.get("/Apply-To-Gig-Log", async (req, res) => {
      const result = await ApplyToGigLogCollection.find().toArray();
      res.send(result);
    });
    // Post new Apply To Gig Log
    app.post("/Apply-To-Gig-Log", async (req, res) => {
      const request = req.body;
      const result = await ApplyToGigLogCollection.insertOne(request);
      res.send(result);
    });

    // Apply To Upcoming Event Log API
    //  get Apply To Upcoming Event Log
    app.get("/Apply-To-Upcoming-Event-Log", async (req, res) => {
      const result = await ApplyToUpcomingEventLogCollection.find().toArray();
      res.send(result);
    });
    // Post new Apply To Upcoming Event Log
    app.post("/Apply-To-Upcoming-Event-Log", async (req, res) => {
      const request = req.body;
      const result = await ApplyToUpcomingEventLogCollection.insertOne(request);
      res.send(result);
    });

    // Apply To Mentorship Log API
    //  get Apply To Mentorship Log
    app.get("/Apply-To-Mentorship-Log", async (req, res) => {
      const result = await ApplyToMentorshipLogCollection.find().toArray();
      res.send(result);
    });
    // Post new Apply To Mentorship Log
    app.post("/Apply-To-Mentorship-Log", async (req, res) => {
      const request = req.body;
      const result = await ApplyToMentorshipLogCollection.insertOne(request);
      res.send(result);
    });

    // Review To Mentorship Log API
    //  get Review To Mentorship Log
    app.get("/Review-To-Mentorship-Log", async (req, res) => {
      const result = await ReviewToMentorshipLogCollection.find().toArray();
      res.send(result);
    });
    // Post new Review To Mentorship Log
    app.post("/Review-To-Mentorship-Log", async (req, res) => {
      const request = req.body;
      const result = await ReviewToMentorshipLogCollection.insertOne(request);
      res.send(result);
    });

    // Apply To Courses Log API
    //  get Apply To Courses Log
    app.get("/Apply-To-Course-Log", async (req, res) => {
      const result = await ApplyToCourseLogCollection.find().toArray();
      res.send(result);
    });
    // Post new Apply To Courses Log
    app.post("/Apply-To-Course-Log", async (req, res) => {
      const request = req.body;
      const result = await ApplyToCourseLogCollection.insertOne(request);
      res.send(result);
    });

    // Apply To Internship Log API
    //  get Apply To Internship Log
    app.get("/Apply-To-Internship-Log", async (req, res) => {
      const result = await ApplyToInternshipLogCollection.find().toArray();
      res.send(result);
    });
    // Post new Apply To Internship Log
    app.post("/Apply-To-Internship-Log", async (req, res) => {
      const request = req.body;
      const result = await ApplyToInternshipLogCollection.insertOne(request);
      res.send(result);
    });

    // Delete Log API
    //  get Delete Log
    app.get("/Delete-Log", async (req, res) => {
      const result = await DeleteLogCollection.find().toArray();
      res.send(result);
    });
    // POST new Delete Log
    app.post("/Delete-Log", async (req, res) => {
      const request = req.body;

      // Basic validation
      if (!request || !Array.isArray(request) || request.length === 0) {
        return res
          .status(400)
          .send({ message: "Invalid data. Expected an array of logs." });
      }

      try {
        const result = await DeleteLogCollection.insertMany(request); // Use insertMany for multiple logs
        res.status(201).send(result);
      } catch (error) {
        console.error("Error inserting delete logs:", error);
        res.status(500).send({ message: "Failed to log delete operations." });
      }
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

// Set up the basic route
app.get("/", (req, res) => {
  res.send("Master Job Shop is Running");
});

// Listen on the specified port
app.listen(port, () => {
  console.log(`Master Job Shop is Running on Port: ${port}`);
});
