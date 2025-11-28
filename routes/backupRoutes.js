const express = require("express");
const router = express.Router();
const { protect, restrictTo } = require(`${__dirname}/../middleWare/authMiddleware`);

const backupController = require(`${__dirname}/../controller/backupController`);

router.use(protect);
router.use(restrictTo("admin"));

// Create a backup
router.get("/", backupController.createBackup);
module.exports = router; 