import React from "react";

interface A1BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  status: "success" | "warning" | "error" | "info" | "neutral";
  children: React.ReactNode;
}

export const A1Badge: React.FC<A1BadgeProps> = ({ status, children, className = "", ...props }) => {
  const getStatusStyles = () => {
    switch (status) {
      case "success": return "bg-green-50 text-success border border-green-200";
      case "warning": return "bg-orange-50 text-warning border border-orange-200";
      case "error": return "bg-red-50 text-error border border-red-200";
      case "info": return "bg-blue-50 text-primary border border-blue-200";
      default: return "bg-gray-50 text-gray-600 border border-gray-200";
    }
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${getStatusStyles()} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
};
