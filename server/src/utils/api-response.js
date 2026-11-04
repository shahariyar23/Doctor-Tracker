export class ApiResponse {
  /**
   * @param {number} statusCode - HTTP status code
   * @param {string} [message="Operation completed successfully"] - Response message
   * @param {any} [data={}] - Response payload
   * @param {any} [meta=null] - Pagination / auxiliary metadata
   */
  constructor(statusCode, message = "Operation completed successfully", data = {}, meta = null) {
    this.success = statusCode < 400;
    this.message = message;
    this.data = data;
    this.meta = meta;
  }

  static success(res, { statusCode = 200, message = "Operation completed successfully", data = {}, meta = null } = {}) {
    return res.status(statusCode).json(new ApiResponse(statusCode, message, data, meta));
  }

  static created(res, { message = "Resource created successfully", data = {}, meta = null } = {}) {
    return res.status(201).json(new ApiResponse(201, message, data, meta));
  }
}
