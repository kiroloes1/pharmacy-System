const mongoose =require("mongoose");

const customerSchema=new mongoose.Schema({
     name:{
        type:String,
        required:true,
     },
     phone:{
        type:String,
        required:true,
     },
     remainingBalance:{
        type:Number,
        required:false,
        default:0
     },
      payments: [
      {
         amount: { type: Number, default:0 },
         typeCollection:{type:String, default:"in"},
         date: { type: Date, default: Date.now }
      }
      ]
      ,
    invoices: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Invoice",
    default: []
    }],
    typeCollection:{
      type:String,
      default:"in"
    }



});
const customer=mongoose.model("customer",customerSchema);



module.exports=customer;

