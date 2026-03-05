export interface ApiSuccessResponse<T> {
  readonly ok: true;
  readonly data: T;
  readonly meta?: {
    readonly request_id?: string;
    readonly timestamp?: string;
    readonly pagination?: {
      readonly total: number;
      readonly limit: number;
      readonly offset: number;
    };
  };
}

export interface ApiErrorResponse {
  readonly ok: false;
  readonly error: {
    readonly code: string;
    readonly message: string;
    readonly request_id?: string;
  };
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;
