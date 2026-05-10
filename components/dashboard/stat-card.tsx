type StatCardProps = {
  title: string;
  value: string;
  hint?: string;
};

export function StatCard({ title, value, hint }: StatCardProps) {
  return (
    <article className="card-app dashboard-stat-card rounded-card p-4 backdrop-blur-sm">
      <p className="text-body-sm text-slate-600">{title}</p>
      <p className="mt-2 text-title font-semibold text-slate-900">{value}</p>
      {hint ? <p className="mt-1 text-caption text-slate-500">{hint}</p> : null}
    </article>
  );
}
