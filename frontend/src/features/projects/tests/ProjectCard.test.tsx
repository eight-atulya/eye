import { render, screen } from "@testing-library/react";
import { ProjectCard } from "../components/ProjectCard";

describe("ProjectCard", () => {
  it("renders", () => {
    render(<ProjectCard />);
    expect(screen.getByText(/Project/i)).toBeInTheDocument();
  });
});


