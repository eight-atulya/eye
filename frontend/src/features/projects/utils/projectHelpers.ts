import type { Project } from "../api/projects";

export function sortProjectsByName(projects: Project[]): Project[] {
  return [...projects].sort((a, b) => a.name.localeCompare(b.name));
}


