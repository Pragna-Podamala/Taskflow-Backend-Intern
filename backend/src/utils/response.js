/**
 * Standardized API response helper
 */
const sendResponse = (res, statusCode, success, message, data = null, meta = null) => {
  const response = { success, message };
  if (data !== null) response.data = data;
  if (meta !== null) response.meta = meta;
  return res.status(statusCode).json(response);
};

const successResponse = (res, message, data = null, statusCode = 200, meta = null) =>
  sendResponse(res, statusCode, true, message, data, meta);

const errorResponse = (res, message, statusCode = 400, errors = null) => {
  const response = { success: false, message };
  if (errors) response.errors = errors;
  return res.status(statusCode).json(response);
};

module.exports = { successResponse, errorResponse };
