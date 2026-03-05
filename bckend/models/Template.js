const mongoose = require("mongoose");

const templateSchema = new mongoose.Schema({
  owner:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"User",
    required:true
  },
  name:String,
  blocks:Array
},{timestamps:true});

module.exports = mongoose.model("Template",templateSchema);