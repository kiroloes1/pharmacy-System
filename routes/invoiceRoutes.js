const express = require("express");
const router = express.Router();
const invoiceController = require(`${__dirname}/../controller/invoiceController`);

const { protect, restrictTo } = require(`${__dirname}/../middleWare/authMiddleware`);

// أي حد عامل login يقدر يشوف البيانات
router.use(protect);

router.use(restrictTo("admin"));


// Get all invoice
router.get("/", invoiceController.getAllInvoice);

// Get invoice by ID
router.get("/getElementByID/:id", invoiceController.getInvoice);

// bestSeller
router.get("/bestSellers", invoiceController.bestSellers);


// update invoice
router.patch("/editInvoice/:id", invoiceController.editInvoice);

router.get("/benfit", invoiceController.benefit);



// Create new invoice
router.post("/", invoiceController.createInvoice);

// update the invoice(return)
router.put("/returnInvoice/:id", invoiceController.returnInvoice);


module.exports = router;

