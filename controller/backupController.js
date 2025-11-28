const customersModel = require(`${__dirname}/../Models/customerModel`);
const InvoiceModel=require(`${__dirname}/../Models/invoiceModel`)
const invoiceReturnModel = require(`${__dirname}/../Models/invoiceReturnModel`);
const ProductModel = require(`${__dirname}/../Models/productModel`);
const ExpenseModel=require(`${__dirname}/../Models/expensesModel`)
const PurchaseModel = require(`${__dirname}/../Models/purchaseModel`);
const SupplierModel = require(`${__dirname}/../Models/supplierModel`);
const PurchaseReturnModel = require(`${__dirname}/../Models/purchaseReturnModel`);
const User = require(`${__dirname}/../Models/userModel`);

exports.createBackup = async (req, res) => {
    try{
    const customers = await customersModel.find()
    const invoices = await InvoiceModel.find()
    const invoiceReturns = await invoiceReturnModel.find()
    const products = await ProductModel.find()
    const expenses = await ExpenseModel.find()
    const purchases = await PurchaseModel.find()
    const suppliers = await SupplierModel.find()
    const purchaseReturns = await PurchaseReturnModel.find()
    const users = await User.find()
    res.status(200).json({
        customers,
        invoices,
        invoiceReturns, 
        products,
        expenses,
        purchases,
        suppliers,
        purchaseReturns,
        users
    });

    } catch(error){
        res.status(500).json({ message: "Backup error", error: error.message });
    }
}