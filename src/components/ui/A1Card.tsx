import React from "react";

interface A1CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  noPadding?: boolean;
}

export const A1Card: React.FC<A1CardProps> = ({ children, className = "", noPadding = false, ...props }) => {
  return (
    <div
      className={`bg-white rounded-xl shadow-[var(--card-shadow)] border border-[var(--border-color)] overflow-hidden ${
        noPadding ? "" : "p-5"
      } transition-all hover:shadow-[var(--card-shadow-hover)] ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
