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
        })
       

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
        })
         .sort({ _id: -1 });


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

    // 1) جلب الفاتورة
    const invoice = await InvoiceModel.findById(invoiceId);
    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    if (!invoice.products || invoice.products.length === 0) {
      return res.status(400).json({ message: "Invoice has no products" });
    }

    let totalReturned = 0;

    // 2) تحقق من كمية المرتجع لكل منتج
    for (let rp of returnProducts) {
      const productInInvoice = invoice.products.find(
        (p) => p.productId.toString() === rp.productId.toString()
      );

      if (!productInInvoice) {
        return res.status(400).json({
          message: `Product ${rp.productId} not found in invoice`
        });
      }

      const productQty = Number(productInInvoice.quantity || 0);
      const returnQty = Number(rp.qty || 0);

      if (returnQty > productQty) {
        return res.status(400).json({
          message: `Return quantity (${returnQty}) exceeds purchased quantity (${productQty})`
        });
      }

      // 3) إعادة الكمية للمخزون
      await ProductModel.findByIdAndUpdate(rp.productId, {
        $inc: { quantity: returnQty }
      });

      // 4) حساب قيمة المرتجع بعد الخصم
      const unitPrice = Number(productInInvoice.unitPrice || productInInvoice.sellPrice || 0);
      const discount = Number(invoice.discount || 0);

      const returnedValue = unitPrice * returnQty * (100 - discount) / 100;
      totalReturned += returnedValue;

      // 5) تحديث كمية الفاتورة
      productInInvoice.quantity = productQty - returnQty;
    }

    // 6) إزالة المنتجات التي أصبحت كميتها صفر
    invoice.products = invoice.products.filter((p) => Number(p.quantity) > 0);

    // 7) إعادة حساب القيم المالية
    const total = invoice.products.reduce((sum, p) => {
      const unitPrice = Number(p.unitPrice || p.sellPrice ||  0);
      const quantity = Number(p.quantity || 0);
      return sum + unitPrice * quantity;
    }, 0);

    const discount = Number(invoice.discount || 0);
    const paid = Number(invoice.paid || 0);

    invoice.total = total;
    invoice.totalAfterDiscount = total - (discount * total) / 100;
    invoice.remaining = invoice.totalAfterDiscount - paid;

    if (invoice.products.length === 0) {
      invoice.return = true;
      invoice.total = 0;
      invoice.totalAfterDiscount = 0;
      invoice.remaining = 0;
    }

    await invoice.save();

    // 8) تحديث رصيد العميل
    await Customer.findByIdAndUpdate(invoice.customerId, {
      $inc: { remainingBalance: -totalReturned }
    });

    // 9) إنشاء سجل الإرجاع
    const returnInvoice = await invoiceReturnModel.create({
      invoiceId: invoice._id,
      customerId: invoice.customerId,
      products: returnProducts.map((rp) => ({
        productId: rp.productId,
        qty: Number(rp.qty || 0),
        sellPrice: Number(rp.sellPrice || rp.unitPrice|| 0)
      })),
      totalReturned,
      reason: returnReason || "No reason provided",
      returnDate: new Date()
    });

    res.status(200).json({
      message: "Invoice returned successfully",
      returnInvoice,
      updatedInvoice: invoice
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Server error",
      error: err.message
    });
  }
};



// producrs is more sell
exports.bestSellers = async (req, res) => {
  try {
    const bestSellerProducts = await InvoiceModel.aggregate([
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
    // 1) Get all invoices + all expenses
    const invoices = await InvoiceModel.find({});
    const expenses = await ExpenseModel.find({});
    const products = await ProductModel.find({}); // get once

    // Prepare a map for faster lookup
    const productMap = new Map(products.map(p => [p._id.toString(), p]));

    // 2) Calculate totals
    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const totalSell = invoices.reduce((sum, inv) => sum + inv.totalAfterDiscount, 0);
    const totalRemaining = invoices.reduce((sum, inv) => sum + inv.remaining, 0);

    let totalPurchase = 0;

    // 3) Calculate purchase total efficiently
    for (const inv of invoices) {
      for (const item of inv.products) {
        const product = productMap.get(item.productId.toString());
        if (product) {
          totalPurchase += product.purchasePrice * item.quantity;
        }
      }
    }

    // 4) Final benefit
    let totalBenefit = totalSell - totalPurchase - totalExpenses;
    let totalBenefitWithRemaining = totalBenefit - totalRemaining;

    // 5) Send response
    res.status(200).json({
      message: "success",
      totalBenefit,
      totalBenefitWithRemaining,
      totalSell,
      totalPurchase,
      totalExpenses,
      totalRemaining
    });

  } catch (err) {
    res.status(500).json({
      message: "Server error",
      error: err.message
    });
  }
};











