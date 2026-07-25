import React from "react";

interface A1SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

export const A1Skeleton: React.FC<A1SkeletonProps> = ({ className = "", ...props }) => {
  return (
    <div
      className={`animate-pulse bg-gray-200 rounded-md ${className}`}
      {...props}
    />
  );
};
