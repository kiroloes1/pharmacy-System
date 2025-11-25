const PurchaseModel = require(`${__dirname}/../Models/purchaseModel`);
const SupplierModel = require(`${__dirname}/../Models/supplierModel`);
const ProductModel = require(`${__dirname}/../Models/productModel`);
const PurchaseReturnModel = require(`${__dirname}/../Models/purchaseReturnModel`);

// Get all purchases 
exports.getAllPurchases = async (req, res) => {
  try {
    const purchases = await PurchaseModel.find()
      .populate("supplierId")
      .populate({
        path: "products.productId",
        model: "Products"
      });

    res.status(200).json({
      status: "success",
      results: purchases.length,
      data: purchases
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

// Get purchase by ID 
exports.getPurchase = async (req, res) => {
  try {
    const id = req.params.id;
    const purchase = await PurchaseModel.findById(id)
      .populate("supplierId")
      .populate({
        path: "products.productId",
        model: "Products"
      });

    if (!purchase) return res.status(404).json({ status: "error", message: "Purchase not found" });

    res.status(200).json({
      status: "success",
      data: purchase
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

// Create new purchase 
exports.createPurchase = async (req, res) => {
  try {
    const body = req.body;
    if (!body || Object.keys(body).length === 0) {
      return res.status(400).json({ status: "error", message: "Please provide purchase data" });
    }

    const purchase = await PurchaseModel.create(body);

    // ربط المشتريات بالمورد
    await SupplierModel.findByIdAndUpdate(purchase.supplierId, {
      $push: { purchases: purchase._id },
      $inc: { remainingBalance: purchase.remaining } // إضافة الباقي للمورد
    });

    res.status(201).json({ status: "success", data: purchase });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

// Update purchase 
exports.editPurchase = async (req, res) => {
  try {
    const id = req.params.id;
    const updates = req.body;

    if (!id) return res.status(400).json({ message: "Please provide purchase ID" });
    if (!updates || Object.keys(updates).length === 0) return res.status(400).json({ message: "Please provide fields to update" });

    const oldPurchase = await PurchaseModel.findById(id);
    const updatedPurchase = await PurchaseModel.findByIdAndUpdate(id, updates, { new: true });

    if (!updatedPurchase) return res.status(404).json({ message: "Purchase not found" });

    // إعادة حساب المجموع بعد أي تعديل
    updatedPurchase.total = updatedPurchase.products.reduce((sum, p) => sum + p.unitPrice * p.quantity, 0);
    updatedPurchase.totalAfterDiscount = updatedPurchase.total - ((updatedPurchase.discount)*(updatedPurchase.total))/100;
    updatedPurchase.remaining = updatedPurchase.totalAfterDiscount - updatedPurchase.paid;

    // تحديث remainingBalance للمورد بناء على الفرق
    if (oldPurchase && oldPurchase.remaining !== updatedPurchase.remaining) {
      const diff = updatedPurchase.remaining - oldPurchase.remaining;
      await SupplierModel.findByIdAndUpdate(updatedPurchase.supplierId, { $inc: { remainingBalance: diff } });
    }

    await updatedPurchase.save();

    res.status(200).json({
      message: "Purchase updated successfully",
      data: updatedPurchase
    });

  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
// return purchase (partial or full)
exports.returnPurchase = async (req, res) => {
  try {
    const purchaseId = req.params.id;
    const { returnProducts, returnReason } = req.body;

    // 1) جلب الفاتورة الأصلية
    const purchase = await PurchaseModel.findById(purchaseId);
    if (!purchase) return res.status(404).json({ message: "Purchase not found" });

    if (!purchase.products || purchase.products.length === 0) {
      return res.status(400).json({ message: "This purchase has no products, cannot return" });
    }

    // 2) التحقق من أن كمية المرتجع ≤ الكمية الأصلية لكل منتج
    for (let rp of returnProducts) {
      const original = purchase.products.find(p =>
        p.productId.toString() === rp.productId.toString()
      );

      if (!original) {
        return res.status(400).json({
          message: `Product ${rp.productId} not found in purchase`
        });
      }

      if (rp.qty > original.quantity) {
        return res.status(400).json({
          message: `Returned qty (${rp.qty}) for product ${rp.productId} is greater than purchased qty (${original.quantity})`
        });
      }

      // تحميل سعر الشراء من الفاتورة لو مش موجود
      rp.price = rp.price || original.unitPrice;
    }

    // 3) تحديث المخزون (إرجاع الكمية)
    for (let rp of returnProducts) {
      await ProductModel.findByIdAndUpdate(rp.productId, {
        $inc: { quantity: -rp.qty } // نفس logic الفاتورة: نقص من المخزون
      });
    }

    // 4) إنشاء سجل المرتجع
    const returnPurchase = await PurchaseReturnModel.create({
      purchaseId: purchase._id,
      supplierId: purchase.supplierId,
      products: returnProducts.map(rp => ({
        productId: rp.productId,
        qty: rp.qty,
        price: rp.price,
        total: rp.price * rp.qty
      })),
      returnReason: returnReason || "No reason provided",
      returnDate: new Date()
    });

    // 5) تعديل الكمية في المشتريات الأصلية
    purchase.products.forEach(p => {
      const returned = returnProducts.find(rp => rp.productId.toString() === p.productId.toString());
      if (returned) p.quantity -= returned.qty;
    });
    purchase.products = purchase.products.filter(p => p.quantity > 0);

    // 6) إعادة الحسابات
    purchase.total = purchase.products.reduce((sum, p) => sum + p.unitPrice * p.quantity, 0);
    purchase.totalAfterDiscount = purchase.total - (purchase.discount * purchase.total) / 100;
    purchase.remaining = purchase.totalAfterDiscount - purchase.paid;

    await purchase.save();

    // 7) تحديث مديونية المورد
    const totalReturned = returnProducts.reduce((sum, rp) => sum + rp.price * rp.qty, 0);
    await SupplierModel.findByIdAndUpdate(purchase.supplierId, {
      $inc: { remainingBalance: -totalReturned }
    });

    // 8) Response
    res.status(200).json({
      message: "Purchase returned successfully",
      returnPurchase,
      updatedPurchase: purchase
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
