const mongoose =require("mongoose");
const { returnInvoice } = require("../controller/invoiceController");

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
    }]
    ,
  invoicesReturn: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "InvoiceReturn",
      default: []
    }
  ]


});
const customer=mongoose.model("customer",customerSchema);


module.exports=customer;