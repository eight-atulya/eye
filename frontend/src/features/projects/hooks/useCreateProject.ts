import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createProject } from "../api/projects";

export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createProject,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}


