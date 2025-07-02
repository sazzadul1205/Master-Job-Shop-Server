const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const port = process.env.PORT || 5000;

// Middle Ware
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://master-job-shop.web.app",
      "https://master-job-shop.firebaseapp.com",
    ],
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
    // await client.connect();

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
        const { companyCode, email } = req.query; // Get both companyCode and email from the query parameters
        let query = {}; // Initialize an empty query object

        // Add conditions based on the provided query parameters
        if (companyCode) {
          query.companyCode = companyCode; // Filter by companyCode if provided
        }
        if (email) {
          query["postedBy.email"] = email; // Filter by postedBy.email if provided
        }

        // Fetch the jobs based on the constructed query
        const result = await PostedJobCollection.find(query).toArray();

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

    // Update Posted Job by ID
    app.put("/Posted-Job/:id", async (req, res) => {
      const id = req.params.id; // Get the job ID from the request parameters
      const updatedData = req.body; // Data to update, sent from the client

      // Construct the query to find the job by its ID
      const query = { _id: new ObjectId(id) };

      // Construct the update object with the updated job data
      const update = {
        $set: updatedData, // Use $set to update the fields in the job document
      };

      try {
        // Perform the update in the database
        const result = await PostedJobCollection.updateOne(query, update);

        // Check if the update was successful
        if (result.modifiedCount > 0) {
          res.status(200).send({ message: "Job updated successfully!" });
        } else {
          res
            .status(404)
            .send({ message: "Job not found or no changes made." });
        }
      } catch (error) {
        console.error("Error updating the job:", error);
        res.status(500).send({
          message: "An error occurred while updating the job.",
          error,
        });
      }
    });

    // Approve Posted Job by ID
    app.patch("/Posted-Job/:id/approve", async (req, res) => {
      const jobId = req.params.id; // Get the job ID from the request params

      // Construct the query to find the job by ID
      const query = { _id: new ObjectId(jobId) };

      // Define the update to set the job's state to "Approved"
      const update = {
        $set: { state: "Approved" },
      };

      try {
        // Perform the update in the database
        const result = await PostedJobCollection.updateOne(query, update);

        // Check if the update was successful
        if (result.modifiedCount > 0) {
          res.status(200).send({ message: "Job approved successfully!" });
        } else {
          res
            .status(404)
            .send({ message: "Job not found or already approved." });
        }
      } catch (error) {
        console.error("Error approving job:", error);
        res.status(500).send({
          message: "An error occurred while approving the job.",
          error,
        });
      }
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

    // Delete a single applicant from PeopleApplied
    app.delete("/Posted-Job/:id/applicant", async (req, res) => {
      const jobId = req.params.id; // Get the job ID from the request parameters
      const { email } = req.body; // Expecting the applicant's email in the request body

      if (!email) {
        return res
          .status(400)
          .send({ message: "Applicant's email is required." });
      }

      try {
        // Find the job by its ID and remove the applicant from the PeopleApplied array
        const query = { _id: new ObjectId(jobId) };

        // Update to pull the applicant based on email
        const update = {
          $pull: { PeopleApplied: { email } }, // Remove the applicant with matching email
        };

        const result = await PostedJobCollection.updateOne(query, update);

        // Check if any documents were updated
        if (result.modifiedCount > 0) {
          res.status(200).send({ message: "Applicant deleted successfully!" });
        } else {
          res.status(404).send({ message: "Job or applicant not found." });
        }
      } catch (error) {
        console.error("Error deleting applicant:", error);
        res.status(500).send({
          message: "An error occurred while deleting applicant.",
          error,
        });
      }
    });

    // Posted Gig API
    // Get Posted Gig
    app.get("/Posted-Gig", async (req, res) => {
      const { postedBy } = req.query; // Get the 'postedBy' email from query parameters

      try {
        let result;
        if (postedBy) {
          // If 'postedBy' is provided, filter results by the email
          result = await PostedGigCollection.find({
            PostedBy: postedBy,
          }).toArray();
        } else {
          // If no 'postedBy' is provided, return all gigs
          result = await PostedGigCollection.find().toArray();
        }
        res.send(result);
      } catch (error) {
        console.error("Error fetching posted gigs:", error);
        res.status(500).send({ message: "Error fetching posted gigs", error });
      }
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

    // Update Posted Job by ID
    app.put("/Posted-Gig/:id", async (req, res) => {
      const id = req.params.id; // Get the job ID from the request parameters
      const updatedData = req.body; // Data to update, sent from the client

      // Construct the query to find the job by its ID
      const query = { _id: new ObjectId(id) };

      // Construct the update object with the updated job data
      const update = {
        $set: updatedData, // Use $set to update the fields in the job document
      };

      try {
        // Perform the update in the database
        const result = await PostedGigCollection.updateOne(query, update);

        // Check if the update was successful
        if (result.modifiedCount > 0) {
          res.status(200).send({ message: "Gig updated successfully!" });
        } else {
          res
            .status(404)
            .send({ message: "Gig not found or no changes made." });
        }
      } catch (error) {
        console.error("Error updating the job:", error);
        res.status(500).send({
          message: "An error occurred while updating the job.",
          error,
        });
      }
    });

    // Update Posted Gig State and Rating by ID
    app.patch("/Posted-Gig/:id", async (req, res) => {
      const gigId = req.params.id; // Get the gig ID from the request parameters
      const { state, rating } = req.body; // Destructure state and rating from the request body

      // Construct the query to find the gig by its ID
      const query = { _id: new ObjectId(gigId) };

      // Create an update object
      const update = {};

      // Only set the fields if they are provided
      if (state) {
        update.state = state;
      }
      if (rating) {
        update.rating = rating;
      }

      // Update the gig document
      try {
        const result = await PostedGigCollection.updateOne(query, {
          $set: update,
        });

        // Check if any documents were modified
        if (result.modifiedCount > 0) {
          res.status(200).send({
            message: "Gig updated successfully!",
            updatedFields: update,
          });
        } else {
          res
            .status(404)
            .send({ message: "Gig not found or no changes made." });
        }
      } catch (error) {
        console.error("Error updating gig:", error);
        res.status(500).send({
          message: "An error occurred while updating the gig.",
          error,
        });
      }
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

    // Delete a specific applicant from the peopleBided array
    app.delete("/Posted-Gig/:id/bidder", async (req, res) => {
      const gigId = req.params.id; // Get the gig ID from the request parameters
      const { email } = req.body; // Expecting the bidder's email in the request body

      // Validate the input
      if (!email) {
        return res.status(400).send({ message: "Bidder's email is required." });
      }

      try {
        // Construct the query to find the gig by its ID
        const query = { _id: new ObjectId(gigId) };

        // Update to pull the bidder based on email
        const update = {
          $pull: { peopleBided: { biderEmail: email } }, // Remove the bidder with matching email
        };

        // Execute the update operation
        const result = await PostedGigCollection.updateOne(query, update);

        // Check if any documents were modified
        if (result.modifiedCount > 0) {
          res.status(200).send({ message: "Bidder deleted successfully!" });
        } else {
          res.status(404).send({ message: "Gig or bidder not found." });
        }
      } catch (error) {
        console.error("Error deleting bidder:", error);
        res.status(500).send({
          message: "An error occurred while deleting the bidder.",
          error,
        });
      }
    });

    // Company Profiles API
    // Get Company Profiles
    app.get("/Company-Profiles", async (req, res) => {
      const { postedBy } = req.query; // Get the 'postedBy' query parameter from the request

      let query = {}; // Initialize an empty query object

      // If a 'postedBy' query parameter exists, add it to the query object
      if (postedBy) {
        query = { postedBy };
      }

      try {
        const result = await CompanyProfilesCollection.find(query).toArray(); // Use the query object to find matching profiles
        res.send(result);
      } catch (error) {
        console.error("Error fetching company profiles:", error);
        res.status(500).send({ message: "Failed to fetch company profiles" });
      }
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

    // Update Company Profiles by ID
    app.put("/Company-Profiles/:id", async (req, res) => {
      const id = req.params.id; // Get the ID from the URL parameters
      const updatedCompanyProfile = req.body; // Get the updated data from the request body

      const query = { _id: new ObjectId(id) }; // Create a query object to find the specific company profile
      const update = {
        $set: updatedCompanyProfile, // Use the $set operator to update the fields
      };

      try {
        const result = await CompanyProfilesCollection.updateOne(query, update); // Update the company profile in the database

        if (result.modifiedCount === 1) {
          // If one document was modified, return a success message
          res.send({ message: "Company profile updated successfully." });
        } else {
          // If no documents were modified, return an error message
          res.status(404).send({ message: "Company profile not found." });
        }
      } catch (error) {
        console.error("Error updating company profile:", error);
        res.status(500).send({ message: "Failed to update company profile" });
      }
    });

    // Post Company Profiles
    app.post("/Company-Profiles", async (req, res) => {
      const request = req.body;
      const result = await CompanyProfilesCollection.insertOne(request);
      res.send(result);
    });

    // Delete Company Profiles by ID
    app.delete("/Company-Profiles/delete", async (req, res) => {
      const { profilesToDelete } = req.body; // Expecting an array of company profile IDs to delete

      // Validate the input
      if (!Array.isArray(profilesToDelete) || profilesToDelete.length === 0) {
        return res
          .status(400)
          .send({ message: "Invalid request. No profile IDs provided." });
      }

      try {
        // Convert profile IDs to ObjectId
        const objectIds = profilesToDelete.map((id) => new ObjectId(id));

        // Delete the profiles from the collection
        const result = await CompanyProfilesCollection.deleteMany({
          _id: { $in: objectIds },
        });

        // Check if any documents were deleted
        if (result.deletedCount > 0) {
          res.status(200).send({
            message: `${result.deletedCount} profile(s) deleted successfully!`,
          });
        } else {
          res.status(404).send({
            message: "No company profiles found with the provided IDs.",
          });
        }
      } catch (error) {
        console.error("Error deleting company profiles:", error);
        res.status(500).send({
          message: "An error occurred while deleting company profiles.",
          error,
        });
      }
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

    // Post Salary Insight
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
      try {
        const { postedBy } = req.query; // Extract 'postedBy' from query parameters
        let query = {}; // Initialize an empty query object

        // If postedBy is provided, filter the results
        if (postedBy) {
          query.postedBy = postedBy; // Add condition for postedBy
        }

        const result = await UpcomingEventsCollection.find(query).toArray(); // Pass the query to find
        res.send(result);
      } catch (error) {
        console.error("Error fetching upcoming events:", error);
        res.status(500).send("Internal Server Error");
      }
    });

    // Get Posed Upcoming Events by ID
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

    // Apply for a Posted Job (update ParticipantApplications array)
    app.post("/Upcoming-Events/:id/apply", async (req, res) => {
      const id = req.params.id; // Get the event ID from the request params
      const applicantData = req.body; // Applicant data sent from the frontend

      // Construct the query to find the event by ID
      const query = { _id: new ObjectId(id) };

      // Define the update to push the applicant data to ParticipantApplications array
      const update = {
        $push: {
          ParticipantApplications: applicantData,
        },
      };

      try {
        // Update the event document with the new applicant data
        const result = await UpcomingEventsCollection.updateOne(query, update);

        // Check if the event was updated
        if (result.modifiedCount > 0) {
          res
            .status(200)
            .send({ message: "Application submitted successfully!" });
        } else {
          res
            .status(404)
            .send({ message: "Event not found or no changes made." });
        }
      } catch (error) {
        console.error("Error applying for the event:", error);
        res
          .status(500)
          .send({ message: "Error applying for the event", error });
      }
    });

    // Post Upcoming Events
    app.post("/Upcoming-Events", async (req, res) => {
      const request = req.body;
      const result = await UpcomingEventsCollection.insertOne(request);
      res.send(result);
    });

    // Update an Upcoming Event by ID
    app.put("/Upcoming-Events/:id", async (req, res) => {
      const id = req.params.id; // Get the event ID from the request params
      const updateData = req.body; // Updated data sent from the frontend

      // Construct the query to find the event by ID
      const query = { _id: new ObjectId(id) };

      try {
        // Update the event document with the new data
        const result = await UpcomingEventsCollection.updateOne(query, {
          $set: updateData,
        });

        // Check if the event was updated
        if (result.modifiedCount > 0) {
          res.status(200).send({ message: "Event updated successfully!" });
        } else {
          res
            .status(404)
            .send({ message: "Event not found or no changes made." });
        }
      } catch (error) {
        console.error("Error updating the event:", error);
        res.status(500).send({ message: "Error updating the event", error });
      }
    });

    // Update Participant's State by applicantEmail
    app.put(
      "/Upcoming-Events/:eventId/participants/:applicantEmail",
      async (req, res) => {
        const { eventId, applicantEmail } = req.params; // Get the event ID and applicant's email from the request params
        const { applicantState } = req.body; // Expecting only the updated applicant state in the request body

        // Query to find the event and the specific participant by email
        const query = {
          _id: new ObjectId(eventId),
          "ParticipantApplications.applicantEmail": applicantEmail,
        };

        // Update the applicant's state only
        const update = {
          $set: {
            "ParticipantApplications.$.applicantState": applicantState, // Update only applicantState
          },
        };

        try {
          // Update the participant's application within the event document
          const result = await UpcomingEventsCollection.updateOne(
            query,
            update
          );

          if (result.modifiedCount > 0) {
            res
              .status(200)
              .send({ message: "Participant state updated successfully!" });
          } else {
            res
              .status(404)
              .send({ message: "Participant or Event not found." });
          }
        } catch (error) {
          console.error("Error updating participant state:", error);
          res
            .status(500)
            .send({ message: "Error updating participant state", error });
        }
      }
    );

    // Delete an Upcoming Event by ID
    app.delete("/Upcoming-Events/:id", async (req, res) => {
      const id = req.params.id; // Get the event ID from the request parameters
      const query = { _id: new ObjectId(id) }; // Construct the query to find the event by ID

      try {
        // Delete the event document from the collection
        const result = await UpcomingEventsCollection.deleteOne(query);

        // Check if the event was deleted
        if (result.deletedCount > 0) {
          res.status(200).send({ message: "Event deleted successfully!" });
        } else {
          res
            .status(404)
            .send({ message: "Event not found or already deleted." });
        }
      } catch (error) {
        console.error("Error deleting the event:", error);
        res.status(500).send({ message: "Error deleting the event", error });
      }
    });
    // Delete a Participant
    app.delete(
      "/Upcoming-Events/:eventId/participants/:applicantEmail",
      async (req, res) => {
        const { eventId, applicantEmail } = req.params; // Use applicantEmail instead of participantId

        const query = { _id: new ObjectId(eventId) };
        const update = {
          $pull: {
            ParticipantApplications: { applicantEmail: applicantEmail }, // Remove participant by email
          },
        };

        try {
          const result = await UpcomingEventsCollection.updateOne(
            query,
            update
          );

          if (result.modifiedCount > 0) {
            res
              .status(200)
              .send({ message: "Participant deleted successfully!" });
          } else {
            res
              .status(404)
              .send({ message: "Participant or Event not found." });
          }
        } catch (error) {
          console.error("Error deleting participant:", error);
          res
            .status(500)
            .send({ message: "Error deleting participant", error });
        }
      }
    );

    // Courses API
    // Get Courses
    app.get("/Courses", async (req, res) => {
      const { postedBy, email } = req.query;

      let query = {};

      // If the postedBy parameter is provided, filter by postedBy
      if (postedBy) {
        query.postedBy = postedBy;
      }

      // If the email parameter is provided, filter by applicant email
      if (email) {
        query["applicants.applicantEmail"] = email;
      }

      try {
        const result = await CoursesCollection.find(query).toArray();
        res.send(result);
      } catch (error) {
        console.error("Error fetching courses:", error);
        res.status(500).send("Error fetching courses");
      }
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
    // Post Courses
    app.post("/Courses", async (req, res) => {
      const request = req.body;
      const result = await CoursesCollection.insertOne(request);
      res.send(result);
    });

    // Update a Course by ID
    app.put("/Courses/:id", async (req, res) => {
      const id = req.params.id; // Get the course ID from the request params
      const updateData = req.body; // Updated data sent from the frontend

      // Construct the query to find the course by ID
      const query = { _id: new ObjectId(id) };

      try {
        // Update the course document with the new data
        const result = await CoursesCollection.updateOne(query, {
          $set: updateData,
        });

        // Check if the course was updated
        if (result.modifiedCount > 0) {
          res.status(200).send({ message: "Course updated successfully!" });
        } else {
          res
            .status(404)
            .send({ message: "Course not found or no changes made." });
        }
      } catch (error) {
        console.error("Error updating the course:", error);
        res.status(500).send({ message: "Error updating the course", error });
      }
    });

    // Delete an Courses by ID
    app.delete("/Courses/:id", async (req, res) => {
      const id = req.params.id; // Get the event ID from the request parameters
      const query = { _id: new ObjectId(id) }; // Construct the query to find the event by ID

      try {
        // Delete the event document from the collection
        const result = await CoursesCollection.deleteOne(query);

        // Check if the event was deleted
        if (result.deletedCount > 0) {
          res.status(200).send({ message: "Event deleted successfully!" });
        } else {
          res
            .status(404)
            .send({ message: "Event not found or already deleted." });
        }
      } catch (error) {
        console.error("Error deleting the event:", error);
        res.status(500).send({ message: "Error deleting the event", error });
      }
    });
    // Delete a Participant by Email from a Specific Course
    app.delete("/Courses/:id/participants/:email", async (req, res) => {
      const courseId = req.params.id; // Course ID from the request params
      const participantEmail = req.params.email; // Participant email from the request params

      // Construct the query to find the course by ID
      const query = { _id: new ObjectId(courseId) };

      // Define the update to remove the participant with the given email from the applicants array
      const update = {
        $pull: {
          applicants: { applicantEmail: participantEmail },
        },
      };

      try {
        // Update the course document by pulling the participant from the applicants array
        const result = await CoursesCollection.updateOne(query, update);

        // Check if a participant was removed
        if (result.modifiedCount > 0) {
          res
            .status(200)
            .send({ message: "Participant removed successfully!" });
        } else {
          res
            .status(404)
            .send({ message: "Participant not found or no changes made." });
        }
      } catch (error) {
        console.error("Error deleting the participant:", error);
        res
          .status(500)
          .send({ message: "Error deleting the participant", error });
      }
    });

    // Mentorship API
    // Get Mentorship
    app.get("/Mentorship", async (req, res) => {
      const postedBy = req.query.postedBy; // Get the postedBy email from the query parameters

      // If postedBy is provided, filter by the email; otherwise, return all mentorships
      const query = postedBy ? { postedBy: postedBy } : {};

      try {
        const result = await MentorshipCollection.find(query).toArray();
        res.send(result);
      } catch (error) {
        console.error("Error fetching mentorships: ", error);
        res.status(500).send("Server error.");
      }
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

    // Post Mentorship
    app.post("/Mentorship", async (req, res) => {
      const request = req.body;
      const result = await MentorshipCollection.insertOne(request);
      res.send(result);
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

    // Update a Mentorship by ID
    app.put("/Mentorship/:id", async (req, res) => {
      const id = req.params.id; // Get the mentorship ID from the request parameters
      const updateData = req.body; // Get the updated data sent from the frontend

      // Construct the query to find the mentorship by ID
      const query = { _id: new ObjectId(id) };

      // Define the update operation
      const update = {
        $set: updateData, // Set the new values based on the updateData object
      };

      try {
        // Update the mentorship document with the new data
        const result = await MentorshipCollection.updateOne(query, update);

        // Check if the mentorship was updated
        if (result.modifiedCount > 0) {
          res.status(200).send({ message: "Mentorship updated successfully!" });
        } else {
          res
            .status(404)
            .send({ message: "Mentorship not found or no changes made." });
        }
      } catch (error) {
        console.error("Error updating mentorship:", error);
        res.status(500).send({ message: "Error updating mentorship", error });
      }
    });

    // Delete an Mentorship by ID
    app.delete("/Mentorship/:id", async (req, res) => {
      const id = req.params.id; // Get the event ID from the request parameters
      const query = { _id: new ObjectId(id) }; // Construct the query to find the event by ID

      try {
        // Delete the event document from the collection
        const result = await MentorshipCollection.deleteOne(query);

        // Check if the event was deleted
        if (result.deletedCount > 0) {
          res.status(200).send({ message: "Event deleted successfully!" });
        } else {
          res
            .status(404)
            .send({ message: "Event not found or already deleted." });
        }
      } catch (error) {
        console.error("Error deleting the event:", error);
        res.status(500).send({ message: "Error deleting the event", error });
      }
    });
    // Delete a review by reviewerEmail from a specific mentorship post
    app.delete("/Mentorship/reviews/:id", async (req, res) => {
      const mentorshipId = req.params.id; // Get the mentorship post ID from the request params
      const { reviewerEmail } = req.body; // Get the reviewer's email from the request body

      try {
        // Find the mentorship post and remove the review from the reviews array
        const query = { _id: new ObjectId(mentorshipId) };
        const update = {
          $pull: {
            reviews: { reviewerEmail }, // Remove the review where the reviewerEmail matches
          },
        };

        const result = await MentorshipCollection.updateOne(query, update);

        if (result.modifiedCount > 0) {
          res.status(200).send({ message: "Review deleted successfully!" });
        } else {
          res
            .status(404)
            .send({ message: "Review not found or no changes made." });
        }
      } catch (error) {
        console.error("Error deleting the review:", error);
        res.status(500).send({ message: "Error deleting the review", error });
      }
    });
    // Delete an applicant by applicantEmail from a specific mentorship post
    app.delete("/Mentorship/applicants/:id", async (req, res) => {
      const mentorshipId = req.params.id; // Get the mentorship post ID from the request params
      const { applicantEmail } = req.body; // Get the applicant's email from the request body

      try {
        // Find the mentorship post and remove the applicant from the applicant array
        const query = { _id: new ObjectId(mentorshipId) };
        const update = {
          $pull: {
            applicant: { applicantEmail }, // Remove the applicant where the applicantEmail matches
          },
        };

        const result = await MentorshipCollection.updateOne(query, update);

        if (result.modifiedCount > 0) {
          res.status(200).send({ message: "Applicant deleted successfully!" });
        } else {
          res
            .status(404)
            .send({ message: "Applicant not found or no changes made." });
        }
      } catch (error) {
        console.error("Error deleting the applicant:", error);
        res
          .status(500)
          .send({ message: "Error deleting the applicant", error });
      }
    });

    // Internship API
    // Get Internship by postedBy email
    app.get("/Internship", async (req, res) => {
      const { postedBy } = req.query; // Get the postedBy query parameter

      // If postedBy is provided, filter by that email, otherwise return all internships
      let query = {};
      if (postedBy) {
        query.postedBy = postedBy; // Filter based on postedBy email
      }

      try {
        const result = await InternshipCollection.find(query).toArray();
        res.send(result);
      } catch (error) {
        res.status(500).send({ message: "Error fetching internships", error });
      }
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

    // Post Internship
    app.post("/Internship", async (req, res) => {
      const request = req.body;
      const result = await InternshipCollection.insertOne(request);
      res.send(result);
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

    // Update an Internship by ID
    app.put("/Internship/:id", async (req, res) => {
      const id = req.params.id; // Get the internship ID from the request parameters
      const updateData = req.body; // Get the updated data sent from the frontend

      // Construct the query to find the internship by ID
      const query = { _id: new ObjectId(id) };

      // Define the update operation
      const update = {
        $set: updateData, // Set the new values based on the updateData object
      };

      try {
        // Update the internship document with the new data
        const result = await InternshipCollection.updateOne(query, update);

        // Check if the internship was updated successfully
        if (result.modifiedCount > 0) {
          res.status(200).send({ message: "Internship updated successfully!" });
        } else {
          res
            .status(404)
            .send({ message: "Internship not found or no changes made." });
        }
      } catch (error) {
        console.error("Error updating internship:", error);
        res.status(500).send({ message: "Error updating internship", error });
      }
    });

    // Delete an Internship by ID
    app.delete("/Internship/:id", async (req, res) => {
      const id = req.params.id; // Get the event ID from the request parameters
      const query = { _id: new ObjectId(id) }; // Construct the query to find the event by ID

      try {
        // Delete the event document from the collection
        const result = await InternshipCollection.deleteOne(query);

        // Check if the event was deleted
        if (result.deletedCount > 0) {
          res.status(200).send({ message: "Event deleted successfully!" });
        } else {
          res
            .status(404)
            .send({ message: "Event not found or already deleted." });
        }
      } catch (error) {
        console.error("Error deleting the event:", error);
        res.status(500).send({ message: "Error deleting the event", error });
      }
    });
    // Delete an Applicant from a Posted Internship by ID
    app.delete("/Internship/applicants/:id", async (req, res) => {
      const id = req.params.id; // Get the internship ID from the request parameters
      const { applicantEmail } = req.body; // Get the applicant email from the request body

      if (!applicantEmail) {
        return res
          .status(400)
          .send({ message: "Applicant email is required." });
      }

      const query = { _id: new ObjectId(id) }; // Construct the query to find the internship by ID

      // Define the update to pull the applicant from the applicants array
      const update = {
        $pull: {
          applicants: { email: applicantEmail }, // Match by 'email' field, not 'applicantEmail'
        },
      };

      try {
        // Update the internship document by removing the applicant
        const result = await InternshipCollection.updateOne(query, update);

        // Check if the applicant was removed
        if (result.modifiedCount > 0) {
          res.status(200).send({ message: "Applicant removed successfully!" });
        } else {
          res
            .status(404)
            .send({ message: "Internship not found or no changes made." });
        }
      } catch (error) {
        console.error("Error removing the applicant:", error);
        res
          .status(500)
          .send({ message: "Error removing the applicant", error });
      }
    });

    // NewsLetter API
    // Get NewsLetter
    app.get("/NewsLetter", async (req, res) => {
      const result = await NewsLetterCollection.find().toArray();
      res.send(result);
    });
    // Total Posted NewsLetter Count API
    app.get("/NewsLetterCount", async (req, res) => {
      const count = await NewsLetterCollection.countDocuments();
      res.json({ count });
    });

    // Post new NewsLetter
    app.post("/NewsLetter", async (req, res) => {
      const request = req.body;
      const result = await NewsLetterCollection.insertOne(request);
      res.send(result);
    });

    // Delete an Internship by ID
    app.delete("/NewsLetter/:id", async (req, res) => {
      const id = req.params.id; // Get the event ID from the request parameters
      const query = { _id: new ObjectId(id) }; // Construct the query to find the event by ID

      try {
        // Delete the event document from the collection
        const result = await NewsLetterCollection.deleteOne(query);

        // Check if the event was deleted
        if (result.deletedCount > 0) {
          res.status(200).send({ message: "Event deleted successfully!" });
        } else {
          res
            .status(404)
            .send({ message: "Event not found or already deleted." });
        }
      } catch (error) {
        console.error("Error deleting the event:", error);
        res.status(500).send({ message: "Error deleting the event", error });
      }
    });

    // Testimonials API
    // Get Testimonials, with optional query by postedBy
    app.get("/Testimonials", async (req, res) => {
      const { postedBy } = req.query; // Extract 'postedBy' from query parameters

      let query = {};

      // If 'postedBy' is present in the query, add it to the filter
      if (postedBy) {
        query.postedBy = postedBy;
      }

      try {
        const result = await TestimonialsCollection.find(query).toArray();
        res.send(result);
      } catch (error) {
        console.error("Error fetching testimonials:", error);
        res.status(500).send("Error fetching testimonials");
      }
    });
    // Total Posted Testimonials Count API
    app.get("/TestimonialsCount", async (req, res) => {
      const count = await TestimonialsCollection.countDocuments();
      res.json({ count });
    });

    // Post new Testimonials
    app.post("/Testimonials", async (req, res) => {
      const request = req.body;
      const result = await TestimonialsCollection.insertOne(request);
      res.send(result);
    });

    // Update an existing Testimonial by ID
    app.put("/Testimonials/:id", async (req, res) => {
      const id = req.params.id; // Get the testimonial ID from the request parameters
      const updatedData = req.body; // Get the updated data from the request body

      const query = { _id: new ObjectId(id) }; // Construct the query to find the testimonial by ID
      const updateDocument = {
        $set: updatedData, // Update the testimonial with the new data
      };

      try {
        // Update the testimonial document in the collection
        const result = await TestimonialsCollection.updateOne(
          query,
          updateDocument
        );

        // Check if the testimonial was updated
        if (result.modifiedCount > 0) {
          res
            .status(200)
            .send({ message: "Testimonial updated successfully!" });
        } else {
          res
            .status(404)
            .send({ message: "Testimonial not found or no changes made." });
        }
      } catch (error) {
        console.error("Error updating the testimonial:", error);
        res
          .status(500)
          .send({ message: "Error updating the testimonial", error });
      }
    });
    // Delete an Testimonials by ID
    app.delete("/Testimonials/:id", async (req, res) => {
      const id = req.params.id; // Get the event ID from the request parameters
      const query = { _id: new ObjectId(id) }; // Construct the query to find the event by ID

      try {
        // Delete the event document from the collection
        const result = await TestimonialsCollection.deleteOne(query);

        // Check if the event was deleted
        if (result.deletedCount > 0) {
          res.status(200).send({ message: "Event deleted successfully!" });
        } else {
          res
            .status(404)
            .send({ message: "Event not found or already deleted." });
        }
      } catch (error) {
        console.error("Error deleting the event:", error);
        res.status(500).send({ message: "Error deleting the event", error });
      }
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
      const { postedBy } = req.query; // Extract the postedBy query parameter

      try {
        let result;

        if (postedBy) {
          // If postedBy is provided, filter the results
          result = await BlogsCollection.find({ postedBy }).toArray();
        } else {
          // If not provided, return all blogs
          result = await BlogsCollection.find().toArray();
        }

        res.send(result);
      } catch (error) {
        console.error("Error fetching blogs:", error);
        res.status(500).send("Internal Server Error");
      }
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
    // Post Blogs
    app.post("/Blogs", async (req, res) => {
      const request = req.body;
      const result = await BlogsCollection.insertOne(request);
      res.send(result);
    });

    // Update Blog by ID
    app.put("/Blogs/:id", async (req, res) => {
      const id = req.params.id; // Get the blog ID from the URL params
      const updatedBlog = req.body; // Blog update data from the request body

      try {
        const query = { _id: new ObjectId(id) };
        const update = {
          $set: updatedBlog, // Update the blog with the new data
        };

        // Update the blog in the database
        const result = await BlogsCollection.updateOne(query, update);

        if (result.matchedCount > 0) {
          res.status(200).json({ message: "Blog updated successfully" });
        } else {
          res.status(404).json({ message: "Blog not found" });
        }
      } catch (error) {
        console.error("Error updating blog:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    });

    // Delete an Blogs by ID
    app.delete("/Blogs/:id", async (req, res) => {
      const id = req.params.id; // Get the event ID from the request parameters
      const query = { _id: new ObjectId(id) }; // Construct the query to find the event by ID

      try {
        // Delete the event document from the collection
        const result = await BlogsCollection.deleteOne(query);

        // Check if the event was deleted
        if (result.deletedCount > 0) {
          res.status(200).send({ message: "Event deleted successfully!" });
        } else {
          res
            .status(404)
            .send({ message: "Event not found or already deleted." });
        }
      } catch (error) {
        console.error("Error deleting the event:", error);
        res.status(500).send({ message: "Error deleting the event", error });
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
