export interface FieldValidationError {
  field: string;
  message: string;
}

/**
 * Standard RFC 9457 Problem Details model for client consumption.
 */
export interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance?: string;
  code?: string;
  errors?: FieldValidationError[];
  timestamp: string;
  statusCode?: number;
  message?: string;
}
