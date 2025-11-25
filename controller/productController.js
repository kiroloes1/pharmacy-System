const Product = require(`${__dirname}/../Models/productModel`);

// Get all products
exports.getAllProducts = async (req, res) => {
  try {
    const now = new Date();
    const fourMonthsLater = new Date();
    fourMonthsLater.setMonth(fourMonthsLater.getMonth() + 4);

    // جلب كل المنتجات مع المورد
    const products = await Product.find().populate("supplierId");

    // تعيين IsNearlyExpired لكل منتج
    const updatedProducts = products.map(product => {
      const expDate = new Date(product.expiration);

      // المنتج منتهي الصلاحية أو قرب انتهاء الصلاحية خلال 4 أشهر
      if (expDate < now || (expDate >= now && expDate <= fourMonthsLater)) {
        product.IsNearlyExpired = true;
      } else {
        product.IsNearlyExpired = false;
      }

      return product;
    });

    return res.status(200).json({
      message: "success",
      results: updatedProducts.length,
      data: updatedProducts
    });

  } catch (e) {
    console.log("error: " + e);
    res.status(500).json({ message: "server error" });
  }
};


// Get product by ID
exports.getProductById = async (req, res) => {
    try {
        const id = req.params.id;
        const product = await Product.findById(id)
        .populate("supplierId")


        if (!product) {
            return res.status(404).json({ message: "product not found" });
        }

        res.status(200).json({
            message: "success",
            data: product
        });

    } catch (e) {
        console.log("error: " + e);
        res.status(500).json({ message: "server error" });
    }
};

exports.filterProduct = async (req, res) => {
  try {
    const search = req.query.productSearch;
    if (!search) {
      return res.status(400).json({ message: "Please provide search query" });
    }

  
    const FilterProduct = await Product.find({
      $or: [
        { name: { $regex: search, $options: "i" } },
        { ActiveIngredient: { $regex: search, $options: "i" } }
      ]
    });

    if (FilterProduct.length === 0) {
      return res.status(404).json({ message: "No products found matching this search" });
    }

    res.status(200).json({ message: "Successfully", data: FilterProduct });
  } catch (error) {
    res.status(500).json({ message: `Error: ${error.message}` });
  }
};

// Search products
exports.searchProducts = async (req, res) => {
  try {
    const search = req.query.search || "";

    const products = await ProductModel.find({
      $or: [
        { name: { $regex: search, $options: "i" } },
        { companyName: { $regex: search, $options: "i" } },
        { barcode: { $regex: search, $options: "i" } }
      ]
    })
    .limit(30)
    .select("name companyName sellPrice purchasePrice quantity");

    res.status(200).json({
      status: "success",
      results: products.length,
      data: products
    });

  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};


// Create new product
exports.createProduct = async (req, res) => {
    try {
        const body = req.body;
       

        if (!body || Object.keys(body).length === 0) {
            return res.status(400).json({ message: "please fill all fields" });
        }

 
        const newProduct = await Product.create(body);

        res.status(201).json({
            message: "product created successfully",
            data: newProduct
        });

    } catch (e) {
        console.log("error: " + e);
        res.status(500).json({ message: "server error" });
    }
};

// Update product => (only allowed fields)
exports.updateProduct = async (req, res) => {
    try {
        const id = req.params.id;
        const body = req.body;

        if (!id || !body || Object.keys(body).length === 0) {
            return res.status(400).json({ message: "please provide fields to update" });
        }

       
        const allowedFields = ["name", "purchasePrice", "sellPrice", "quantity", "companyName", "expiration"];
        const updates = {};
        for (let key of allowedFields) {
            if (body[key] !== undefined) updates[key] = body[key];
        }

        const product = await Product.findByIdAndUpdate(id, updates, { new: true });

        if (!product) {
            return res.status(404).json({ message: "product not found" });
        }

        res.status(200).json({
            message: "product updated successfully",
            data: product
        });

    } catch (e) {
        console.log("error: " + e);
        res.status(500).json({ message: "server error" });
    }
};

// Delete product
exports.deleteProduct = async (req, res) => {
    try {
        const id = req.params.id;

        if (!id) {
            return res.status(400).json({ message: "invalid id" });
        }

        const product = await Product.findByIdAndDelete(id);

        if (!product) {
            return res.status(404).json({ message: "product not found" });
        }

        res.status(200).json({
            message: "product deleted successfully",
            data: product
        });

    } catch (e) {
        console.log("error: " + e);
        res.status(500).json({ message: "server error" });
    }
};

exports.getExpiredProducts = async (req, res) => {
    try {
        const now = new Date();

     const productsNearlyExpired = await Product.find({
    $or: [
        {
            expiration: {
                $gte: now,
                $lte: fourMonthsLater
            }
        },
        {
            expiration: {
                $lt: now
            }
        }
    ]
});


        res.status(200).json({
            message: "success",
            productsNearlyExpired: productsNearlyExpired
        });
    } catch (error) {
        res.status(500).json({ message: "server error" });
    }
};

