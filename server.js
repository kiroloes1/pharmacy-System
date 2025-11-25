const express=require("express");
const app=express();
const port = process.env.PORT || 8000;
const errorHandler = require("./middleWare/errorMiddleware");
const mongodbConfig=require(`${__dirname}/config/config.js`);
// start connect with mongo DB
mongodbConfig();

// routes
const customerRouter=require(`${__dirname}/routes/customerRoutes`);
const invoiceRouter=require(`${__dirname}/routes/invoiceRoutes`);
const productRouter=require(`${__dirname}/routes/productRoutes`);
const purchaseRouter=require(`${__dirname}/routes/purchaseRoutes`);
const supplierRouter=require(`${__dirname}/routes/supplierRoutes`);
const userRouter=require(`${__dirname}/routes/userRoutes`);
const PurchasesReturn=require(`${__dirname}/routes/PurchaseReturnRoutes`);
const InvoicesReturn=require(`${__dirname}/routes/invoiceReturnRoutes`);
const Expenses=require(`${__dirname}/routes/expenseRoutes`);


const cors = require("cors");

app.use(cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
]));



app.use(express.json());


app.use("/v1/Customers",customerRouter);
app.use("/v1/Products",productRouter);
app.use("/v1/Suppliers",supplierRouter);
app.use("/v1/Users",userRouter);
app.use("/v1/Invoices",invoiceRouter);
app.use("/v1/Purchases",purchaseRouter);
app.use("/v1/PurchasesReturn",PurchasesReturn);
app.use("/v1/InvoicesReturn",InvoicesReturn);
app.use("/v1/Expenses",Expenses);



app.use(errorHandler);


app.listen(port,()=>{
    console.log("listen to port ..........");
    console.log(`Server running on port ${port}`);

})

