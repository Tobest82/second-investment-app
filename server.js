require("dotenv").config();

const express = require("express");

const cors = require("cors");

const authRoutes = require("./routes/authRoutes");

const app = express();

// middleware
app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// routes
app.use(authRoutes);

// test route
// app.get("/", (req, res) => {

//   res.send("route working");

// });

console.log(process.env.EMAIL_USER);
console.log(process.env.EMAIL_PASS);

app.listen(3000, () => {

  console.log("Server running on port 3000");

});

console.log("SERVER STARTED");