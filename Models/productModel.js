const mongoose =require("mongoose");

const productSchema=new mongoose.Schema({
    name:{
        type:String,
        required:true,
    },
    purchasePrice:{
         type:Number,
        required:true,
    },
     sellPrice:{
         type:Number,
        required:true,
    },
      supplierId: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "supplier",   // نفس اسم الموديل اللي عملته للمورد
         required: true
      },
    quantity:{
        type:Number,
        required:true,
        default:1,
    },
    companyName:{
        type:String,
        required:false,
        default:"اسم الشركه غير مذكور"
    },
    expiration:{
        type:Date,
        required:true,
    },
    IsNearlyExpired:{
        type:Boolean,
        default:false,
    },



});
const products=mongoose.model("Products",productSchema);



module.exports=products;

