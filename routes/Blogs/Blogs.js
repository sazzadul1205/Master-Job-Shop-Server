const express = require("express");
const router = express.Router();
const { client } = require("../../config/db");
const { ObjectId } = require("mongodb");

const BlogsCollection = client.db("Master-Job-Shop").collection("Blogs");

// Get Blogs (optionally filter by postedBy or id)
router.get("/", async (req, res) => {
  const { postedBy, id } = req.query;

  let query = {};

  if (postedBy) {
    query.postedBy = postedBy;
  }

  if (id) {
    try {
      query._id = new ObjectId(id);
    } catch (error) {
      return res.status(400).send({ message: "Invalid blog ID." });
    }
  }

  try {
    const result = await BlogsCollection.find(query).toArray();

    if (result.length === 1) {
      res.send(result[0]); // Return single object if only one found
    } else {
      res.send(result); // Otherwise return array
    }
  } catch (error) {
    console.error("Error fetching blogs:", error);
    res.status(500).send({ message: "Internal Server Error", error });
  }
});

// Total Posted Blogs Count API
router.get("/BlogsCount", async (req, res) => {
  try {
    const count = await BlogsCollection.countDocuments();
    res.status(200).json({ count });
  } catch (error) {
    console.error("Error counting blogs:", error);
    res.status(500).json({ message: "Failed to retrieve blog count.", error });
  }
});

// Update Blog by ID
router.put("/:id", async (req, res) => {
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

// POST: Vote on a blog (upvote/downvote)
router.post("/:id/vote", async (req, res) => {
  const id = req.params.id;
  const { type, email } = req.body;

  if (!type || !email) {
    return res
      .status(400)
      .json({ message: "Vote type and email are required" });
  }

  try {
    const blog = await BlogsCollection.findOne({ _id: new ObjectId(id) });

    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    // Clone fields with defaults
    const upVotes = blog.upVotes || 0;
    const downVotes = blog.downVotes || 0;
    const peopleUpVoted = blog.peopleUpVoted || [];
    const peopleDownVoted = blog.peopleDownVoted || [];

    let newUpVotes = upVotes;
    let newDownVotes = downVotes;

    let newPeopleUpVoted = [...peopleUpVoted];
    let newPeopleDownVoted = [...peopleDownVoted];

    if (type === "up") {
      if (newPeopleUpVoted.includes(email)) {
        newUpVotes -= 1;
        newPeopleUpVoted = newPeopleUpVoted.filter((e) => e !== email);
      } else {
        newUpVotes += 1;
        newPeopleUpVoted.push(email);
        if (newPeopleDownVoted.includes(email)) {
          newDownVotes -= 1;
          newPeopleDownVoted = newPeopleDownVoted.filter((e) => e !== email);
        }
      }
    } else if (type === "down") {
      if (newPeopleDownVoted.includes(email)) {
        newDownVotes -= 1;
        newPeopleDownVoted = newPeopleDownVoted.filter((e) => e !== email);
      } else {
        newDownVotes += 1;
        newPeopleDownVoted.push(email);
        if (newPeopleUpVoted.includes(email)) {
          newUpVotes -= 1;
          newPeopleUpVoted = newPeopleUpVoted.filter((e) => e !== email);
        }
      }
    } else {
      return res.status(400).json({ message: "Invalid vote type" });
    }

    // Update the blog vote fields
    await BlogsCollection.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          upVotes: newUpVotes,
          downVotes: newDownVotes,
          peopleUpVoted: newPeopleUpVoted,
          peopleDownVoted: newPeopleDownVoted,
        },
      }
    );

    res.status(200).json({ message: "Vote recorded successfully" });
  } catch (error) {
    console.error("Error updating vote:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
});

// POST: Create a new blog
router.post("/", async (req, res) => {
  try {
    const newBlog = {
      ...req.body,
      upVotes: 0,
      downVotes: 0,
      peopleUpVoted: [],
      peopleDownVoted: [],
      createdAt: new Date(),
    };

    const result = await BlogsCollection.insertOne(newBlog);
    res.status(201).json({
      message: "Blog created successfully",
      insertedId: result.insertedId,
    });
  } catch (error) {
    console.error("Error creating blog:", error);
    res
      .status(500)
      .json({ message: "Failed to create blog", error: error.message });
  }
});

// Delete an Blogs by ID
router.delete("/:id", async (req, res) => {
  const id = req.params.id; // Get the event ID from the request parameters
  const query = { _id: new ObjectId(id) }; // Construct the query to find the event by ID

  try {
    // Delete the event document from the collection
    const result = await BlogsCollection.deleteOne(query);

    // Check if the event was deleted
    if (result.deletedCount > 0) {
      res.status(200).send({ message: "Event deleted successfully!" });
    } else {
      res.status(404).send({ message: "Event not found or already deleted." });
    }
  } catch (error) {
    console.error("Error deleting the event:", error);
    res.status(500).send({ message: "Error deleting the event", error });
  }
});

module.exports = router;
