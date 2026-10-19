import { errorResponse } from '../utils/apiResponse.js';

export const notFoundHandler = (req, res, next) => {
  return errorResponse(
    res,
    `Resource not found: ${req.method} ${req.originalUrl}`,
    404
  );
};
