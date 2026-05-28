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

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});


// app.listen(3000, () => {

//   console.log("Server running on port 3000");

// });

console.log("SERVER STARTED");