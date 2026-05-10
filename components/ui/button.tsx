import { clsx } from "clsx";
import type { ButtonHTMLAttributes, PropsWithChildren } from "react";

type ButtonProps = PropsWithChildren<ButtonHTMLAttributes<HTMLButtonElement>> & {
  variant?: "primary" | "secondary" | "danger";
  loading?: boolean;
};

export function Button({
  variant = "primary",
  loading = false,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;
  return (
    <button
      type={props.type ?? "button"}
      data-variant={variant}
      className={clsx(
        "focus-ring inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full px-4 py-2 text-body-sm font-bold transition duration-fast ease-smooth disabled:pointer-events-none disabled:opacity-50",
        variant === "primary" &&
          "border border-brand-600 bg-brand-500 text-white hover:bg-brand-600 hover:brightness-105 active:brightness-95",
        variant === "secondary" &&
          "border border-line bg-page text-ink hover:bg-page-subtle hover:border-line",
        variant === "danger" && "border border-red-600 bg-red-500 text-white hover:bg-red-600",
        className
      )}
      disabled={isDisabled}
      aria-busy={loading}
      {...props}
    >
      {loading && (
        <span className="mr-2 h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden />
      )}
      {children}
    </button>
  );
}
