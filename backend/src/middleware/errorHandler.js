const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

const errorHandler = (err, req, res, next) => {
  console.error(err.stack);
  const status = err.status || (res.statusCode === 200 ? 500 : res.statusCode);
  const message = err.message || 'Internal Server Error';
  res.status(status).json({ error: message });
};

module.exports = { notFound, errorHandler };