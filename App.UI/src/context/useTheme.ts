import { useContext } from "react";
import { ThemeContext, type ThemeContextType } from "./theme-context";

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (!context) {
    return {
      appearance: "light",
      setAppearance: () => {},
      resolvedAppearance: "light",
    };
  }
  return context;
}
