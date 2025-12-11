const express = require("express");
const invoiceReturn = require(`${__dirname}/../controller/invoiceReturnController`);
const router = express.Router();
const { protect, restrictTo } = require(`${__dirname}/../middleWare/authMiddleware`);

// أي حد عامل login يقدر يشوف البيانات
router.use(protect);
// اللي بعد كده admin فقط
router.use(restrictTo("admin"));

// GET all purchase returns
router.get("/", invoiceReturn.getAllReturnInvoices);

// GET purchase return by ID
router.get("/:id", invoiceReturn.getReturnInvoiceById);



// // DELETE purchase return by ID
// router.delete("/:id", invoiceReturnModel.deletePurchaseReturn);

module.exports = router;

