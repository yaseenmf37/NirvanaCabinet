type NotificationCardProps = {
  title: string;
  text: string;
  tone?: "info" | "success" | "warn";
};

export default function NotificationCard({
  title,
  text,
  tone = "info",
}: NotificationCardProps) {
  return (
    <div className={`notice notice-${tone}`}>
      <strong>{title}</strong>
      <p>{text}</p>
    </div>
  );
}
