import { Response } from 'express';

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export class ApiResponse<T = unknown> {
  public success: boolean;
  public message: string;
  public data: T;
  public meta: PaginationMeta | null;

  /**
   * @param statusCode - HTTP status code
   * @param message - Response message
   * @param data - Response payload
   * @param meta - Pagination / auxiliary metadata
   */
  constructor(
    statusCode: number,
    message: string = 'Operation completed successfully',
    data: T = {} as T,
    meta: PaginationMeta | null = null,
  ) {
    this.success = statusCode < 400;
    this.message = message;
    this.data = data;
    this.meta = meta;
  }

  static success<T = unknown>(
    res: Response,
    {
      statusCode = 200,
      message = 'Operation completed successfully',
      data = {} as T,
      meta = null,
    }: {
      statusCode?: number;
      message?: string;
      data?: T;
      meta?: PaginationMeta | null;
    } = {},
  ): Response {
    return res.status(statusCode).json(new ApiResponse<T>(statusCode, message, data, meta));
  }

  static created<T = unknown>(
    res: Response,
    {
      message = 'Resource created successfully',
      data = {} as T,
      meta = null,
    }: {
      message?: string;
      data?: T;
      meta?: PaginationMeta | null;
    } = {},
  ): Response {
    return res.status(201).json(new ApiResponse<T>(201, message, data, meta));
  }
}
