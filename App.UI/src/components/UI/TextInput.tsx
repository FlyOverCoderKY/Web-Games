import React from "react";
import "./ui.css";

export interface TextInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helpText?: string;
}

export const TextInput: React.FC<TextInputProps> = ({
  label,
  id,
  helpText,
  className,
  ...rest
}) => {
  const autoId = React.useId();
  const inputId = id ?? autoId;
  const classes = ["ui-input"];
  if (className) classes.push(className);
  return (
    <div className="ui-field">
      {label && (
        <label htmlFor={inputId} className="ui-label">
          {label}
        </label>
      )}
      <input id={inputId} className={classes.join(" ")} {...rest} />
      {helpText && <div className="ui-help">{helpText}</div>}
    </div>
  );
};

export default TextInput;
