const mongoose = require("mongoose");

//Schema for User information

const userSchema = new mongoose.Schema(
  {
    fName: { type: String, required: true },
    lName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    userType: { type: String, required: true },
  },
  {
    collection: "user",
  }
);
mongoose.model("user", userSchema);

//Schema for course information

const courseSchema = new mongoose.Schema({
  cName: { type: String, required: true },
  cLevel: { type: String, required: true },
  cDescription: { type: String, required: true },
  image: {
    data: Buffer,
    contentType: String,
  },
  lecture: [
    {
      id: { type: Number },
      lectureName: { type: String },
      time: { type: String },
    },
  ],
});

mongoose.model("course", courseSchema);
