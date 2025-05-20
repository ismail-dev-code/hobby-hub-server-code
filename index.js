const express = require("express");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("HobbyHub Server is running");
});

app.listen(port, () => {
  console.log(`HobbyHub server running on port: ${port}`);
});
