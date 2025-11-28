const express = require("express");
const app = express();
const port = process.env.PORT || 8000;
const errorHandler = require("./middleWare/errorMiddleware");
const mongodbConfig = require(`${__dirname}/config/config.js`);

// start connect with mongo DB
mongodbConfig();

// routes
const customerRouter = require(`${__dirname}/routes/customerRoutes`);
const invoiceRouter = require(`${__dirname}/routes/invoiceRoutes`);
const productRouter = require(`${__dirname}/routes/productRoutes`);
const purchaseRouter = require(`${__dirname}/routes/purchaseRoutes`);
const supplierRouter = require(`${__dirname}/routes/supplierRoutes`);
const userRouter = require(`${__dirname}/routes/userRoutes`);
const purchasesReturnRouter = require(`${__dirname}/routes/PurchaseReturnRoutes`);
const invoicesReturnRouter = require(`${__dirname}/routes/invoiceReturnRoutes`);
const expensesRouter = require(`${__dirname}/routes/expenseRoutes`);
const reportRouter = require(`${__dirname}/routes/reportRoutes`);
const backupRouter = require(`${__dirname}/routes/backupRoutes`);


const cors = require("cors");


app.use(cors()); // يسمح لأي دومين

app.use(express.json());

// use routes
app.use("/v1/Customers", customerRouter);
app.use("/v1/Products", productRouter);
app.use("/v1/Suppliers", supplierRouter);
app.use("/v1/Users", userRouter);
app.use("/v1/Invoices", invoiceRouter);
app.use("/v1/Purchases", purchaseRouter);
app.use("/v1/PurchasesReturn", purchasesReturnRouter);
app.use("/v1/InvoicesReturn", invoicesReturnRouter);
app.use("/v1/Expenses", expensesRouter);
app.use("/v1/reports", reportRouter);
app.use("/v2/backup",backupRouter)

// error middleware
app.use(errorHandler);

// start server
app.listen(port, () => {
  console.log("Server running on port", port);
});



