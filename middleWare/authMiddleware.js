const jwt = require("jsonwebtoken");

exports.protect = async (req, res, next) => {
  try {



      if (req.originalUrl.includes("signUp") || req.originalUrl.includes("login")) {
    return next();
  }
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({ message: "Not logged in" });
    }

    const decoded = jwt.verify(token, process.env.SECRET_KEY);

    req.user = decoded; 

    next();
  } catch (err) {
  if (err.name === "TokenExpiredError") {
    return res.status(401).json({ message: "Token expired, please login again" });
  }
  return res.status(401).json({ message: "Invalid token" });
}
};

// BACR
exports.restrictTo = (...roles) => {
  return (req, res, next) => {

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: "You do not have permission to perform this action"
      });
    }

    next();
  };
};

