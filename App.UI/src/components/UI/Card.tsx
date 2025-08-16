import React from "react";
import "./ui.css";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
}

export const Card: React.FC<CardProps> = ({
  title,
  subtitle,
  className,
  children,
  ...rest
}) => {
  const classes = ["ui-card"];
  if (className) classes.push(className);
  return (
    <div className={classes.join(" ")} {...rest}>
      {(title || subtitle) && (
        <div className="ui-card__header">
          {title && <h3 className="ui-card__title">{title}</h3>}
          {subtitle && <p className="ui-card__subtitle">{subtitle}</p>}
        </div>
      )}
      <div className="ui-card__body">{children}</div>
    </div>
  );
};

export default Card;
