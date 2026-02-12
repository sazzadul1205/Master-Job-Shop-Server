const express = require("express");
const router = express.Router();
const { client } = require("../../config/db");
const { ObjectId } = require("mongodb");

// Collection for Employers
const EmployersCollection = client
  .db("Master-Job-Shop")
  .collection("Employers");

// GET - Fetch all employers or a single one by _id or email
router.get("/", async (req, res) => {
  const { id, email } = req.query;

  let query = {};

  // Filter by _id if provided
  if (id) {
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid job ID." });
    }
    query._id = new ObjectId(id);
  }

  // Filter by email if provided
  if (email) {
    query.email = email;
  }

  try {
    const results = await EmployersCollection.find(query).toArray();

    if (results.length === 1) {
      res.send(results[0]); // Send single object if only one found
    } else {
      res.send(results); // Otherwise send array
    }
  } catch (error) {
    console.error("Error fetching company profiles:", error);
    res
      .status(500)
      .send({ message: "Failed to fetch company profiles", error });
  }
});

// POST - Add a new employer
router.post("/", async (req, res) => {
  try {
    const employerData = req.body;

    if (!employerData?.email) {
      return res.status(400).json({ message: "Email is required" });
    }

    employerData.createdAt = new Date();

    const result = await EmployersCollection.insertOne(employerData);
    res.status(201).json(result);
  } catch (error) {
    console.error("Error adding employer:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// PUT - Update an employer by ID
router.put("/:id", async (req, res) => {
  try {
    const id = req.params.id;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid ID" });
    }

    const updateData = req.body;

    // Optional: prevent overwriting createdAt accidentally
    delete updateData.createdAt;

    // Ensure updatedAt is set
    updateData.updatedAt = new Date();

    const result = await EmployersCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: "Employer not found" });
    }

    res.status(200).json({ message: "Employer updated successfully" });
  } catch (error) {
    console.error("Error updating employer:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// DELETE - Remove an employer by ID
router.delete("/:id", async (req, res) => {
  try {
    const id = req.params.id;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid ID" });
    }

    const result = await EmployersCollection.deleteOne({
      _id: new ObjectId(id),
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "Employer not found" });
    }

    res.status(200).json({ message: "Employer deleted successfully" });
  } catch (error) {
    console.error("Error deleting employer:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
