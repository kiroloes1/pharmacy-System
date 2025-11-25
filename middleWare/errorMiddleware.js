
// middleware/errorMiddleware.js
const errorHandler = (err, res, ) => {
  console.error(err.stack); // لطباعة الخطأ في السيرفر للdebug

  // Default error
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  res.status(statusCode).json({
    success: false,
    message: message
  });
};

module.exports = errorHandler;
