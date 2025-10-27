import { useState, FormEvent } from "react";

type ProjectFormProps = {
  onSubmit?: (data: { name: string; description?: string }) => void;
};

export function ProjectForm({ onSubmit }: ProjectFormProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    onSubmit?.({ name, description });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <input
        className="w-full rounded border px-3 py-2"
        placeholder="Project name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <textarea
        className="w-full rounded border px-3 py-2"
        placeholder="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <button className="rounded bg-blue-600 px-3 py-1.5 text-white">Create</button>
    </form>
  );
}


