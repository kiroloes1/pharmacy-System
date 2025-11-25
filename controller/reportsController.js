exports.dailyReport = async (req, res) => {
  try {
    const { date } = req.query; // YYYY-MM-DD

    const start = new Date(date + "T00:00:00");
    const end = new Date(date + "T23:59:59");

    // invoices of that day
    const invoices = await InvoiceModel.find({
      createdAt: { $gte: start, $lte: end }
    });

    const expenses = await Expense.find({
      createdAt: { $gte: start, $lte: end }
    });

    const purchases = await purchaseModel.find({
      createdAt: { $gte: start, $lte: end }
    });

    const totalSales = invoices.reduce((acc, c) => acc + c.totalAfterDiscount, 0);
    const totalPurchases = purchases.reduce((acc, c) => acc + c.totalAfterDiscount, 0);
    const totalExpenses = expenses.reduce((acc, c) => acc + c.amount, 0);

    const profit = totalSales - totalPurchases - totalExpenses;

    res.json({
      date,
      totalSales,
      totalPurchases,
      totalExpenses,
      profit,
      invoiceCount: invoices.length
    });

  } catch (error) {
    res.status(500).json({ message: "Daily report error", error: error.message });
  }
};
exports.monthlyReport = async (req, res) => {
  try {
    const { year, month } = req.query; // month = 1..12

    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59);

    const invoices = await InvoiceModel.find({
      createdAt: { $gte: start, $lte: end }
    });

    const expenses = await Expense.find({
      createdAt: { $gte: start, $lte: end }
    });

    const purchases = await purchaseModel.find({
      createdAt: { $gte: start, $lte: end }
    });

    const totalSales = invoices.reduce((acc, c) => acc + c.totalAfterDiscount, 0);
    const totalPurchases = purchases.reduce((acc, c) => acc + c.totalAfterDiscount, 0);
    const totalExpenses = expenses.reduce((acc, c) => acc + c.amount, 0);

    const profit = totalSales - totalPurchases - totalExpenses;

    res.json({
      year,
      month,
      totalSales,
      totalPurchases,
      totalExpenses,
      profit,
      invoiceCount: invoices.length
    });

  } catch (error) {
    res.status(500).json({ message: "Monthly report error", error: error.message });
  }
};
exports.yearlyReport = async (req, res) => {
  try {
    const { year } = req.query;

    const start = new Date(year, 0, 1);
    const end = new Date(year, 11, 31, 23, 59, 59);

    const invoices = await InvoiceModel.find({
      createdAt: { $gte: start, $lte: end }
    });

    const expenses = await Expense.find({
      createdAt: { $gte: start, $lte: end }
    });

    const purchases = await purchaseModel.find({
      createdAt: { $gte: start, $lte: end }
    });

    const totalSales = invoices.reduce((acc, c) => acc + c.totalAfterDiscount, 0);
    const totalPurchases = purchases.reduce((acc, c) => acc + c.totalAfterDiscount, 0);
    const totalExpenses = expenses.reduce((acc, c) => acc + c.amount, 0);

    const profit = totalSales - totalPurchases - totalExpenses;

    res.json({
      year,
      totalSales,
      totalPurchases,
      totalExpenses,
      profit,
      invoiceCount: invoices.length
    });

  } catch (error) {
    res.status(500).json({ message: "Yearly report error", error: error.message });
  }
};
// reports to all systems
exports.reports = async (req, res) => {
  try {
    const invoices = await InvoiceModel.find({});
    const customers = await Customer.find({});
    const purchases = await purchaseModel.find({});
    const suppliers = await supplierModel.find({});
    const products = await ProductModel.find({});
    const expenses = await Expense.find({});

    const invoicesLength = invoices.length;
    const customersLength = customers.length;
    const purchasesLength = purchases.length;
    const suppliersLength = suppliers.length;
    const productsLength = products.length;

    // Total Expenses
    const totalExpenses = expenses.reduce((acc, curr) => acc + curr.amount, 0);

    // Total Sales 
    const totalSales = invoices.reduce((acc, curr) => acc + curr.totalAfterDiscount, 0);

    // Total Purchases
    const totalPurchases = purchases.reduce((acc, curr) => acc + curr.totalAfterDiscount, 0);

    // Profit
    const totalProfit = totalSales - totalPurchases - totalExpenses;

    return res.status(200).json({
      summary: {
        invoicesLength,
        customersLength,
        purchasesLength,
        suppliersLength,
        productsLength,
        totalSales,
        totalPurchases,
        totalExpenses,
        totalProfit
      }
    });

  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};
