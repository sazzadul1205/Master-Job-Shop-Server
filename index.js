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

    //API`s
    // Users API
    // Get Users
    app.get("/Users", async (req, res) => {
      const result = await UsersCollection.find().toArray();
      res.send(result);
    });
    // Post new Users
    app.post("/Users", async (req, res) => {
      const request = req.body;
      const result = await UsersCollection.insertOne(request);
      res.send(result);
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
      const result = await PostedJobCollection.find().toArray();
      res.send(result);
    });
    // get Posed Posted Job by ID
    app.get("/Posted-Job/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await PostedJobCollection.findOne(query);
      res.send(result);
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

    // Testimonials API
    // Get Testimonials
    app.get("/Testimonials", async (req, res) => {
      const result = await TestimonialsCollection.find().toArray();
      res.send(result);
    });

    // WhyChooseUs API
    // Get WhyChooseUs
    app.get("/WhyChooseUs", async (req, res) => {
      const result = await WhyChooseUsCollection.find().toArray();
      res.send(result);
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
