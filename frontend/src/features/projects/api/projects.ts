export type Project = { id: string; name: string; description?: string };

export async function listProjects(): Promise<Project[]> {
  // TODO: replace with OpenAPI client
  return [];
}

export async function createProject(input: { name: string; description?: string }): Promise<Project> {
  // TODO: replace with OpenAPI client
  return { id: "temp", name: input.name, description: input.description };
}


