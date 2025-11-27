const mongoose = require("mongoose");
require("dotenv").config();

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: [true,"this email already exist"]
  },
  password: {
    type: String,
    required: true,
    minLength: 6,
  },
   active:{
     type:Boolean,
     default:false
   },
   blocked:{
     type:Boolean,
     default:false
   },
  role: {
    type: String,
    enum: ["admin", "user"],
    default: "user",
    require:false
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
      phone:{
    type: String,
}
});


const User = mongoose.model("User", UserSchema);
module.exports = User;
