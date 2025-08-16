import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Button } from "../Button";
import { TextInput } from "../TextInput";
import { Card } from "../Card";
import { Grid } from "../Grid";
import { Select } from "../Select";

describe("UI components", () => {
  it("Button renders with text", () => {
    render(<Button>Click</Button>);
    expect(screen.getByRole("button", { name: "Click" })).toBeInTheDocument();
  });

  it("TextInput renders with label", () => {
    render(<TextInput label="Name" />);
    expect(screen.getByLabelText("Name")).toBeInTheDocument();
  });

  it("Card renders title and children", () => {
    render(
      <Card title="T" subtitle="S">
        <div>Body</div>
      </Card>,
    );
    expect(screen.getByText("T")).toBeInTheDocument();
    expect(screen.getByText("S")).toBeInTheDocument();
    expect(screen.getByText("Body")).toBeInTheDocument();
  });

  it("Grid renders children", () => {
    render(
      <Grid>
        <div>One</div>
        <div>Two</div>
      </Grid>,
    );
    expect(screen.getByText("One")).toBeInTheDocument();
    expect(screen.getByText("Two")).toBeInTheDocument();
  });

  it("Select renders options", () => {
    render(
      <Select
        label="Pick"
        options={[
          { value: "a", label: "A" },
          { value: "b", label: "B" },
        ]}
        value={"a"}
      />,
    );
    expect(screen.getByLabelText("Pick")).toBeInTheDocument();
    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });
});
