const mongoose = require("mongoose");

const purchaseReturnSchema = new mongoose.Schema({


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

    reason: {
        type: String,
        default: "No reason provided"
    },

    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("PurchaseReturn", purchaseReturnSchema);
