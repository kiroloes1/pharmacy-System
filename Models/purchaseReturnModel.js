const mongoose = require("mongoose");

const purchaseInvoiceSchema = new mongoose.Schema({

    purchaseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Purchase",   // هنا الاسم يجب أن يكون نفس اسم الموديل
        required: true
    },

    supplierId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "supplier",  // هنا الاسم يجب أن يكون نفس اسم الموديل
        required: true
    },

    products: [
        {
            productId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Products",
                required: true
            },
            qty: { type: Number, required: true },
            sellPrice: { type: Number, required: true },
           
        }
    ],



    createdAt: {
        type: Date,
        default: Date.now
    }
    ,
    reason:{
        type:String,
    }

});

// مثال على استخدام populate
// PurchaseInvoiceModel.find().populate("purchaseId").populate("supplierId");

module.exports = mongoose.model("PurchaseInvoice", purchaseInvoiceSchema);
