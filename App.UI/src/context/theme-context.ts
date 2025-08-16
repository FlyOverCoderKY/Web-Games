import { createContext } from "react";

export interface ThemeContextType {
  appearance: "light" | "dark" | "system";
  setAppearance: (appearance: "light" | "dark" | "system") => void;
  resolvedAppearance: "light" | "dark";
}

export const ThemeContext = createContext<ThemeContextType | null>(null);
