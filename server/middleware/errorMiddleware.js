// middleware/errorMiddleware.js

export const notFound = (req, res, next) => {
  const _error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(_error);
};

export const errorHandler = (err, req, res) => {
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message;

  // Mongoose bad ObjectId
  if (err.name === "CastError") {
    message = "Resource not found";
    statusCode = 404;
  }

  // Duplicate key error
  if (err.code === 11000) {
    message = "Duplicate field value entered";
    statusCode = 400;
  }

  res.status(statusCode).json({
    message,
    stack: process.env.NODE_ENV === "production" ? null : err.stack,
  });
};