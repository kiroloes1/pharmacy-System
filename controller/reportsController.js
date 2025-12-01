
const express = require('express');

// Models
const InvoiceModel = require(`${__dirname}/../Models/invoiceModel`);
const Expense = require(`${__dirname}/../Models/expensesModel`);
const purchaseModel = require(`${__dirname}/../Models/purchaseModel`);
const Customer = require(`${__dirname}/../Models/customerModel`);
const supplierModel = require(`${__dirname}/../Models/supplierModel`);
const ProductModel = require(`${__dirname}/../Models/productModel`);

function calculateReportFromInvoices(invoices, expenses) {
  let totalSales = 0;
 
  let totalExpenses = 0;

  // 1) إجمالي البيع
  totalSales = invoices.reduce((sum, inv) => sum + inv.totalAfterDiscount, 0);

  // 2) إجمالي المصروفات
  totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);


  

    let totalPurchase = 0;
    const productMap = new Map(products.map(p => [p._id.toString(), p]));

    // 3) Calculate purchase total efficiently
    for (const inv of invoices) {
      for (const item of inv.products) {
        const product = productMap.get(item.productId.toString());
        if (product) {
          totalPurchase += product.purchasePrice * item.quantity;
        }
      }
    }

  // 4) صافي الربح
  const profit = totalSales - totalPurchase - totalExpenses;

  return {
    totalSales,
    totalPurchase,
    totalExpenses,
    profit
  };
}


exports.dailyReport = async (req, res) => {
  try {
    const { date } = req.query;

    const start = new Date(date + "T00:00:00");
    const end = new Date(date + "T23:59:59");

    const invoices = await InvoiceModel.find({
      createdAt: { $gte: start, $lte: end }
    });

    const expenses = await Expense.find({
      createdAt: { $gte: start, $lte: end }
    });

    const result = calculateReportFromInvoices(invoices, expenses);

    res.json({
      date,
      ...result,
      invoiceCount: invoices.length
    });

  } catch (error) {
    res.status(500).json({ message: "Daily report error", error: error.message });
  }
};

exports.monthlyReport = async (req, res) => {
  try {
    const { year, month } = req.query;

    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59);

    const invoices = await InvoiceModel.find({
      createdAt: { $gte: start, $lte: end }
    });

    const expenses = await Expense.find({
      createdAt: { $gte: start, $lte: end }
    });

    const result = calculateReportFromInvoices(invoices, expenses);

    res.json({
      year,
      month,
      ...result,
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

    const result = calculateReportFromInvoices(invoices, expenses);

    res.json({
      year,
      ...result,
      invoiceCount: invoices.length
    });

  } catch (error) {
    res.status(500).json({ message: "Yearly report error", error: error.message });
  }
};

exports.reports = async (req, res) => {
  try {
    const invoices = await InvoiceModel.find({});
    const customers = await Customer.find({});
    const suppliers = await supplierModel.find({});
    const products = await ProductModel.find({});
    const expenses = await Expense.find({});

    const invoicesLength = invoices.length;
    const customersLength = customers.length;
    const suppliersLength = suppliers.length;
    const productsLength = products.length;

    // Total Expenses
    const totalExpenses = expenses.reduce((acc, curr) => acc + curr.amount, 0);

    // Total Sales (from invoices)
    const totalSales = invoices.reduce((acc, inv) => acc + inv.totalAfterDiscount, 0);

    // Total Purchases (from products inside invoices)
    let totalPurchases = 0;

    for (const inv of invoices) {
      for (const item of inv.products) {
        const purchasePrice = item.productId.purchasePrice;
        const qty = item.quantity;
        totalPurchases += purchasePrice * qty;
      }
    }

    // Profit
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

