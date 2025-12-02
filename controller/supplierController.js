const { populate } = require("../Models/userModel");

const suppliersModel = require(`${__dirname}/../Models/supplierModel`);
const purachaseModel=require(`${__dirname}//../Models/productModel`)


// Get all suppliers
exports.getAllSuppliers = async (req, res) => {
    try {
        const suppliers = await suppliersModel.find()
       .populate({
        path: "purchases",
        populate: {
        path: "products.productId",
        model: "Products"
        }
  })  
      const totalRemainingPerSupplier = await purachaseModel.aggregate([
  {
    $group: {
      _id: "$supplierId",
      totalRemaining: { $sum: "$remaining" }
    }
  },
  {
    $lookup: {
      from: "suppliers",       
      localField: "_id",
      foreignField: "_id",
      as: "supplier"
    }
    
  },
   { $unwind: "$supplier" } 

]);

        res.status(200).json({
            message: "success",
            data: suppliers,
            totalRemainingPerSupplier:totalRemainingPerSupplier
        });

    } catch (e) {
        console.log("error: " + e);
        res.status(500).json({ message: "server error" });
    }
};

// Get supplier by id
exports.getSupplierById = async (req, res) => {
    try {
        const id = req.params.id;
        const supplier = await suppliersModel.findById(id)
          .populate({
    path: "purchases",
    populate: {
      path: "products.productId",
      model: "Products"
    }
  })   .populate({
    path:"purchasesReturn",
    populate:{
      path:"products.productId",
      model:"Products"
    }
   });



        if (!supplier) {
            return res.status(404).json({ message: "supplier not found" });
        }

              const totalRemainingPerCustomer = await purachaseModel.aggregate([
  {
    $group: {
      _id: "$supplierId",
      totalRemaining: { $sum: "$remaining" }
    }
  },
  {
    $lookup: {
      from: "suppliers",         // اسم Collection مش الموديل
      localField: "_id",
      foreignField: "_id",
      as: "supplier"
    }
    
  },
   { $unwind: "$supplier" } 

]);


        

        res.status(200).json({
            message: "success",
            data: supplier,
            totalRemainingPerCustomer:totalRemainingPerCustomer
        });

    } catch (e) {
        console.log("error: " + e);
        res.status(500).json({ message: "server error" });
    }
};

// filter by search
exports.FilterSupplier = async (req, res) => {
  try {
    const search = req.query.supplierSearch;

    if (!search) {
      return res.status(400).json({ message: "Please provide search query" });
    }

    const FilterSupplier = await suppliersModel.find({
      $or: [
        { name: { $regex: search, $options: "i" } },
        { companyName: { $regex: search, $options: "i" } }
      ]
    });

    if (FilterSupplier.length === 0) {
      return res.status(404).json({ message: "No suppliers found matching this search" });
    }

    res.status(200).json({ message: "Successfully", data: FilterSupplier });

  } catch (error) {
    res.status(500).json({ message: `Error: ${error.message}` });
  }
};


exports.collection = async (req, res) => {
  try {
    const id = req.params.id;
    let { collectionPaid, typeCollection } = req.body;

    if (collectionPaid <= 0) {
      return res.status(400).json({ message: "Please enter a valid amount" });
    }

    const supplier = await suppliersModel.findById(id).populate({
      path: "purchases",
      options: { sort: { createdAt: 1 } }
    });

    if (!supplier) {
      return res.status(404).json({ message: "Supplier not found" });
    }

    // تحويل المبلغ لرقم صحيح
    let remainingPayment = Math.round(collectionPaid);

    // تحديث رصيد المورد والمدفوعات
    const updateBalance = typeCollection === "out" ? remainingPayment : -remainingPayment;
    await suppliersModel.findByIdAndUpdate(id, {
      $inc: { remainingBalance: updateBalance },
      $push: { payments: { amount: remainingPayment, typeCollection } }
    });

    for (let purchase of supplier.purchases) {
      if (remainingPayment <= 0) break;

      // تحويل القيم لرقم صحيح لتجنب الكسور
      let purchaseRemaining = Math.round(purchase.remaining);
      
      if (purchaseRemaining >= remainingPayment) {
        await purachaseModel.findByIdAndUpdate(purchase._id, {
          $inc: { remaining: -remainingPayment, paid: remainingPayment }
        });
        remainingPayment = 0;
        break;
      } else {
        remainingPayment -= purchaseRemaining;
        await purachaseModel.findByIdAndUpdate(purchase._id, {
          $set: { remaining: 0 },
          $inc: { paid: purchaseRemaining }
        });
      }
    }

    res.status(200).json({
      message: "Collection applied successfully and updated supplier invoices"
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};


// Create new supplier
exports.createNewSupplier = async (req, res) => {
    try {
        const body = req.body;
        const {name}=req.body;

        if (!body || Object.keys(body).length === 0) {
            return res.status(400).json({ message: "please fill all fields" });
        }

        const existUser=await suppliersModel.findOne({name});
        if(existUser){
          return res.status(404).json({message:"هذا الاسم موجود من قبل يجب تغير الاسم لكي لا يحدث خطاء في البيانات"})
        }
        const newSupplier = await suppliersModel.create(body);


        res.status(201).json({
            message: "supplier created successfully",
            data: newSupplier
        });

    } catch (e) {
        console.log("error: " + e);
        res.status(500).json({ message: "server error" });
    }
};

// Update supplier
exports.updateSupplier = async (req, res) => {
    try {
        const id = req.params.id;
        const body = req.body;

        if (!id || !body || Object.keys(body).length === 0) {
            return res.status(400).json({ message: "please fill all fields" });
        }

        const supplier = await suppliersModel.findByIdAndUpdate(
            id,
            body,
            { new: true }
        );

        if (!supplier) {
            return res.status(404).json({ message: "supplier not found" });
        }

        res.status(200).json({
            message: "success",
            data: supplier
        });

    } catch (e) {
        console.log("error: " + e);
        res.status(500).json({ message: "server error" });
    }
};

// debt to supplier
exports.addToSupplierBalance = async (req, res) => {
  try {
    const supplierId = req.params.id;
    const { amount, note } = req.body; // المبلغ والتعليق اختياري

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "Please enter a valid amount" });
    }

    const supplier = await suppliersModel.findById(supplierId);
    if (!supplier) {
      return res.status(404).json({ message: "Supplier not found" });
    }

    // زيادة الرصيد المستحق للمورد
    supplier.remainingBalance += amount;



       await supplier.save();

    res.status(200).json({
      message: "Debt added to supplier successfully",
      remaining: supplier.remainingBalance
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};


// Delete supplier
// exports.deleteSupplier = async (req, res) => {
//     try {
//         const id = req.params.id;

//         if (!id) {
//             return res.status(400).json({ message: "invalid id" });
//         }

//         const supplier = await suppliersModel.findByIdAndDelete(id);

//         if (!supplier) {
//             return res.status(404).json({ message: "supplier not found" });
//         }

//         res.status(200).json({
//             message: "supplier deleted successfully",
//             data: supplier
//         });

//     } catch (e) {
//         console.log("error: " + e);
//         res.status(500).json({ message: "server error" });
//     }
// };




