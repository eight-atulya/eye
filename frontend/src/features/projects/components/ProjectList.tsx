type Project = { id: string; name: string };

export function ProjectList({ projects }: { projects: Project[] }) {
  return (
    <ul className="space-y-2">
      {projects.map((p) => (
        <li key={p.id} className="rounded border p-2">
          {p.name}
        </li>
      ))}
    </ul>
  );
}


