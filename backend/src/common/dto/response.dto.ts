export class ResponseDto<T> {
  code: number;
  message: string;
  data: T;
  timestamp: string;

  constructor(code: number, message: string, data: T) {
    this.code = code;
    this.message = message;
    this.data = data;
    this.timestamp = new Date().toISOString();
  }

  static success<T>(data: T, message = 'Success'): ResponseDto<T> {
    return new ResponseDto(0, message, data);
  }

  static error<T>(message: string, code = -1, data?: T): ResponseDto<T | null> {
    return new ResponseDto(code, message, data ?? null);
  }
}
