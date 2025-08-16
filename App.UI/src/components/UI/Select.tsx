import React from "react";
import "./ui.css";

export interface Option<T extends string | number = string> {
  value: T;
  label: string;
}

export interface SelectProps<T extends string | number = string>
  extends Omit<
    React.SelectHTMLAttributes<HTMLSelectElement>,
    "onChange" | "value"
  > {
  label?: string;
  helpText?: string;
  options: ReadonlyArray<Option<T>>;
  value?: T;
  onChange?: (value: T) => void;
}

export function Select<T extends string | number = string>({
  label,
  helpText,
  id,
  options,
  value,
  onChange,
  className,
  ...rest
}: SelectProps<T>) {
  const autoId = React.useId();
  const selectId = id ?? autoId;
  const classes = ["ui-select"];
  if (className) classes.push(className);
  return (
    <div className="ui-field">
      {label && (
        <label htmlFor={selectId} className="ui-label">
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={classes.join(" ")}
        value={
          value as unknown as string | number | readonly string[] | undefined
        }
        onChange={(e) => onChange?.(e.target.value as unknown as T)}
        {...rest}
      >
        {options.map((opt) => (
          <option
            key={String(opt.value)}
            value={
              opt.value as unknown as
                | string
                | number
                | readonly string[]
                | undefined
            }
          >
            {opt.label}
          </option>
        ))}
      </select>
      {helpText && <div className="ui-help">{helpText}</div>}
    </div>
  );
}

export default Select;
