type ProjectCardProps = {
  title: string;
  status: string;
  owner: string;
  stage: string;
  progress?: number;
};

export default function ProjectCard({
  title,
  status,
  owner,
  stage,
  progress = 65,
}: ProjectCardProps) {
  return (
    <article className="panel project-card">
      <div className="project-card__top">
        <h3>{title}</h3>
        <span className="status">{status}</span>
      </div>
      <p>{stage}</p>
      <div className="progress-box small-progress">
        <div className="progress-bar">
          <span style={{ width: `${progress}%` }} />
        </div>
        <strong>{progress}%</strong>
      </div>
      <div className="project-meta">
        <span>مالک پروژه: {owner}</span>
      </div>
    </article>
  );
}
