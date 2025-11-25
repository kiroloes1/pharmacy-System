
// db.js
const mongoose = require("mongoose");

const connectDB = async () => {
    try {

    await mongoose.connect("mongodb+srv://kiroloesreda_db_user:ZyLXSs4e6fgDMu25@pharmacysystem.6xn4npz.mongodb.net/pharmacyDB?retryWrites=true&w=majority", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
        console.log("MongoDB Connected Successfully");
    } catch (err) {
        console.error("MongoDB connection error: ", err);
        
    }
};

module.exports = connectDB;
