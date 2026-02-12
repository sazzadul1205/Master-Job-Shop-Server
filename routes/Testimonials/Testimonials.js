const express = require("express");
const router = express.Router();
const { client } = require("../../config/db");
const { ObjectId } = require("mongodb");

const TestimonialsCollection = client
  .db("Master-Job-Shop")
  .collection("Testimonials");

// GET Testimonials 
router.get("/", async (req, res) => {
  const { postedBy, id } = req.query;

  let query = {};
  if (postedBy) {
    query.postedBy = postedBy;
  }
  if (id) {
    try {
      query._id = new ObjectId(id);
    } catch (e) {
      return res.status(400).send({ message: "Invalid ID format." });
    }
  }

  try {
    const result = await TestimonialsCollection.find(query).toArray();
    res.send(result.length === 1 ? result[0] : result);
  } catch (error) {
    console.error("Error fetching testimonials:", error);
    res.status(500).send({ message: "Error fetching testimonials", error });
  }
});

// GET Total Testimonials Count
router.get("/TestimonialsCount", async (req, res) => {
  try {
    const count = await TestimonialsCollection.countDocuments();
    res.json({ count });
  } catch (error) {
    console.error("Error counting testimonials:", error);
    res.status(500).send({ message: "Error counting testimonials", error });
  }
});

// POST a new Testimonial
router.post("/", async (req, res) => {
  const request = req.body;
  try {
    const result = await TestimonialsCollection.insertOne(request);
    res
      .status(201)
      .send({ message: "Testimonial created successfully!", result });
  } catch (error) {
    console.error("Error creating testimonial:", error);
    res.status(500).send({ message: "Error creating testimonial", error });
  }
});

// PUT Testimonial by ID
router.put("/:id", async (req, res) => {
  const id = req.params.id;
  const updatedData = req.body;

  let query;
  try {
    query = { _id: new ObjectId(id) };
  } catch {
    return res.status(400).send({ message: "Invalid ID format." });
  }

  try {
    const result = await TestimonialsCollection.updateOne(query, {
      $set: updatedData,
    });

    if (result.modifiedCount > 0) {
      res.status(200).send({ message: "Testimonial updated successfully!" });
    } else {
      res
        .status(404)
        .send({ message: "Testimonial not found or no changes made." });
    }
  } catch (error) {
    console.error("Error updating testimonial:", error);
    res.status(500).send({ message: "Error updating testimonial", error });
  }
});

// DELETE Testimonial by ID
router.delete("/:id", async (req, res) => {
  const id = req.params.id;

  let query;
  try {
    query = { _id: new ObjectId(id) };
  } catch {
    return res.status(400).send({ message: "Invalid ID format." });
  }

  try {
    const result = await TestimonialsCollection.deleteOne(query);

    if (result.deletedCount > 0) {
      res.status(200).send({ message: "Testimonial deleted successfully!" });
    } else {
      res
        .status(404)
        .send({ message: "Testimonial not found or already deleted." });
    }
  } catch (error) {
    console.error("Error deleting testimonial:", error);
    res.status(500).send({ message: "Error deleting testimonial", error });
  }
});

module.exports = router;
