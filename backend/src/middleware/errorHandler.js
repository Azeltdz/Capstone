const config = require('../config/config');

function notFound(req, res, next) {
  res.status(404).json({ message: `Route not found: ${req.originalUrl}` });
}

function errorHandler(err, req, res, next) {
  if (err.name === 'MulterError') {
    err.statusCode = 400;
    if (err.code === 'LIMIT_FILE_SIZE') err.message = 'Image must be 5 MB or smaller.';
  }
  const status = err.statusCode || 500;
  if (status >= 500) console.error(err.stack);
  const isProd = process.env.NODE_ENV === 'production';
  res.status(status).json({
    message: status >= 500 && isProd ? 'Internal Server Error' : err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}

module.exports = { notFound, errorHandler };