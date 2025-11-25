const mongoose=require("mongoose");

const expensesSchema=mongoose.Schema({
    amount:{
        required:true,
        type:Number
    },
    User:{
        required:true,
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  note:{
    type:String,
       required:true,
  }
});
const expenseModel=mongoose.model("Expense",expensesSchema);
module.exports=expenseModel;