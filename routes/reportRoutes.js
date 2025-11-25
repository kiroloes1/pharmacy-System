const express = require("express");
const router = express.Router();
const reportsController = require(`${__dirname}/../controller/reportsController`);
const { protect, restrictTo } = require(`${__dirname}/../middleWare/authMiddleware`);

router.use(protect);
router.use(restrictTo("admin"));

// ==================== Routes ====================

router.get("/system", reportsController.reports);


router.get("/daily", reportsController.dailyReport);


router.get("/monthly", reportsController.monthlyReport);


router.get("/yearly", reportsController.yearlyReport);

module.exports = router;
