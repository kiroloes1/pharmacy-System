const { populate } = require("../Models/userModel");


const InvoiceModel = require(`${__dirname}/../Models/invoiceModel`);
const Customer = require(`${__dirname}/../Models/customerModel`);
const invoiceReturnModel = require(`${__dirname}/../Models/invoiceReturnModel`);
const ProductModel = require(`${__dirname}/../Models/productModel`);
const ExpenseModel=require(`${__dirname}/../Models/expensesModel`)

// Get invoice by id
exports.getInvoice = async (req, res) => {
    try {
        const id = req.params.id;

        const invoice = await InvoiceModel.findById(id)
        .populate("customerId")
        .populate({
            path:"products.productId",
            model:"Products"
        });

        if (!invoice) {
            return res.status(404).json({ message: "invoice not found" });
        }

        res.status(200).json({
            message: "success",
            data: invoice
        });

    } catch (e) {
        res.status(500).json({ message: "server error", error: e });
    }

};

// Get all invoices
exports.getAllInvoice = async (req, res) => {
    try {
        const invoices = await InvoiceModel.find({return:false})
             .populate("customerId")
        .populate({
            path:"products.productId",
            model:"Products"
        });


        res.status(200).json({
            message: "success",
            results: invoices.length,
            data: invoices
        });
        console.log(invoices)

    } catch (e) {
        res.status(500).json({ message: "server error", error: e });
    }
};

// Create invoice
exports.createInvoice = async (req, res) => {
    try {
        const body = req.body;

        if (!body || Object.keys(body).length === 0) {
            return res.status(400).json({ message: "please provide invoice data" });
        }

        for(const x of   body.products ){
          const product=  await ProductModel.findById(x.productId);
          if(x.quantity>product.quantity){
            return res.status(400).json({message:"not allowed to take over product stock"})
          }
        }
      

        const invoice = await InvoiceModel.create(body);

           // 2. Link invoice to customer
        await Customer.findByIdAndUpdate(
        invoice.customerId,
        { $push: { invoices: invoice._id },
         $inc:{remainingBalance:invoice.remaining} }
        );

             for (let item of invoice.products) {
      await ProductModel.findByIdAndUpdate(item.productId, {
        $inc: { quantity: -item.quantity } // نقص الكمية
      });
    }
       
        
        res.status(201).json({
            message: "invoice created successfully",
            data: invoice
        });

    } catch (e) {
        res.status(500).json({ message: "server error", error: e });
    }
};

exports.editInvoice = async (req, res) => {
  try {
    const id = req.params.id;
    const updates = req.body; // البيانات الجديدة اللي عايز تحدثها

    if (!id) {
      return res.status(400).json({ message: "Please provide invoice ID" });
    }

    if (!updates || Object.keys(updates).length === 0) {
      return res.status(400).json({ message: "Please provide fields to update" });
    }

const oldInvoice = await InvoiceModel.findById(id);

// بعد التحديث
const updatedInvoice = await InvoiceModel.findByIdAndUpdate(id, updates, { new: true });

// تحديث remainingBalance للعميل
if (oldInvoice && updatedInvoice && oldInvoice.remaining !== updatedInvoice.remaining) {
    const diff = updatedInvoice.remaining - oldInvoice.remaining;
    await Customer.findByIdAndUpdate(updatedInvoice.customerId, { $inc: { remainingBalance: diff } });
}

    if (!updatedInvoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    res.status(200).json({
      message: "Invoice updated successfully",
      data: updatedInvoice
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// return invoices
exports.returnInvoice = async (req, res) => {
  try {
    const invoiceId = req.params.id;
    const { returnProducts, returnReason } = req.body;

    if (!returnProducts || returnProducts.length === 0) {
      return res.status(400).json({ message: "No returned products provided" });
    }

    // 1) Load original invoice
    const invoice = await InvoiceModel.findById(invoiceId);
    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    // 2) Validate returned products
    for (let rp of returnProducts) {
      const original = invoice.products.find(
        p => p.productId.toString() === rp.productId.toString()
      );

      if (!original) {
        return res.status(400).json({
          message: `Product ${rp.productId} not found in invoice`
        });
      }

      if (rp.qty > original.quantity) {
        return res.status(400).json({
          message: `Returned qty (${rp.qty}) exceeds invoice qty (${original.quantity})`
        });
      }

      // If price not sent → get from invoice
      rp.price = rp.price || original.unitPrice;
    }

    // 3) Update stock (increase qty because customer returned them)
    for (let rp of returnProducts) {
      await ProductModel.findByIdAndUpdate(rp.productId, {
        $inc: { quantity: rp.qty }
      });
    }

    // 4) Create return invoice record
    const returnInvoice = await InvoiceReturnModel.create({
      invoiceId: invoice._id,
      customerId: invoice.customerId,
      products: returnProducts.map(rp => ({
        productId: rp.productId,
        qty: rp.qty,
        sellPrice: rp.price,
        total: rp.price * rp.qty
      })),
      reason: returnReason || "No reason provided",
      createdAt: new Date()
    });

    // 5) Update invoice products
    invoice.products.forEach(p => {
      const returned = returnProducts.find(
        rp => rp.productId.toString() === p.productId.toString()
      );
      if (returned) p.quantity -= returned.qty;
    });

    // Remove product if qty becomes 0
    invoice.products = invoice.products.filter(p => p.quantity > 0);

    if (invoice.products.length === 0) {
      invoice.return = true; // full invoice return
    }

    // 6) Recalculate invoice totals
    invoice.total = invoice.products.reduce(
      (sum, p) => sum + p.unitPrice * p.quantity,
      0
    );

    invoice.totalAfterDiscount =
      invoice.total - (invoice.discount * invoice.total) / 100;

    invoice.remaining = invoice.totalAfterDiscount - invoice.paid;

    await invoice.save();

    // 7) Update customer balance
    const totalReturned = returnProducts.reduce(
      (sum, rp) => sum + rp.price * rp.qty,
      0
    );

    // Customer remaining money decreases (he owes less money)
    await CustomerModel.findByIdAndUpdate(invoice.customerId, {
      $inc: { remainingBalance: -totalReturned }
    });

    // Add reference to return invoice in customer schema
    await CustomerModel.findByIdAndUpdate(invoice.customerId, {
      $push: { invoicesReturn: returnInvoice._id }
    });

    // 8) Response
    res.status(200).json({
      message: "Invoice returned successfully",
      returnInvoice,
      updatedInvoice: invoice
    });

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
// producrs is more sell
exports.bestSellers = async (req, res) => {
  try {
    const bestSellerProducts = await invoiceReturnModel.aggregate([
      { 
        $unwind: "$products" // نفك الـ array إذا كان products array
      },
      { 
        $group: {
          _id: "$products.productId", // تجميع حسب الـ productId
          totalSell: { $sum: 1 } // مجموع الكمية المباعة
        }
      },
      { 
        $sort: { totalSell: -1 } // ترتيب من الأعلى
      },
      {
        $lookup: {
          from: "products",          // اسم collection المنتجات
          localField: "_id",         // الـ productId
          foreignField: "_id",       // المفتاح في collection المنتجات
          as: "productDetails"
        }
      },
      {
        $unwind: "$productDetails"   // لفرد الـ array الناتج من lookup
      },
      {
        $project: {
          _id: 0,
          productId: "$_id",
          totalSell: 1,
          productName: "$productDetails.name",
          productPrice: "$productDetails.sellPrice"
        }
      }
    ]);

    res.status(200).json({
      message: "successfully",
      bestSellerProducts: bestSellerProducts
    });

  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// benfit
exports.benefit = async (req, res) => {
  try {
    // Get all invoices
    const invoiceData = await InvoiceModel.find();

    // Sum of totalAfterDiscount
    const totalRevenue = invoiceData.reduce((acc, curr) => acc + curr.totalAfterDiscount, 0);

    // Get all expenses
    const expenses = await ExpenseModel.find();

    // Sum of all expenses
    const totalExpenses = expenses.reduce((acc, curr) => acc + curr.amount, 0);

    // Calculate profit
    const totalProfit = totalRevenue - totalExpenses;

    // Send response
    res.status(200).json({
      totalRevenue,
      totalExpenses,
      totalProfit
    });

  } catch (err) {
    res.status(500).json({ message: "Server error: " + err.message });
  }
};

