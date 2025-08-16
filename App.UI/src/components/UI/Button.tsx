import React from "react";
import "./ui.css";

export type ButtonVariant = "primary" | "secondary" | "ghost";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  fullWidth = false,
  className,
  children,
  ...rest
}) => {
  const classes = ["ui-btn", `ui-btn--${variant}`];
  if (fullWidth) classes.push("ui-w-100");
  if (className) classes.push(className);
  return (
    <button className={classes.join(" ")} {...rest}>
      {children}
    </button>
  );
};

export default Button;
