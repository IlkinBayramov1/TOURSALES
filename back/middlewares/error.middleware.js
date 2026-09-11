export const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const status = err.status || 'error';
  const message = err.message || 'Internal Server Error';

  // Only log full stack trace for internal server errors (5xx)
  if (statusCode >= 500) {
    console.error(`[Server Error ${statusCode}] ${req.method} ${req.originalUrl}:`, {
      message,
      stack: err.stack
    });
  } else {
    // 4xx are standard client/auth responses
    console.warn(`[Client Notice ${statusCode}] ${req.method} ${req.originalUrl}: ${message}`);
  }

  return res.status(statusCode).json({
    status,
    msg: message,
    stack: process.env.NODE_ENV === 'development' && statusCode >= 500 ? err.stack : undefined
  });
};

export default errorHandler;
