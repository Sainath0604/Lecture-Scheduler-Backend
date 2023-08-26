const express = require("express");
const router = express.Router();
const mainController = require("../controllers/mainController");
const multer = require("multer");
const upload = multer();

router.post("/register", mainController.register);
router.post("/login", mainController.login);
router.post("/forgotPassword", mainController.forgotPassword);
router.get("/resetPassword/:id/:token", mainController.resetPasswordGet);
router.post("/resetPassword/:id/:token", mainController.resetPasswordPost);
router.post("/userData", mainController.userData);
router.get("/getAllUsers", mainController.getAllUsers);
router.get("/deleteUser", mainController.deleteUser);
router.get("/editUser", mainController.editUser);
router.post(
  "/uploadCourse",
  upload.single("course"),
  mainController.uploadCourse
);
router.get("/getCourseInfo", mainController.getCourseInfo);
router.post("/deleteCourseInfo", mainController.deleteCourseInfo);
router.post(
  "/editCourseInfo",
  upload.single("course"),
  mainController.editCourseInfo
);

module.exports = router;
