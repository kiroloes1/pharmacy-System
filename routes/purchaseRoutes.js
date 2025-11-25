const express = require("express");
const router = express.Router();
const purchaseController = require(`${__dirname}/../controller/purchaseController`);


const { protect, restrictTo } = require(`${__dirname}/../middleWare/authMiddleware`);

// أي حد عامل login يقدر يشوف البيانات
router.use(protect);

// Get all purchases
router.get("/", purchaseController.getAllPurchases);

// Get purchase by ID
router.get("/:id", purchaseController.getPurchase);




router.use(restrictTo("admin"));

// update
router.patch("/:id", purchaseController.editPurchase);

// Create new purchase
router.post("/", purchaseController.createPurchase);

// update the purchase(return)/
router.put("/purchaseReturn/:id", purchaseController.returnPurchase);




module.exports = router;
