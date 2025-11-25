const mongoose=require("mongoose");
const Purchase = require("./purchaseModel");
const { returnPurchase } = require("../controller/purchaseController");

const supplierSchema=new mongoose.Schema({
     name:{
        type:String,
        required:true,
     },
     phone:{
        type:String,
        required:true,
     },
     companyName:{
        type:String,
        default:" no company name exist "
     },
         remainingBalance:{
        type:Number,
        required:false,
        default:0
     },
      payments: [
      {
         amount: { type: Number, default:0 },
         date: { type: Date, default: Date.now }
      }
      ]
      ,
    purchases: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Purchase",
        default: []
    }]   ,
        purchasesReturn:[{
          type: mongoose.Schema.Types.ObjectId,
              ref: "PurchaseInvoice",
        default: []
        }]

});

const supplier=mongoose.model("supplier",supplierSchema);
module.exports=supplier;