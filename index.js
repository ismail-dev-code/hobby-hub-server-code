const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const admin = require("firebase-admin");
const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(
    JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
  ),
});

// JWT verification middleware
const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).send({ error: true, message: "Unauthorized" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = await admin.auth().verifyIdToken(token);
    req.user = decoded;
    next();
  } catch (err) {
    console.error("JWT verification failed:", err);
    return res.status(403).send({ error: true, message: "Forbidden" });
  }
};

// MongoDB URI and client setup
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.pw0rah1.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

// Main server function
async function run() {
  try {
    const hobbiesCollection = client.db("hobbyDB").collection("hobbies");

    // Get all groups (public)
    app.get("/all-group", async (req, res) => {
      const result = await hobbiesCollection.find().toArray();
      res.send(result);
    });

    // Get my groups (protected)
    app.get("/my-groups", verifyToken, async (req, res) => {
      const email = req.query.email;
      if (req.user.email !== email) {
        return res.status(403).send({ error: true, message: "Forbidden" });
      }

      const groups = await hobbiesCollection
        .find({ userEmail: email })
        .toArray();
      res.send(groups);
    });

    // Get single group by ID (public)
    app.get("/all-group/:id", async (req, res) => {
      const id = req.params.id;
      const result = await hobbiesCollection.findOne({ _id: new ObjectId(id) });
      res.send(result);
    });

    // Update group (protected – assume frontend protects routes properly)
    app.put("/all-group/:id", async (req, res) => {
      const id = req.params.id;
      const updatedGroup = req.body;
      const result = await hobbiesCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: updatedGroup }
      );
      res.send(result);
    });

    // Create a new group (public – frontend should set userEmail)
    app.post("/create-group", async (req, res) => {
      const newGroup = req.body;
      const result = await hobbiesCollection.insertOne(newGroup);
      res.send(result);
    });

    // Delete a group (protected)
    app.delete("/all-group/:id", verifyToken, async (req, res) => {
      const id = req.params.id;
      const result = await hobbiesCollection.deleteOne({
        _id: new ObjectId(id),
      });
      res.send(result);
    });

    // Check connection
    await client.db("admin").command({ ping: 1 });
    console.log("Connected to MongoDB successfully!");
  } finally {
    // Do not close connection in production
    // await client.close();
  }
}
run().catch(console.dir);

// Root route
app.get("/", (req, res) => {
  res.send("HobbyHub Server is running");
});

// Start server
app.listen(port, () => {
  console.log(`HobbyHub server running on port: ${port}`);
});
