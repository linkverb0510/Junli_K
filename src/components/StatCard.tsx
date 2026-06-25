type StatCardProps = {
  label: string;
  value: string | number;
  hint: string;
};

export function StatCard({ label, value, hint }: StatCardProps) {
  return (
    <section className="stat-card">
      <p className="stat-label">{label}</p>
      <strong className="stat-value">{value}</strong>
      <p className="stat-hint">{hint}</p>
    </section>
  );
}
