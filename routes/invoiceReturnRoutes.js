const express = require("express");
const purchaseReturnController = require(`${__dirname}/../controller/purchaseReturnController`);
const router = express.Router();
const { protect, restrictTo } = require(`${__dirname}/../middleWare/authMiddleware`);

// أي حد عامل login يقدر يشوف البيانات
router.use(protect);

// GET all purchase returns
router.get("/", purchaseReturnController.getAllPurchaseReturns);

// GET purchase return by ID
router.get("/:id", purchaseReturnController.getPurchaseReturnById);

// اللي بعد كده admin فقط
router.use(restrictTo("admin"));

// DELETE purchase return by ID
router.delete("/:id", purchaseReturnController.deletePurchaseReturn);

module.exports = router;
