import { clsx } from "clsx";

type StateMessageProps = {
  variant: "loading" | "error" | "empty";
  title: string;
  description?: string;
  className?: string;
  children?: React.ReactNode;
};

export function StateMessage({ variant, title, description, className, children }: StateMessageProps) {
  const isError = variant === "error";
  const isEmpty = variant === "empty";
  const isLoading = variant === "loading";

  return (
    <div
      className={clsx(
        "rounded-card-lg border p-6 text-center backdrop-blur-sm",
        isError && "border-red-200/80 bg-red-50/85 text-red-800",
        isEmpty && "border-white/70 bg-white/72 text-slate-600",
        isLoading && "border-white/70 bg-white/72 text-slate-600",
        className
      )}
      role={isError ? "alert" : undefined}
    >
      {isLoading && (
        <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-brand-600" aria-hidden="true" />
      )}
      <p className={clsx("font-semibold", isError ? "text-red-900" : "text-slate-900")}>{title}</p>
      {description && <p className="mt-1 text-body-sm">{description}</p>}
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}
