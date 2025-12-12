const Expense = require(`${__dirname}/../Models/expensesModel`); // عدل المسار حسب مشروعك
const InvoiceModel = require(`${__dirname}/../Models/invoiceModel`);

//  GET all expenses 
exports.getAllExpenses = async (req, res) => {
  try {
    const expenses = await Expense.find().populate("User", "name email").sort({ _id: -1 }); // لو عندك اسم أو إيميل مستخدم
    res.status(200).json({
      message: "Success",
      results: expenses.length,
      data: expenses
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

//  GET single expense by ID 
exports.getExpenseById = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id).populate("User", "name email");
    if (!expense) {
      return res.status(404).json({ message: "Expense not found" });
    }
    res.status(200).json({ message: "Success", data: expense });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

//  CREATE expense 
exports.createExpense = async (req, res) => {
  try {
    const { amount, User,note } = req.body;

    if (!amount || !User) {
      return res.status(400).json({ message: "Amount and User are required" });
    }

    const newExpense = await Expense.create({
      amount,
      User,
      note,
      Date: Date.now()
    });

    res.status(201).json({
      message: "Expense created successfully",
      data: newExpense
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

//  UPDATE expense 
exports.updateExpense = async (req, res) => {
  try {
    const updatedExpense = await Expense.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!updatedExpense) {
      return res.status(404).json({ message: "Expense not found" });
    }

    res.status(200).json({
      message: "Expense updated successfully",
      data: updatedExpense
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

//  DELETE expense 
exports.deleteExpense = async (req, res) => {
  try {
    const deletedExpense = await Expense.findByIdAndDelete(req.params.id);

    if (!deletedExpense) {
      return res.status(404).json({ message: "Expense not found" });
    }

    res.status(200).json({
      message: "Expense deleted successfully",
      data: deletedExpense
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Profits
exports.profit = async (req, res) => {
  try {
    const invoices = await InvoiceModel.find().populate({
      path: "products.productId",
      model: "Products"
    });

    const expenses = await Expense.find();
    let amountExpense=expenses.reduce((acc,curr)=>{
        return acc+=curr.amount;
    },0)
   

    let totalProfit = 0;

    for (const inv of invoices) {
      const discountFactor = (100 - inv.discount) / 100;
      for (const pro of inv.products) {
        const sellPrice = pro.unitPrice || pro.sellPrice || 0;
        const purchasePrice = pro.productId.purchasePrice || 0;
        const quantity = pro.quantity || 1;

        totalProfit += (sellPrice * discountFactor - purchasePrice) * quantity;
      }
    }
    totalProfit=  totalProfit-amountExpense;

    res.status(200).json({
      message: "Total profit calculated successfully",
      totalProfit
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

