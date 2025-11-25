const express = require("express");
const router = express.Router();
const supplierController = require(`${__dirname}/../controller/supplierController`);
const { protect, restrictTo } = require(`${__dirname}/../middleWare/authMiddleware`);

// أي حد عامل login يقدر يشوف البيانات
router.use(protect);


// Routes عامة
router.get("/", supplierController.getAllSuppliers);
router.get("/:id", supplierController.getSupplierById);
router.get("/filter/search", supplierController.FilterSupplier);


// باقي العمليات Admin فقط
router.use(restrictTo("admin"));
router.post("/", supplierController.createNewSupplier);
router.put("/:id", supplierController.updateSupplier);
// router.delete("/:id", supplierController.deleteSupplier);

router.put("/collection/:id", supplierController.collection);
router.put("/addToSupplierBalance/:id", supplierController.addToSupplierBalance);


module.exports = router;
