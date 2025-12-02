const express = require('express');

// Models
const InvoiceModel = require(`${__dirname}/../Models/invoiceModel`);
const Expense = require(`${__dirname}/../Models/expensesModel`);
const Customer = require(`${__dirname}/../Models/customerModel`);
const supplierModel = require(`${__dirname}/../Models/supplierModel`);
const ProductModel = require(`${__dirname}/../Models/productModel`);

// Helper Function (used by daily/monthly/yearly)
async function calculateReportFromInvoices(invoices, expenses) {
  const totalSales = invoices.reduce((sum, inv) => sum + inv.totalAfterDiscount, 0);
  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  // Load all products once
  const products = await ProductModel.find({});
  const productMap = new Map(products.map(p => [p._id.toString(), p]));

  let totalPurchase = 0;

  // Calculate total purchase cost
  for (const inv of invoices) {
    for (const item of inv.products) {
      const product = productMap.get(item.productId.toString());
      if (product) {
        totalPurchase += product.purchasePrice * item.quantity;
      }
    }
  }

  const profit = totalSales - totalPurchase - totalExpenses;

  return {
    totalSales,
    totalPurchase,
    totalExpenses,
    profit
  };
}

// DAILY REPORT
exports.dailyReport = async (req, res) => {
  try {
    const { date } = req.query;

    const start = new Date(date + "T00:00:00");
    const end = new Date(date + "T23:59:59");

    const invoices = await InvoiceModel.find({ createdAt: { $gte: start, $lte: end } })
 
    const expenses = await Expense.find({ createdAt: { $gte: start, $lte: end } });

    const result = await calculateReportFromInvoices(invoices, expenses);


     const invoicess = await InvoiceModel.find({ createdAt: { $gte: start, $lte: end } })
                       .populate({
            path:"products.productId",
            model:"Products"
        });
    res.json({
      date,
      ...result,
      invoicess,
      invoiceCount: invoices.length
    });

  } catch (error) {
    res.status(500).json({ message: "Daily report error", error: error.message });
  }
};

// MONTHLY REPORT
exports.monthlyReport = async (req, res) => {
  try {
    const { year, month } = req.query;

    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59);

    const invoices = await InvoiceModel.find({ createdAt: { $gte: start, $lte: end } })
 
         const invoicess = await InvoiceModel.find({ createdAt: { $gte: start, $lte: end } })
                       .populate({
            path:"products.productId",
            model:"Products"
        });
    const expenses = await Expense.find({ createdAt: { $gte: start, $lte: end } });

    const result = await calculateReportFromInvoices(invoices, expenses);

    res.json({
      year,
      month,
      ...result,
      invoicess,
      invoiceCount: invoices.length
    });

  } catch (error) {
    res.status(500).json({ message: "Monthly report error", error: error.message });
  }
};

// YEARLY REPORT
exports.yearlyReport = async (req, res) => {
  try {
    const { year } = req.query;

    const start = new Date(year, 0, 1);
    const end = new Date(year, 11, 31, 23, 59, 59);

    const invoices = await InvoiceModel.find({ createdAt: { $gte: start, $lte: end } })

         const invoicess = await InvoiceModel.find({ createdAt: { $gte: start, $lte: end } })
                       .populate({
            path:"products.productId",
            model:"Products"
        });
    const expenses = await Expense.find({ createdAt: { $gte: start, $lte: end } });

    const result = await calculateReportFromInvoices(invoices, expenses);

    res.json({
      year,
      ...result,
      invoicess,
      invoiceCount: invoices.length
    });

  } catch (error) {
    res.status(500).json({ message: "Yearly report error", error: error.message });
  }
};

// MAIN DASHBOARD REPORT
exports.reports = async (req, res) => {
  try {
    const invoices = await InvoiceModel.find({});
    const customers = await Customer.find({});
    const suppliers = await supplierModel.find({});
    const products = await ProductModel.find({});
    const expenses = await Expense.find({});

    // Prepare product map
    const productMap = new Map(products.map(p => [p._id.toString(), p]));

    // Totals
    const invoicesLength = invoices.length;
    const customersLength = customers.length;
    const suppliersLength = suppliers.length;
    const productsLength = products.length;

    const totalExpenses = expenses.reduce((acc, curr) => acc + curr.amount, 0);
    const totalSales = invoices.reduce((acc, inv) => acc + inv.totalAfterDiscount, 0);

    // Total Purchases based on product purchasePrice
    let totalPurchases = 0;

    for (const inv of invoices) {
      for (const item of inv.products) {
        const product = productMap.get(item.productId.toString());
        if (product) {
          totalPurchases += product.purchasePrice * item.quantity;
        }
      }
    }

    const totalProfit = totalSales - totalPurchases - totalExpenses;

    return res.status(200).json({
      summary: {
        invoicesLength,
        customersLength,
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

