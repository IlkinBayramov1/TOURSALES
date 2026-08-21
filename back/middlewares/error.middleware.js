export const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const status = err.status || 'error';
  const message = err.message || 'Internal Server Error';

  // Log error details for debugging
  console.error('Unhandled Error:', {
    message,
    statusCode,
    stack: err.stack
  });

  return res.status(statusCode).json({
    status,
    msg: message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
};

export default errorHandler;
