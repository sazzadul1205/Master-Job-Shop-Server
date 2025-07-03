const express = require("express");
const router = express.Router();
const { client } = require("../../config/db");
const { ObjectId } = require("mongodb");

const CompanyCollection = client
  .db("Master-Job-Shop")
  .collection("Company-Profiles");

// Get Company Profiles
router.get("/Company", async (req, res) => {
  const { id, email, postedBy } = req.query;

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

  // Filter by postedBy if provided
  if (postedBy) {
    query.postedBy = postedBy;
  }

  try {
    const results = await CompanyCollection.find(query).toArray();

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

// Total Posted Company Profile Count API
router.get("/CompanyCount", async (req, res) => {
  try {
    const count = await CompanyCollection.countDocuments();
    res.json({ count });
  } catch (error) {
    console.error("Error counting company profiles:", error);
    res
      .status(500)
      .json({ message: "Failed to get company profiles count", error });
  }
});

// Get Company Basic Info
router.get("/CompanyBasicInfo", async (req, res) => {
  const { id } = req.query;

  // Basic info projection
  const projection = {
    companyName: 1,
    companyCode: 1,
    location: 1,
    industry: 1,
    website: 1,
    postedBy: 1,
    logo: 1,
    description: 1,
  };

  try {
    if (id) {
      if (!ObjectId.isValid(id)) {
        return res.status(400).send({ message: "Invalid company ID" });
      }

      // Try to find one company by ID
      const result = await CompanyCollection.findOne(
        { _id: new ObjectId(id) },
        { projection }
      );

      if (!result) {
        return res.status(404).send({ message: "Company not found" });
      }

      return res.send(result);
    } else {
      // No ID, get all companies with projection
      const results = await CompanyCollection.find(
        {},
        { projection }
      ).toArray();

      if (results.length === 1) {
        // If exactly one document, send object
        return res.send(results[0]);
      } else {
        // Otherwise send array (can be empty or multiple)
        return res.send(results);
      }
    }
  } catch (error) {
    console.error("Failed to fetch company profiles basic info:", error);
    return res
      .status(500)
      .send({ message: "Failed to fetch company profiles", error });
  }
});

// Post Company Profile
router.post("/Company", async (req, res) => {
  const newProfile = req.body;

  // Basic validation (adjust or expand as needed)
  if (!newProfile || Object.keys(newProfile).length === 0) {
    return res.status(400).send({ message: "Request body cannot be empty." });
  }

  try {
    const result = await CompanyCollection.insertOne(newProfile);
    res.status(201).send({
      message: "Company profile created successfully.",
      insertedId: result.insertedId,
    });
  } catch (error) {
    console.error("Error creating company profile:", error);
    res
      .status(500)
      .send({ message: "Failed to create company profile.", error });
  }
});

// Update Company Profile by ID
router.put("/Company/:id", async (req, res) => {
  const id = req.params.id;
  const updatedCompanyProfile = req.body;

  if (!ObjectId.isValid(id)) {
    return res.status(400).send({ message: "Invalid company profile ID." });
  }

  if (
    !updatedCompanyProfile ||
    Object.keys(updatedCompanyProfile).length === 0
  ) {
    return res.status(400).send({ message: "No update data provided." });
  }

  const query = { _id: new ObjectId(id) };
  const update = { $set: updatedCompanyProfile };

  try {
    const result = await CompanyCollection.updateOne(query, update);

    if (result.matchedCount === 0) {
      return res.status(404).send({ message: "Company profile not found." });
    }

    if (result.modifiedCount === 0) {
      return res.status(200).send({
        message: "No changes detected; company profile remains the same.",
      });
    }

    res.status(200).send({ message: "Company profile updated successfully." });
  } catch (error) {
    console.error("Error updating company profile:", error);
    res
      .status(500)
      .send({ message: "Failed to update company profile", error });
  }
});

// Delete a single Company Profile by ID
router.delete("/Company/:id", async (req, res) => {
  const id = req.params.id;

  if (!id) {
    return res.status(400).send({ message: "Profile ID is required." });
  }

  try {
    const result = await CompanyCollection.deleteOne({
      _id: new ObjectId(id),
    });

    if (result.deletedCount === 1) {
      res
        .status(200)
        .send({ message: "Company profile deleted successfully." });
    } else {
      res.status(404).send({ message: "Company profile not found." });
    }
  } catch (error) {
    console.error("Error deleting company profile:", error);
    res.status(500).send({
      message: "An error occurred while deleting company profile.",
      error,
    });
  }
});

module.exports = router;
