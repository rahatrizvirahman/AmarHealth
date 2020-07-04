const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const util = require('util')

const {
  sendSectionSubSec,
  saveQuesOp,
  deleteSecSubSecQuesOp,
  getSectionData,
  editProfileQues,
  saveProfileQues
} = require("../controllers/adminFunctions");
const { questionModel, optionModel } = require("../models/inputCollection");


router.get("/addQues", sendSectionSubSec);
router.post("/addQues", saveQuesOp);

router.get("/profile/edit", (req, res) =>{
  res.render('adminProfileQuesCollection')
})
// get profile ques for edit
router.get("/profile/edit/:qId", editProfileQues)
// save profile ques
router.post("/profile/edit", saveProfileQues)

// this is for deleting section subsection....have to delete this later
router.get("/deleteSectionSubsection", deleteSecSubSecQuesOp);

// this provides new id
router.get('/getNewId', async (req, res) => {
  res.send({ id: new mongoose.Types.ObjectId() })
})

module.exports = router;
