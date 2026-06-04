class ApiResponse {
  static success(data = null, message = 'OK', statusCode = 200) {
    return { success: true, message, statusCode, data };
  }

  static error(message = 'Error', statusCode = 400, errors = null) {
    return { success: false, message, statusCode, errors };
  }
}

module.exports = ApiResponse;
