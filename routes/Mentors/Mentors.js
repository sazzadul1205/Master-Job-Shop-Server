const express = require("express");
const router = express.Router();
const { client } = require("../../config/db");
const { ObjectId } = require("mongodb");

// Collection for Mentors
const MentorsCollection = client.db("Master-Job-Shop").collection("Mentors");

// GET - Fetch all mentors
router.get("/", async (req, res) => {
  try {
    // Extract query parameters from the request
    const { id, email } = req.query;

    // Initialize an empty query object to store filter conditions
    let query = {};

    // Check if id is provided in the query parameters
    if (id) {
      // Validate the id format using ObjectId.isValid()
      if (!ObjectId.isValid(id)) {
        // Return a 400 error if the id format is invalid
        return res.status(400).json({ message: "Invalid ID format" });
      }
      // Add the id to the query object
      query._id = new ObjectId(id);
    }

    // Check if email is provided in the query parameters
    if (email) {
      // Add the email to the query object
      query.email = email;
    }

    // Use the query object to filter the mentors
    const mentors = await MentorsCollection.find(query).toArray();

    // If the length of the mentors array is 1, send the object instead of the array
    if (mentors.length === 1) {
      res.status(200).json(mentors[0]);
    } else {
      res.status(200).json(mentors);
    }
    // Return the filtered mentors with a 200 status code
    res.status(200).json(mentors);
  } catch (error) {
    // Log any errors that occur during the query
    console.error("Error fetching Mentors:", error);
    // Return a 500 error with a generic error message
    res.status(500).json({ message: "Internal server error." });
  }
});

// POST - Create a new mentor
router.post("/", async (req, res) => {
  try {
    // Get the mentor data from the request body
    const mentorData = req.body;

    // Check if the email is provided in the request body
    if (!mentorData?.email) {
      // Return a 400 error if the email is not provided
      return res.status(400).json({ message: "Email is required" });
    }

    // Add a createdAt field to the mentor data with the current date and time
    mentorData.createdAt = new Date();

    // Insert the mentor data into the Mentors collection
    const result = await MentorsCollection.insertOne(mentorData);

    // Return a 201 success response with the result
    res.status(201).json(result);
  } catch (error) {
    // Log any errors that occur during the request
    console.error("Error adding mentor:", error);

    // Return a 500 error response with a generic error message
    res.status(500).json({ message: "Internal server error" });
  }
});

// DELETE - Delete a mentor by ID
router.delete("/:id", async (req, res) => {
  try {
    // Extract the ID from the URL parameter
    const id = req.params.id;

    // Validate the ID format using ObjectId.isValid()
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid ID format" });
    }

    // Delete the mentor document from the database
    const result = await EmployersCollection.deleteOne({
      _id: new ObjectId(id),
    });

    // Check if the delete was successful
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "Mentor not found" });
    }

    // Return a 200 status code with a success message
    res.status(200).json({ message: "Mentor deleted successfully" });
  } catch (error) {
    console.error("Error deleting mentor:", error);
    res.status(500).json({ message: "Internal server error." });
  }
});

module.exports = router;
