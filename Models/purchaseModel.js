const mongoose =require("mongoose");


const purchaseSchema=new mongoose.Schema({
      supplierId: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "supplier",   // نفس اسم الموديل اللي عملته للمورد
         required: true
      },
     paymentMethod:{
        type:String,
        default:"نقدي",
        required:true,
     },
     total:{
        type:Number,
        required:true,
     },
      paid:{
        type:Number,
        required:true,
     },
      remaining:{
        type:Number,
        required:true,
     },

     discount:{
         type:Number,
        required:true,
        default:0,
     },
     totalAfterDiscount:{
        type:Number,
        required:true,
     },
     note:{
         type:String,
        required:false,
        default:"لا يوجد تعليق علي هذا الفاتوره "
     },
     createdAt:{
        type:Date,
        default:Date.now
     },
      return:{
        type:Boolean,
        default:false,
     },
    products: {
        type: [
            {
                productId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "Products",
                    required: true
                },
                quantity: { type: Number, required: true, default: 1 },
                unitPrice: { type: Number, required: true }
            }
        ],
        required: true
    }




});
const Purchase = mongoose.model("Purchase", purchaseSchema);



module.exports=Purchase;