type EmployeeCardProps = {
  name: string;
  role: string;
  team: string;
};

export default function EmployeeCard({ name, role, team }: EmployeeCardProps) {
  return (
    <div className="panel employee-card">
      <div className="avatar">{name.charAt(0)}</div>
      <h3>{name}</h3>
      <p>{role}</p>
      <small>{team}</small>
    </div>
  );
}
