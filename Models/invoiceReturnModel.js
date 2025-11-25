const mongoose = require("mongoose");

const invoiceReturnSchema = new mongoose.Schema({
  invoiceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Invoice",
    required: true
  },

  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "customer",
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
      sellPrice: { type: Number }
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

module.exports = mongoose.model("InvoiceReturn", invoiceReturnSchema);
