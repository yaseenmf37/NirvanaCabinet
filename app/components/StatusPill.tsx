type StatusPillProps = {
  label: string;
  tone?: "success" | "warn" | "info" | "danger";
};

export default function StatusPill({ label, tone = "info" }: StatusPillProps) {
  return <span className={`status-pill tone-${tone}`}>{label}</span>;
}
