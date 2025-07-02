const express = require("express");
const router = express.Router();
const { client } = require("../config/db");
const { ObjectId } = require("mongodb");

const InternshipCollection = client
  .db("Master-Job-Shop")
  .collection("Internship");

// Get Internship(s)
app.get("/Internship", async (req, res) => {
  const { id, postedBy } = req.query;

  let query = {};

  if (id) {
    try {
      query._id = new ObjectId(id);
    } catch {
      return res.status(400).send({ message: "Invalid id format." });
    }
  } else if (postedBy) {
    query.postedBy = postedBy;
  }

  try {
    const results = await InternshipCollection.find(query).toArray();

    if (results.length === 1) {
      return res.send(results[0]); // Send single object if only one found
    } else {
      return res.send(results); // Send array if 0 or more than 1 found
    }
  } catch (error) {
    console.error("Error fetching internships:", error);
    res.status(500).send({ message: "Error fetching internships", error });
  }
});

// Total Posted Internship Count
app.get("/InternshipCount", async (req, res) => {
  try {
    const count = await InternshipCollection.countDocuments();
    res.json({ count });
  } catch (error) {
    console.error("Error counting internships:", error);
    res.status(500).json({ message: "Error counting internships", error });
  }
});

// Post a new Internship
app.post("/Internship", async (req, res) => {
  try {
    const request = req.body;
    const result = await InternshipCollection.insertOne(request);
    res.status(201).send(result);
  } catch (error) {
    console.error("Error posting internship:", error);
    res.status(500).send({ message: "Error posting internship", error });
  }
});

// Apply for an Internship (push applicant data to applicants array)
app.post("/Internship/Apply/:id", async (req, res) => {
  const id = req.params.id; // Internship ID from URL params
  const applicantData = req.body; // Applicant data from request body

  const query = { _id: new ObjectId(id) };
  const update = {
    $push: { applicants: applicantData },
  };

  try {
    const result = await InternshipCollection.updateOne(query, update);

    if (result.modifiedCount > 0) {
      res.status(200).send({ message: "Application submitted successfully!" });
    } else {
      res
        .status(404)
        .send({ message: "Internship not found or no changes made." });
    }
  } catch (error) {
    console.error("Error applying for internship:", error);
    res.status(500).send({ message: "Error applying for internship", error });
  }
});

// Update an Internship by ID
app.put("/Internship/:id", async (req, res) => {
  const id = req.params.id;
  const updateData = req.body;

  try {
    const result = await InternshipCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

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
  const id = req.params.id;

  try {
    const result = await InternshipCollection.deleteOne({
      _id: new ObjectId(id),
    });

    if (result.deletedCount > 0) {
      res.status(200).send({ message: "Internship deleted successfully!" });
    } else {
      res
        .status(404)
        .send({ message: "Internship not found or already deleted." });
    }
  } catch (error) {
    console.error("Error deleting internship:", error);
    res.status(500).send({ message: "Error deleting internship", error });
  }
});

// Delete an Applicant from a Posted Internship by ID
app.delete("/Internship/Apply/:id", async (req, res) => {
  const id = req.params.id;
  const { applicantEmail } = req.body;

  if (!applicantEmail) {
    return res.status(400).send({ message: "Applicant email is required." });
  }

  try {
    const result = await InternshipCollection.updateOne(
      { _id: new ObjectId(id) },
      { $pull: { applicants: { applicantEmail } } } // Match the field name properly
    );

    if (result.modifiedCount > 0) {
      res.status(200).send({ message: "Applicant removed successfully!" });
    } else {
      res.status(404).send({ message: "Internship or applicant not found." });
    }
  } catch (error) {
    console.error("Error removing applicant:", error);
    res.status(500).send({ message: "Error removing applicant", error });
  }
});

module.exports = router;