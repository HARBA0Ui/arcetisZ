export class ApiError extends Error {
  statusCode: number;
  code?: string;
  isSessionError: boolean;

  constructor(statusCode: number, message: string, options?: { code?: string; isSessionError?: boolean }) {
    super(message);
    this.statusCode = statusCode;
    this.code = options?.code;
    this.isSessionError = options?.isSessionError ?? false;
    this.name = "ApiError";
  }
}
