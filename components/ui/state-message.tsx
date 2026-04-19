import { clsx } from "clsx";

type StateMessageProps = {
  variant: "loading" | "error" | "empty";
  title: string;
  description?: string;
  className?: string;
  children?: React.ReactNode;
};

export function StateMessage({
  variant,
  title,
  description,
  className,
  children
}: StateMessageProps) {
  const isError = variant === "error";
  const isEmpty = variant === "empty";
  const isLoading = variant === "loading";

  return (
    <div
      className={clsx(
        "rounded-2xl border p-6 text-center",
        isError && "border-red-200 bg-red-50 text-red-900",
        isEmpty && "border-line bg-page-subtle text-ink-secondary",
        isLoading && "border-line bg-page-subtle text-ink-secondary",
        className
      )}
      role={isError ? "alert" : undefined}
    >
      {isLoading && (
        <div
          className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-line border-t-brand-500"
          aria-hidden="true"
        />
      )}
      <p className={clsx("font-bold tracking-snug", isError ? "text-red-900" : "text-ink")}>
        {title}
      </p>
      {description && (
        <p className={clsx("mt-2 text-body-sm", isError ? "text-red-800" : "text-ink-secondary")}>
          {description}
        </p>
      )}
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}
