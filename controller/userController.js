const User = require(`${__dirname}/../Models/userModel`);
const bcrypt = require("bcryptjs"); 
const jwt=require("jsonwebtoken");

// Get all users
exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find();

        res.status(200).json({
            message: "success",
            data: users
        });

    } catch (e) {
        console.log("error: " + e);
        res.status(500).json({ message: "server error" });
    }
};

// Get user by ID
exports.getUserById = async (req, res) => {
    try {
        const id = req.params.id;
        const user = await User.findById(id);

        if (!user) {
            return res.status(404).json({ message: "user not found" });
        }

        res.status(200).json({
            message: "success",
            data: user
        });

    } catch (e) {
        console.log("error: " + e);
        res.status(500).json({ message: "server error" });
    }
};

// login
exports.userLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message:  "الرجاء التأكد من ملئ كل الحقول" });
    }

    let existUser = await User.findOne({ email });
    if (!existUser) {
      return res.status(400).json({ message: "هذا الحساب غير مسجل في قاعده البيانات" });
    }

    const isPassword = await bcrypt.compare(password, existUser.password);
    if (!isPassword) {
      return res.status(400).json({ message: "الرقم السري الذي ادخلته غير صحيح" });
    }

    let token = jwt.sign(
      { email, id: existUser._id, role: existUser.role },
      process.env.SECRET_KEY,
      { expiresIn: "12h" }
    );

    // disActive all User
    await User.updateMany({}, { $set: { active: false } });

// Activate current user
existUser.active = true;
await existUser.save();

// Fetch fresh document
existUser = await User.findByIdAndUpdate(existUser._id);


    res.status(200).json({
      message: 'User logged in successfully',
      data: existUser,
      token: token
    });

  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Create new user (signUp)
exports.createNewUser = async (req, res) => {
    try {
        const { name, email, password,confirmPassword, role } = req.body;

          if (!name || !email || !password) {
            return res.status(400).json({ message: "الرجاء التأكد من ملئ كل الحقول" });
        }
        if(!confirmPassword){
            return res.status(400).json({message:" الرقم السري التأكيدي مطلوب" });
        }
      
        if(confirmPassword!=password){
              return res.status(400).json({
    message: "الرقم السري الذي ادخلته غير مطابق مع الرقم السري التأكيدي" 
  });
        }
        if(password.length<6){
                         return res.status(400).json({
    message: "الرقم السري الذي ادخلته يجب ان لايقل عن 6 كلمات " 
  });
        }
        const hashedPassword = await bcrypt.hash(password, 10);

        let newUser = await User.create({
            name,
            email,
            password: hashedPassword,
            role: role || "user"
        });
        const token=jwt.sign({email,id:newUser._id,role:newUser.role},process.env.SECRET_KEY,{expiresIn:"1hr"})

            // disActive all User
        await User.updateMany({}, { $set: { active: false } });

        // active the logging user
        newUser.active = true;
        await newUser.save();
              
       newUser = await User.findByIdAndUpdate(newUser._id);


        res.status(201).json({
            message: "user created successfully",
            data: newUser,
            token:token
        });

    } catch (e) {
        console.log("error: " + e);
        res.status(500).json({ message: "server error"+e.message });
    }
};
// Update user (only safe fields)
exports.updateUser = async (req, res) => {
    try {
        const id = req.params.id;
        
        const { name, role ,password , email,phone } = req.body;

        if (!id || (!name && !role)) {
            return res.status(400).json({ message: "الرجاء التأكد من ملئ كل الحقول" });
        }

        const updates = {};
        if (name) updates.name = name;
        if (role) updates.role = role;
        if (password) updates.password =await bcrypt.hash(password,10);
        if (email) updates.email = email;
        if (phone) updates.phone = phone;


        
        const user = await User.findByIdAndUpdate(id, updates, { new: true });

        if (!user) {
            return res.status(404).json({ message: "هذا الحساب غير مسجل في قاعده البيانات" });
        }

        res.status(200).json({
            message: "user updated successfully",
            data: user
        });

    } catch (e) {
        console.log("error: " + e);
        res.status(500).json({ message:e.message });
    }
};

// admin only has access to block any user
exports.BlockUser = async (req, res) => {
  try {
    const id = req.params.id;

  
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }


    user.blocked = !user.blocked;


    await user.save();

    res.status(200).json({
      message: "Successfully updated",
      userBlock: user.blocked
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// Delete user
exports.deleteUser = async (req, res) => {
    try {
        const id = req.params.id;

        if (!id) {
            return res.status(400).json({ message: "invalid id" });
        }

        const user = await User.findByIdAndDelete(id);

        if (!user) {
            return res.status(404).json({ message: "user not found" });
        }

        res.status(200).json({
            message: "user deleted successfully",
            data: user
        });

    } catch (e) {
        console.log("error: " + e);
        res.status(500).json({ message: "server error" });
    }
};



