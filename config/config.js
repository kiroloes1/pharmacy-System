// db.js
const mongoose = require("mongoose");

const connectDB = async () => {
    try {
        await mongoose.connect("mongodb://localhost:27017/beboSystem", {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log("MongoDB Connected Successfully");
    } catch (err) {
        console.error("MongoDB connection error: ", err);
        
    }
};

module.exports = connectDB;
