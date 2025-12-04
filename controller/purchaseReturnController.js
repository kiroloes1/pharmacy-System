const PurchaseReturn = require(`${__dirname}/../Models/purchaseReturnModel`);


// get All Purchase Returns
exports.getAllPurchaseReturns = async (req, res) => {
    try {
        const returns = await PurchaseReturn.find()
            .populate("purchaseId")
            .populate("supplierId")
            .populate("products.productId")
        .sort({ _id: -1 });

        return res.status(200).json({
            message: "success",
            results: returns.length,
            data: returns
        });

    } catch (err) {
        return res.status(500).json({ message: "server error" });
    }
};



// get Purchase Return By Id
exports.getPurchaseReturnById = async (req, res) => {
    try {
        const id = req.params.id;

        const returnData = await PurchaseReturn.findById(id)
            .populate("purchaseId")
            .populate("supplierId")
            .populate("products.productId");

        if (!returnData) {
            return res.status(404).json({ message: "Purchase return not found" });
        }

        return res.status(200).json({
            message: "success",
            data: returnData
        });

    } catch (err) {
        return res.status(500).json({ message: "server error" });
    }
};



// delete Purchase Return
exports.deletePurchaseReturn = async (req, res) => {
    try {
        const id = req.params.id;

        const deleted = await PurchaseReturn.findByIdAndDelete(id);

        if (!deleted) {
            return res.status(404).json({ message: "Purchase return not found" });
        }

        return res.status(200).json({ message: "Deleted successfully" });

    } catch (err) {
        return res.status(500).json({ message: "server error" });
    }
};


