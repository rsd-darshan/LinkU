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
      className={clsx(
        "focus-ring inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-input px-4 py-2 text-body-sm font-medium transition duration-normal ease-smooth disabled:pointer-events-none disabled:opacity-60",
        variant === "primary" &&
          "border border-brand-600 text-white shadow-card bg-gradient-to-b from-[#4b8fff] to-[#2e6ff2] hover:-translate-y-0.5 hover:shadow-card-hover",
        variant === "secondary" &&
          "border border-slate-300/60 bg-white/85 text-slate-800 shadow-glass backdrop-blur-sm hover:border-slate-400/70 hover:bg-white/95",
        variant === "danger" && "border border-red-500 bg-red-500 text-white shadow-card hover:bg-red-600",
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
