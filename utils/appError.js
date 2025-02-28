class AppError extends Error {
    constructor(message, statusCode = 500) {
        message = message || "Something went wrong";
        super(message);
        this.statusCode = statusCode;
        Error.captureStackTrace(this, this.constructor);
    }
}
export default AppError;


