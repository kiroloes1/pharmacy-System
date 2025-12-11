const express = require("express");
const purchaseController = require(`${__dirname}/../controller/purchaseReturnController`);
const { protect, restrictTo } = require(`${__dirname}/../middleWare/authMiddleware`);

const router = express.Router();

// أي حد عامل login
router.use(protect);

// Admin only for delete
router.use(restrictTo("admin"));
// GET all purchases
router.get("/", purchaseController.getAllPurchaseReturns);

// GET purchase by id
router.get("/:id", purchaseController.getPurchaseReturnById);




// Delete purchase
router.delete("/:id", purchaseController.deletePurchaseReturn);

module.exports = router;

