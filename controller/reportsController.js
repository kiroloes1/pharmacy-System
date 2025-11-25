const express = require('express');

// Models (fixed naming)
const InvoiceModel = require(`${__dirname}/../Models/invoiceModel`);
const ExpenseModel = require(`${__dirname}/../Models/expensesModel`);
const PurchaseModel = require(`${__dirname}/../Models/purchaseModel`);
const Customer = require(`${__dirname}/../Models/customerModel`);
const SupplierModel = require(`${__dirname}/../Models/supplierModel`);
const ProductModel = require(`${__dirname}/../Models/productModel`);


// ======================= Daily Report =======================
exports.dailyReport = async (req, res) => {
  try {
    const { date } = req.query;

    const start = new Date(date + "T00:00:00");
    const end = new Date(date + "T23:59:59");

    const invoices = await InvoiceModel.find({ createdAt: { $gte: start, $lte: end }});
    const expenses = await ExpenseModel.find({ createdAt: { $gte: start, $lte: end }});
    const purchases = await PurchaseModel.find({ createdAt: { $gte: start, $lte: end }});

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


// ======================= Monthly Report =======================
exports.monthlyReport = async (req, res) => {
  try {
    const { year, month } = req.query;

    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59);

    const invoices = await InvoiceModel.find({ createdAt: { $gte: start, $lte: end }});
    const expenses = await ExpenseModel.find({ createdAt: { $gte: start, $lte: end }});
    const purchases = await PurchaseModel.find({ createdAt: { $gte: start, $lte: end }});

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


// ======================= Yearly Report =======================
exports.yearlyReport = async (req, res) => {
  try {
    const { year } = req.query;

    const start = new Date(year, 0, 1);
    const end = new Date(year, 11, 31, 23, 59, 59);

    const invoices = await InvoiceModel.find({ createdAt: { $gte: start, $lte: end }});
    const expenses = await ExpenseModel.find({ createdAt: { $gte: start, $lte: end }});
    const purchases = await PurchaseModel.find({ createdAt: { $gte: start, $lte: end }});

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


// ======================= System Summary Report =======================
exports.reports = async (req, res) => {
  try {
    const invoices = await InvoiceModel.find({});
    const customers = await Customer.find({});
    const purchases = await PurchaseModel.find({});
    const suppliers = await SupplierModel.find({});
    const products = await ProductModel.find({});
    const expenses = await ExpenseModel.find({});

    const summary = {
      invoicesLength: invoices.length,
      customersLength: customers.length,
      purchasesLength: purchases.length,
      suppliersLength: suppliers.length,
      productsLength: products.length,

      totalSales: invoices.reduce((acc, curr) => acc + curr.totalAfterDiscount, 0),
      totalPurchases: purchases.reduce((acc, curr) => acc + curr.totalAfterDiscount, 0),
      totalExpenses: expenses.reduce((acc, curr) => acc + curr.amount, 0)
    };

    summary.totalProfit =
      summary.totalSales - summary.totalPurchases - summary.totalExpenses;

    return res.status(200).json({ summary });

  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

