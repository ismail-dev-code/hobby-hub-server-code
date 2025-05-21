const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.pw0rah1.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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

    const hobbiesCollection = client.db("hobbyDB").collection("hobbies");

    app.get("/all-group", async (req, res) => {
      const result = await hobbiesCollection.find().toArray();
      res.send(result);
    });

    app.get("/my-groups", async (req, res) => {
      const email = req.query.email;
      const groups = await hobbiesCollection
        .find({ userEmail: email })
        .toArray();
      res.send(groups);
    });
    // get group by ID
    app.get("/all-group/:id", async (req, res) => {
      const id = req.params.id;
      const result = await hobbiesCollection.findOne({ _id: new ObjectId(id) });
      res.send(result);
    });

    // update group by ID
    app.put("/all-group/:id", async (req, res) => {
      const id = req.params.id;
      const updatedGroup = req.body;
      const result = await hobbiesCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: updatedGroup }
      );
      res.send(result);
    });

    app.post("/create-group", async (req, res) => {
      const newGroup = req.body;
      console.log(newGroup);
      const result = await hobbiesCollection.insertOne(newGroup);
      res.send(result);
    });

    app.delete("/all-group/:id", async (req, res) => {
      const id = req.params.id;
      const result = await hobbiesCollection.deleteOne({ _id: new ObjectId(id) });
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

app.get("/", (req, res) => {
  res.send("HobbyHub Server is running");
});

app.listen(port, () => {
  console.log(`HobbyHub server running on port: ${port}`);
});
