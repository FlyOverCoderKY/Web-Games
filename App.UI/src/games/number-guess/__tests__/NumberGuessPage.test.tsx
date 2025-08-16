import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import NumberGuessPage from "../NumberGuessPage";

function renderPage() {
  return render(
    <MemoryRouter>
      <NumberGuessPage />
    </MemoryRouter>,
  );
}

describe("NumberGuessPage", () => {
  it("renders controls and responds to invalid input", () => {
    renderPage();
    // Has difficulty and submit controls
    expect(screen.getByLabelText("Difficulty")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Start or reset game" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Submit" })).toBeInTheDocument();

    // Submit empty -> validation message
    fireEvent.click(screen.getByRole("button", { name: "Submit" }));
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Please enter a number",
    );
  });
});
