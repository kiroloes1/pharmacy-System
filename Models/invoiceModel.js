const mongoose =require("mongoose");


const invoicesSchema=new mongoose.Schema({
     customerId: {
              type: mongoose.Schema.Types.ObjectId,
              ref: "customer",   
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
                sellPrice: { type: Number, required: false }
            }
        ],
        required: true
    }




});
const invoices=mongoose.model("Invoice",invoicesSchema);


module.exports=invoices;