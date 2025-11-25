const customersModel = require(`${__dirname}/../Models/customerModel`);
const InvoiceModel=require(`${__dirname}/../Models/invoiceModel`)

// Get all customers
exports.getAllCustomers = async (req, res) => {
    try {
        const customers = await customersModel.find()
        .populate({
        path: "invoices",
        populate: {
        path: "products.productId",
        model: "Products"
        }
    });



        res.status(200).json({
            message: "success",
            data: customers,

        });

    } catch (e) {
        console.log("error: " + e);
        res.status(500).json({ message: "server error" });
    }
};

// get customer by id
exports.getCustomerById=async (req , res)=>{
    try {
        const id = req.params.id;
        const customer = await customersModel.findById(id)
        .populate({
        path: "invoices",
        populate: {
        path: "products.productId",
        model: "Products"
        }
    });




        if (!customer) {
            return res.status(404).json({ message: "customer not found" });
        }

        res.status(200).json({
            message: "success",
            data: customer,

        });
    } catch (e) {
        res.status(500).json({ message: "server error" });
    }
}

// filter by search
exports.filterCustomer=async(req,res)=>{
  try{
        const search=req.query.CustomerSearch;
    if(!search){
            return res.status(400).json({ message: "Please provide search query" });
    }
    const FilterCustomer=await customersModel.find({
        $or:[
            {name:{$regex :search ,$options: "i"}},
            {companyName:{$regex :search,$options: "i"}}
        ]
    });
    if (FilterCustomer.length === 0) {
      return res.status(404).json({ message: "No products found matching this search" });
    }

    res.status(200).json({ message: "Successfully", data: FilterCustomer });
  } catch (error) {
    res.status(500).json({ message: `Error: ${error.message}` });
  }
}

// Create new customer
exports.CreateNewCustomer = async (req, res) => {
    try {
        const body = req.body;
        const {name } = req.body;


        // Validate request body
        if (!body || Object.keys(body).length === 0) {
            return res.status(400).json({ message: "please fill all fields" });
        }
   

        const existUser=await customersModel.findOne({name});
        if(existUser){
          return res.status(404).json({message:"هذا الاسم موجود من قبل يجب تغير الاسم لكي لا يحدث خطاء في البيانات"})
        }

        const newCustomer = await customersModel.create(body);

        res.status(201).json({
            message: "customer created successfully",
            data: newCustomer
        });

    } catch (e) {
        console.log("error: " + e);
        res.status(500).json({ message: "server error" });
    }
};

// update customer
exports.updateCustomer = async (req, res) => {
    try {
        const id = req.params.id;
        const body = req.body;

        if (!id || !body || Object.keys(body).length === 0) {
            return res.status(400).json({ message: "please fill all fields" });
        }

        const customer = await customersModel.findByIdAndUpdate(
            id,
            body,
            { new: true } // return updated document
        );

        if (!customer) {
            return res.status(404).json({ message: "customer not found" });
        }

        res.status(200).json({
            message: "success",
            data: customer
        });

    } catch (e) {
        console.log("error: " + e);
        res.status(500).json({ message: "server error" });
    }
};

// collection from customer
exports.collection = async (req, res) => {
  try {
    const id = req.params.id;
    let { collectionPaid, typeCollection } = req.body;

    if (collectionPaid <= 0) {
      return res.status(400).json({ message: "Please enter a valid amount" });
    }
    if (typeCollection !== "in" && typeCollection !== "out") {
      return res.status(400).json({ message: "Please enter a valid typeCollection" });
    }

    // جلب العميل وفواتيره
    const customer = await customersModel.findById(id).populate("invoices");
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    if (typeCollection === "out") {
      // صرف للعميل (مال خارج من النظام للعميل)
      await customersModel.findByIdAndUpdate(id, {
        $inc: { remainingBalance: collectionPaid },
        $push: { payments: { amount: collectionPaid, typeCollection: "out", date: new Date() } }
      });
    } else {
      // قبض من العميل (مال وارد من العميل للنظام)
      await customersModel.findByIdAndUpdate(id, {
        $inc: { remainingBalance: -collectionPaid },
        $push: { payments: { amount: collectionPaid, typeCollection: "in", date: new Date() } }
      });

      // تحديث كل الفواتير المفتوحة حسب المبلغ
      let remainingPayment = collectionPaid;
      for (let invoice of customer.invoices) {
        if (invoice.remaining >= remainingPayment) {
          await InvoiceModel.findByIdAndUpdate(invoice._id, { 
            $inc: { 
              remaining: -remainingPayment, 
              paid: remainingPayment 
            } 
          });
          remainingPayment = 0;
          break;
        } else {
          const currentRemaining = invoice.remaining;
          remainingPayment -= currentRemaining;
          await InvoiceModel.findByIdAndUpdate(invoice._id, { 
            $set: { remaining: 0 }, 
            $inc: { paid: currentRemaining } 
          });
        }
      }
    }

    res.status(200).json({ message: "Collection applied successfully to customer" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};


// // debt to customer
exports.addToCustomerBalance = async (req, res) => {
  try {
    const customerId = req.params.id;
    const { amount, note } = req.body; // المبلغ والتعليق اختياري

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "Please enter a valid amount" });
    }

    const customer = await customersModel.findById(customerId);
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

  
    customer.remainingBalance += amount;



    await customer.save();

    res.status(200).json({
      message: "Customer balance updated successfully",
      newBalance: customer.remainingBalance
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// delete customer
// exports.deleteCustomer = async (req, res) => {
//     try {
//         const id = req.params.id;

//         if (!id) {
//             return res.status(400).json({ message: "invalid id" });
//         }

//         const customer = await customersModel.findByIdAndDelete(id);

//         if (!customer) {
//             return res.status(404).json({ message: "customer not found" });
//         }

//         res.status(200).json({
//             message: "customer deleted successfully",
//             data: customer
//         });

//     } catch (e) {
//         console.log("error: " + e);
//         res.status(500).json({ message: "server error" });
//     }
// };

