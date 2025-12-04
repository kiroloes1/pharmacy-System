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
      })   .sort({ createdAt: -1 });

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
    let { supplierId, paymentMethod, discount, paid, note, products } = req.body;

    if (!supplierId || !products || products.length === 0) {
      return res.status(400).json({ message: "Supplier and products are required" });
    }

    // 1) تأكد أن supplier موجود
    const supplier = await SupplierModel.findById(supplierId);
    if (!supplier) return res.status(404).json({ message: "Supplier not found" });

    let finalProductsArray = [];
    let total = 0;

    // 2) معالجة المنتجات (موجودة أو جديدة)
    for (let p of products) {
      let productId;

      // لو المنتج موجود بالفعل
      if (p.productId) {
        const existing = await ProductModel.findById(p.productId);
        if (!existing) return res.status(404).json({ message: "Product not found" });

        // زود الكمية
        existing.quantity += p.quantity;
        existing.purchasePrice = p.unitPrice; // تحديث السعر لو عايز
        await existing.save();

        productId = existing._id;
      } else {
        // 3) لو المنتج جديد → أنشئه الآن
        const newProduct = await ProductModel.create({
          name: p.name,
          purchasePrice: p.unitPrice,
          sellPrice: p.sellPrice,
          supplierId: supplierId,
          quantity: p.quantity,
          companyName: p.companyName || "اسم الشركة غير مذكور",
          expiration: p.expiration
        });

        productId = newProduct._id;
      }

      // عمل push للمنتج بعد تحديد productId
      finalProductsArray.push({
        productId,
        quantity: p.quantity,
        unitPrice: p.unitPrice
      });

      total += p.unitPrice * p.quantity;
    }

    // 4) الحسابات
    const totalAfterDiscount = total - (discount * total) / 100;
    let remaining = totalAfterDiscount - paid;

    // 5) لو نقدي → يجب دفع كل المبلغ
    if (paymentMethod === "نقدي") {
      paid = totalAfterDiscount;
      remaining = 0;
    }

    // 6) إنشاء الفاتورة
    const purchase = await PurchaseModel.create({
      supplierId,
      paymentMethod,
      discount,
      paid,
      remaining,
      note,
      total,
      totalAfterDiscount,
      products: finalProductsArray
    });

    // 7) تحديث حساب المورد
    await SupplierModel.findByIdAndUpdate(supplierId, {
      $push: { purchases: purchase._id },
      $inc: { remainingBalance: remaining }
    });

    res.status(201).json({
      status: "success",
      data: purchase
    });

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error", error: err.message });
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

    // 1) Get original purchase
    const purchase = await PurchaseModel.findById(purchaseId);
    if (!purchase) return res.status(404).json({ message: "Purchase not found" });

    if (!purchase.products || purchase.products.length === 0) {
      return res.status(400).json({ message: "This purchase has no products, cannot return" });
    }

    // 2) Validate returned quantities
    for (let rp of returnProducts) {
      const original = purchase.products.find(
        (p) => p.productId.toString() === rp.productId.toString()
      );

      if (!original) {
        return res.status(400).json({
          message: `Product ${rp.productId} not found in purchase`
        });
      }

      if (rp.qty > original.quantity) {
        return res.status(400).json({
          message: `Returned qty (${rp.qty}) exceeds purchased qty (${original.quantity}) for product ${rp.productId}`
        });
      }

      // load price from purchase invoice if not provided
      rp.price = rp.price || original.unitPrice;
    }

    // 3) Update stock
    for (let rp of returnProducts) {
      await ProductModel.findByIdAndUpdate(rp.productId, {
        $inc: { quantity: -rp.qty }
      });
    }

    // 4) Create return record
    const returnPurchase = await PurchaseReturnModel.create({
      purchaseId: purchase._id,
      supplierId: purchase.supplierId,
      products: returnProducts.map(rp => ({
        productId: rp.productId,
        qty: rp.qty,
        sellPrice: rp.price,
        total: rp.price * rp.qty
      })),
      reason: returnReason || "No reason provided",
      createdAt: new Date()
    });
    

    // 5) Update purchase products quantities
    purchase.products.forEach(p => {
      const returned = returnProducts.find(rp => rp.productId.toString() === p.productId.toString());
      if (returned) p.quantity -= returned.qty;
    });

    // remove any product that became zero
    purchase.products = purchase.products.filter(p => p.quantity > 0);

    if (purchase.products.length === 0) {
      purchase.return = true;
    }

    // 6) Recalculate totals
    purchase.total = purchase.products.reduce(
      (sum, p) => sum + p.unitPrice * p.quantity,
      0
    );

    purchase.totalAfterDiscount =
      purchase.total - (purchase.discount * purchase.total) / 100;

    purchase.remaining = purchase.totalAfterDiscount - purchase.paid;

    await purchase.save();

    // 7) Update Supplier balance
    const totalReturned = returnProducts.reduce(
      (sum, rp) => sum + rp.price * rp.qty,
      0
    );

    await SupplierModel.findByIdAndUpdate(purchase.supplierId, {
      $inc: { remainingBalance: -totalReturned }
    });

    await SupplierModel.findByIdAndUpdate(purchase.supplierId, {
      $push: { purchasesReturn: returnPurchase._id }
    });

    // 8) Response
    res.status(200).json({
      message: "Purchase returned successfully",
      returnPurchase,
      updatedPurchase: purchase
    });

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};


