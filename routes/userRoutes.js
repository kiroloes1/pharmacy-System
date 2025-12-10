const express = require("express");
const router = express.Router();
const userController = require(`${__dirname}/../controller/userController`);
const {protect}=require(`${__dirname}/../middleWare/authMiddleware`);


const resetPassword = require(`${__dirname}/../resetPassword/resetPassword`);


router.post("/send-reset-code", resetPassword.sendResetCode);
router.post("/verify-code",     resetPassword.verifyResetCode);
router.post("/reset-password",  resetPassword.resetPassword);


// Create new user
router.post("/signUp", userController.createNewUser);

// login 
router.post("/login", userController.userLogin);


router.use(protect);

// Get all user
router.get("/", userController.getAllUsers);

// Get user by ID
router.get("/getUserById/:id", userController.getUserById);

router.put("/:id", userController.BlockUser); 


// update user
router.patch("/:id", userController.updateUser);

// delete
router.delete("/:id", userController.deleteUser);


module.exports = router;



