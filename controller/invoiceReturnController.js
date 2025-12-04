const invoiceReturnModel = require(`${__dirname}/../Models/invoiceReturnModel`);


// get All Return Invoices
exports.getAllReturnInvoices = async (req, res) => {
    try {
        const returnInvoices = await invoiceReturnModel
            .find()
            .populate("invoiceId")
            .populate("customerId")
            .populate("products.productId")
        .sort({ _id: -1 });

        return res.status(200).json({
            message: "success",
            length: returnInvoices.length,
            data: returnInvoices
        });

    } catch (err) {
        return res.status(500).json({ message: "server error"+err.message });
    }
};


// get Return Invoice By Id
exports.getReturnInvoiceById = async (req, res) => {
    try {
        const id = req.params.id;

        const returnInvoice = await invoiceReturnModel
            .findById(id)
            .populate("invoiceId")
            .populate("customerId")
            .populate("products.productId");

        if (!returnInvoice) {
            return res.status(404).json({ message: "Return invoice not found" });
        }

        return res.status(200).json({
            message: "success",
            data: returnInvoice
        });

    } catch (err) {
        return res.status(500).json({ message: "server error" });
    }
};


// delete Return Invoice
exports.deleteReturnInvoice = async (req, res) => {
    try {
        const id = req.params.id;

        const deleted = await invoiceReturnModel.findByIdAndDelete(id);

        if (!deleted) {
            return res.status(404).json({ message: "Return invoice not found" });
        }

        return res.status(200).json({ message: "Deleted successfully" });

    } catch (err) {
        return res.status(500).json({ message: "server error" });
    }
};

// return invoice (partial or full)
exports.returnInvoice = async (req, res) => {
  try {
    const invoiceId = req.params.id;
    const { returnProducts, returnReason } = req.body;

    // ===== 1) هات الفاتورة الأصلية =====
    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    if (!invoice.products || invoice.products.length === 0) {
      return res.status(400).json({
        message: "This invoice has no products to return"
      });
    }

    // ===== 2) التحقق من كل منتج مرجّع =====
    for (let rp of returnProducts) {
      const original = invoice.products.find(
        p => p.productId.toString() === rp.productId.toString()
      );

      if (!original) {
        return res.status(400).json({
          message: `Product ${rp.productId} does not exist in invoice`
        });
      }

      // التأكد إن المرتجع أقل أو يساوي الكمية الأصلية
      if (rp.qty > original.quantity) {
        return res.status(400).json({
          message: `Returned qty (${rp.qty}) is greater than invoice qty (${original.quantity})`
        });
      }

      // تحميل sellPrice من الفاتورة الأصلية لو مش مبعوت
      rp.sellPrice = original.unitPrice;
    }

    // ===== 3) إرجاع الكمية للمخزون =====
    for (let rp of returnProducts) {
      await Product.findByIdAndUpdate(rp.productId, {
        $inc: { quantity: rp.qty }
      });
    }

    // ===== 4) إنشاء سجل المرتجع InvoiceReturn =====
    const returnInvoice = await InvoiceReturn.create({
      invoiceId: invoice._id,
      products: returnProducts.map(rp => ({
        productId: rp.productId,
        qty: rp.qty,
        sellPrice: rp.sellPrice
      })),
      reason: returnReason || "No reason provided"
    });

    // ===== 5) تعديل الفاتورة الأصلية =====
    invoice.products.forEach(p => {
      const returned = returnProducts.find(
        rp => rp.productId.toString() === p.productId.toString()
      );
      if (returned) {
        p.quantity -= returned.qty;
      }
    });
    // ===== 7) حساب قيمة المرتجع وتحديث العميل =====
    const returnedValue = returnProducts.reduce(
      (sum, rp) => sum += (rp.sellPrice * rp.qty),
      0
    );

    // ===== حساب قيمة المرتجع بعد الخصم =====
const returnedValueAfterDiscount = returnProducts.reduce((sum, rp) => {
  const original = invoice.products.find(
    p => p.productId.toString() === rp.productId.toString()
  );
  const price = original ? original.unitPrice : rp.sellPrice;
  const discountedPrice = price * (100 - invoice.discount) / 100;
  return sum + discountedPrice * rp.qty;
}, 0);


    // حذف المنتجات اللي بقت كميتها 0
    invoice.products = invoice.products.filter(p => p.quantity > 0);

    // ===== 6) إعادة الحساب =====
    invoice.total =
      invoice.products.reduce((sum, p) => sum + (p.unitPrice * p.quantity), 0);

    invoice.totalAfterDiscount =
      invoice.total - (invoice.discount * invoice.total) / 100;

   




  invoice.remaining -= returnedValueAfterDiscount;

    await invoice.save();


await Customer.findByIdAndUpdate(invoice.customerId, {
  $inc: { remainingBalance: -returnedValueAfterDiscount }
});



    // ===== 8) إرسال الرد =====
    res.status(200).json({
      message: "Return processed successfully",
      returnedValue,
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

