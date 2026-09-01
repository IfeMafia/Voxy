import { NextResponse } from 'next/server';

export interface ApiResponse<T = any> {
  data: T | null;
  error: {
    code: string;
    message: string;
    details?: any;
  } | null;
}

export function successResponse<T>(data: T, status = 200): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    {
      data,
      error: null,
    },
    { status }
  );
}

export function errorResponse(
  code: string,
  message: string,
  status = 400,
  details?: any
): NextResponse<ApiResponse<null>> {
  return NextResponse.json(
    {
      data: null,
      error: {
        code,
        message,
        ...(details ? { details } : {}),
      },
    },
    { status }
  );
}
