"use client";

import { clsx } from "clsx";

type ApiErrorMessageProps = {
  error: string | null;
  className?: string;
  "data-testid"?: string;
};

/**
 * Consistent inline display for API or form errors. Use with role="alert" for live regions.
 */
export function ApiErrorMessage({ error, className, "data-testid": testId }: ApiErrorMessageProps) {
  if (!error) return null;
  return (
    <p
      className={clsx("text-body-sm text-red-600", className)}
      role="alert"
      data-testid={testId}
    >
      {error}
    </p>
  );
}
