import React from "react";
import "./ui.css";

export interface GridProps extends React.HTMLAttributes<HTMLDivElement> {
  columns?: number;
  gap?: number;
}

export const Grid: React.FC<GridProps> = ({
  columns = 3,
  gap = 16,
  style,
  className,
  children,
  ...rest
}) => {
  const gridStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
    gap,
    ...style,
  };
  const classes = ["ui-grid"];
  if (className) classes.push(className);
  return (
    <div className={classes.join(" ")} style={gridStyle} {...rest}>
      {children}
    </div>
  );
};

export default Grid;
