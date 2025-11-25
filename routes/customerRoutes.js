const express = require("express");
const router = express.Router();
const customerController = require(`${__dirname}/../controller/CustomerController`);
const { protect, restrictTo } = require(`${__dirname}/../middleWare/authMiddleware`);

// أي حد عامل login يقدر يشوف البيانات
router.use(protect);

// Get all customers
router.get("/", customerController.getAllCustomers);

// Get customer by ID
router.get("/getCustomerByID/:id", customerController.getCustomerById);

// search by name or conmpany name
router.get("/Customersearch",customerController.filterCustomer)



router.use(restrictTo("admin"));
// Create new customer
router.post("/", customerController.CreateNewCustomer);

// Update customer
router.patch("/:id", customerController.updateCustomer);

// Delete customer
// router.delete("/:id", customerController.deleteCustomer);
// collection
router.put("/collection/:id", customerController.collection);

router.put("/addToCustomerBalance/:id", customerController.addToCustomerBalance);




module.exports = router;
