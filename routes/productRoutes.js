const express = require("express");
const router = express.Router();
const productsController = require(`${__dirname}/../controller/productController`);

const { protect, restrictTo } = require(`${__dirname}/../middleWare/authMiddleware`);

// أي حد عامل login يقدر يشوف البيانات
router.use(protect);


// Get all products
router.get("/", productsController.getAllProducts);


router.use(restrictTo("admin"));
// Get product by ID
router.get("/ProductByID/:id", productsController.getProductById);


// ا
router.get("/ProductSearch", productsController.filterProduct);

// Create new product
router.post("/", productsController.createProduct);






// Update product
router.patch("/:id", productsController.updateProduct);

// Delete product
router.delete("/:id", productsController.deleteProduct);

module.exports = router;

