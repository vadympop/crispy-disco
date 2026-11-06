import { TuyauHTTPError } from "@tuyau/core/client";

interface ErrorBody {
  message?: unknown;
  errors?: { message?: unknown }[];
}

export function apiErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof TuyauHTTPError) {
    const body = error.response as ErrorBody | undefined;
    if (typeof body?.message === "string") {
      return body.message;
    }
    const first = body?.errors?.[0]?.message;
    if (typeof first === "string") {
      return first;
    }
  }
  return fallback;
}
