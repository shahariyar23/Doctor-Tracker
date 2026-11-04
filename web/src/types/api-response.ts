import { PaginationMeta } from "./pagination";

/**
 * Standard API Response Structure
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T;
  meta?: PaginationMeta | null;
}

/**
 * Standard API Error Response Structure
 */
export interface ApiErrorResponse {
  success: false;
  message: string;
  errors?: Array<{ field?: string; message: string }> | Record<string, unknown> | null;
}
