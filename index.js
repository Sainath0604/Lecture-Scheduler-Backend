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
require("./models/userModel");
const User = mongoose.model("User");

//Register API

app.post("/register", async (req, res) => {
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

// Forgot password API

app.post("/forgotPassword", async (req, res) => {
  const { email } = req.body;
  try {
    const oldUser = await User.findOne({ email });
    if (!oldUser) {
      return res.json({ status: "User does not exists" });
    } else {
      res.json({
        status:
          "A link has been sent to your email, link will be activated for 5 minutes only",
      });
    }

    const secret = JWT_secret + oldUser.password;
    //^^made secret with JWT_SECRET and password
    const token = jwt.sign({ email: oldUser.email, id: oldUser._id }, secret, {
      expiresIn: "5m",
    });
    //^^created token with email, id and above secret which expires in 5min

    const resetPassUrl = isProduction
      ? process.env.BACKEND_URL
      : "http://localhost:5000";

    const link = `${resetPassUrl}/resetPassword/${oldUser._id}/${token}`;

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.NODEMAILER_USER,
        pass: process.env.NODEMAILER_PASS,
      },
    });

    const mailOptions = {
      from: "youremail@gmail.com",
      to: email,
      subject: "Password reset ",
      text: link,
    };

    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log(error);
      } else {
        console.log("Email sent: " + info.response);
      }
    });
  } catch (error) {
    // res.send({ status: "error" });
    console.log(error);
  }
});

// Reset password API (get)

app.get("/resetPassword/:id/:token", async (req, res) => {
  const { id, token } = req.params;
  // console.log(req.params);
  //verfy id
  const oldUser = await User.findOne({ _id: id });
  if (!oldUser) {
    return res.json({ status: "User does not exists" });
  }
  const secret = JWT_secret + oldUser.password;
  try {
    const verify = jwt.verify(token, secret);
    res.render("index", { email: verify.email, status: "verified" });
  } catch (error) {
    res.send("Not verified");
    console.log(error);
  }
});

// Reset password API (post)

app.post("/resetPassword/:id/:token", async (req, res) => {
  const { id, token } = req.params;
  const { password } = req.body;
  //verfy id
  const oldUser = await User.findOne({ _id: id });
  if (!oldUser) {
    return res.json({ status: "User does not exists" });
  }
  const secret = JWT_secret + oldUser.password;
  try {
    const verify = jwt.verify(token, secret);
    const encryptedPassword = await bcrypt.hash(password, 10);
    await User.updateOne(
      {
        _id: id,
      },
      {
        $set: {
          password: encryptedPassword,
        },
      }
    );
    // res.json({ status: "Password updated" });

    res.render("index", {
      email: verify.email,
      status: "verifiedWithUpdatedPass",
    });
  } catch (error) {
    res.json({ status: "Something went wrong" });
    console.log(error);
  }
});

// User data API

app.post("/userData", async (req, res) => {
  const { token } = req.body;
  try {
    const user = jwt.verify(token, JWT_secret);
    const userEmail = user.email;

    User.findOne({ email: userEmail })
      .then((data) => {
        res.send({ staus: "ok", data: data });
      })
      .catch((error) => {
        res.send({ status: "error", data: error });
      });
  } catch (error) {
    res.send({ satus: "error" });
  }
});

//Get All users API

app.get("/getAllUser", async (req, res) => {
  try {
    const allUser = await User.find({});
    res.send({ status: "ok", data: allUser });
  } catch (error) {
    console.log(error);
  }
});

// Delete user API

app.post("/deleteUser", async (req, res) => {
  const { userid } = req.body;
  try {
    await User.deleteOne({ _id: userid }),
      function (err, res) {
        console.log(err);
      };
    res.send({ status: "ok", data: "User deleted from database" });
  } catch (error) {
    console.log(error);
  }
});

// Edit user API

app.post("/editUser", async (req, res) => {
  const { userid, newfName, newlName, newEmail } = req.body;
  try {
    await User.updateOne(
      { _id: userid },
      { fName: newfName, lName: newlName, email: newEmail }
    );
    res.send({ status: "ok", data: "User information updated" });
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .send({ status: "error", message: "Failed to update user information" });
  }
});

//Importing course schema

const Course = mongoose.model("Course");

//Upload Course information API

app.post("/uploadCourse", upload.single("course"), async (req, res) => {
  try {
    const { cName, cDescription, cLevel, lecture } = req.body;
    const { buffer, mimetype } = req.file;
    const lecturesArray = JSON.parse(lecture);

    const newCourse = new Course({
      cName,
      cDescription,
      cLevel,
      lecture: lecturesArray,
      image: {
        data: buffer.toString("base64"),
        contentType: mimetype,
      },
    });

    await newCourse.save();

    res.send({ status: "ok", data: "course uploaded successfully." });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .send({ status: "error", message: "Failed to course Product." });
  }
});

//Retrieve course information API

app.get("/getCourseinfo", async (req, res) => {
  try {
    const courses = await Course.find();

    const processedCourse = courses.map((course) => ({
      _id: course._id,
      cName: course.cName,
      cDescription: course.cDescription,
      cLevel: course.cLevel,
      lecture: course.lecture,
      image: {
        contentType: course.image.contentType,
        data: `data:${course.image.contentType};base64,${course.image.data}`,
      },
    }));

    res.json(processedCourse);
  } catch (error) {
    console.log(error);
    res.status(500).send({
      status: "error",
      message: "Failed to retrieve course information.",
    });
  }
});

// Delete course information API

app.post("/deleteCourseInfo", async (req, res) => {
  const { courseId } = req.body;
  try {
    await Course.deleteOne({ _id: courseId }),
      function (err, res) {
        console.log(err);
      };
    res.send({ status: "ok", data: "course Info deleted" });
  } catch (error) {
    console.log(error);
    res.send({ status: "error", data: "Failed to delete course Info" });
  }
});

// Edit course API

app.post("/editCourseInfo", upload.single("course"), async (req, res) => {
  const { courseId, cName, cDescription, cLevel, lecture } = req.body;

  if (!courseId) {
    return res
      .status(400)
      .send({ status: "error", message: "Invalid courseId." });
  }

  try {
    let updateFields = { cName, cDescription, cLevel, lecture };

    if (req.file) {
      const { buffer, mimetype } = req.file;
      updateFields.image = {
        data: buffer.toString("base64"),
        contentType: mimetype,
      };
    }

    const updateQuery = updateFields.image
      ? { $set: updateFields }
      : updateFields;
    await Course.updateOne({ _id: courseId }, updateQuery);
    res.send({ status: "ok", data: "Course Info updated" });
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .send({ status: "error", message: "Failed to update Course Info" });
  }
});
