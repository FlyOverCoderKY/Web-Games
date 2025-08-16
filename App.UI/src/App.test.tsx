import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import App from "./App";

describe("App shell", () => {
  it("renders header and footer without errors", () => {
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>,
    );
    // Header
    expect(screen.getByRole("banner")).toBeInTheDocument();
    expect(screen.getByText("Web Games")).toBeInTheDocument();
    // Footer
    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
    expect(screen.getByText("FlyOverCoder.com")).toBeInTheDocument();
  });
});
