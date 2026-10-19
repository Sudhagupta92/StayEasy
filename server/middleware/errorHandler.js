import { ENV } from '../config/env.js';
import { errorResponse } from '../utils/apiResponse.js';

export const errorHandler = (err, req, res, next) => {
  console.error(`[Unhandled Error] ${req.method} ${req.originalUrl}:`, err);

  let statusCode = err.statusCode || err.status || 500;
  let message = err.message || 'Internal Server Error';

  // Handle Mongoose CastError (Invalid ObjectId)
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    statusCode = 400;
    message = `Invalid format for resource identifier '${err.path}'`;
  }

  // Handle Mongoose ValidationError
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors || {})
      .map((e) => e.message)
      .join(', ');
  }

  // Handle MongoServerError 11000 (Duplicate Key Error)
  if (err.name === 'MongoServerError' && err.code === 11000) {
    statusCode = 400;
    const field = Object.keys(err.keyPattern || {})[0] || 'field';
    message = `A resource with this '${field}' already exists`;
  }

  const errors = ENV.NODE_ENV === 'development' ? {
    stack: err.stack,
    details: err.details || null,
  } : undefined;

  return errorResponse(res, message, statusCode, errors);
};
