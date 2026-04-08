import { SetMetadata } from "@nestjs/common";

export interface OperationLogOptions {
  module: string;
  action: string;
}

export const OPERATION_LOG_KEY = "operation_log";
export const OperationLog = (options: OperationLogOptions) =>
  SetMetadata(OPERATION_LOG_KEY, options);
