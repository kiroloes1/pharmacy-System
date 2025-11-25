const express = require("express");
const router = express.Router(); // مهم: استخدم Router وليس express()
const {
  getAllExpenses,
  getExpenseById,
  createExpense,
  updateExpense,
  deleteExpense,
  profit
} = require(`${__dirname}/../controller/expensescontroller`); // عدل المسار حسب مشروعك

const { protect, restrictTo } = require(`${__dirname}/../middleWare/authMiddleware`);

// حماية جميع المسارات
router.use(protect);
router.use(restrictTo("admin")); // فقط الادمن يقدر يستخدمها

// ====== Routes ======
// GET all expenses
router.get("/", getAllExpenses);

// GET single expense by ID
router.get("/getExpense/:id", getExpenseById);

// POST create new expense
router.post("/", createExpense);

// PUT update expense
router.put("/:id", updateExpense);

// DELETE expense
router.delete("/:id", deleteExpense);

router.get("/profit", profit);



module.exports = router;
