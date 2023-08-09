require("dotenv").config();
const express = require("express");
const app = express();
app.use(express.json());
const cors = require("cors");
app.use(cors());

const isProduction = process.env.NODE_ENV === "production";

const mongoose = require("mongoose");

//Declaring port
app.listen(5000, () => {
  console.log("server started on port 5000");
});

const mongoUrl = isProduction
  ? process.env.DATABASE_URL
  : "mongodb://0.0.0.0:27017/VideoSchedulingModule";

mongoose
  .connect(mongoUrl, {
    useNewUrlParser: true,
  })
  .then(() => {
    console.log("connected to Database");
  })
  .catch((e) => console.log(e));
