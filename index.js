require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");
const mongoose = require("mongoose");

app.use(express.json());
app.use(cors());

const isProduction = process.env.NODE_ENV === "production";
const mongoUrl = isProduction
  ? process.env.DATABASE_URL
  : "mongodb://0.0.0.0:27017/VideoSchedulingModule";

mongoose
  .connect(mongoUrl, {
    useNewUrlParser: true,
  })
  .then(() => {
    console.log("Connected to Database");
  })
  .catch((e) => console.log(e));

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: false }));

const mainRoutes = require("./routes/mainRoutes");
app.use("/", mainRoutes);

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});
