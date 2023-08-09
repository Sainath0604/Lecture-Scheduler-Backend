require("dotenv").config();
const express = require("express");
const app = express();
app.use(express.json());
const cors = require("cors");
app.use(cors());

const isProduction = process.env.NODE_ENV === "production";

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const JWT_secret = process.env.JWT_SECRET;

app.set("view engine", "ejs"); //For representing node UI

app.use(express.urlencoded({ extended: false }));

const nodemailer = require("nodemailer");

const multer = require("multer");
const upload = multer();

//Declaring port
app.listen(5000, () => {
  console.log("server started on port 5000");
});

//MongoDB connection
const mongoose = require("mongoose");

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

//Importing User schema
require("./models/Schema.js");
const User = mongoose.model("User");

//Register API

app.post("/register", async (req, res) => {
  console.log(req.body);
  const { fName, lName, email, password, userType } = req.body;

  const encryptedPassword = await bcrypt.hash(password, 10);

  try {
    const oldUser = await User.findOne({ email });

    if (oldUser) {
      return res.json({ error: "User already exits" });
    }

    await User.create({
      fName,
      lName,
      email,
      password: encryptedPassword,
      userType,
    });
    res.send({ status: "ok" });
  } catch (error) {
    res.send({ status: "error" });
  }
});

// Login API

app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    return res.json({
      error: "User does not exits, please register if you haven't",
    });
  }
  if (await bcrypt.compare(password, user.password)) {
    //creates token with secret
    const token = jwt.sign({ email: user.email }, JWT_secret);

    if (res.status(201)) {
      return res.json({ status: "ok", data: token, userType: user.userType });
    } else {
      return res.json({ status: "error" });
    }
  }
  res.json({ status: "error", error: "Invalid Credentials" });
});
