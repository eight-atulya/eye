import { ComponentProps } from "react";

type ButtonProps = ComponentProps<"button"> & { variant?: "primary" | "ghost" };

export function Button({ className = "", variant = "primary", ...props }: ButtonProps) {
  const base = "inline-flex items-center justify-center rounded px-3 py-1.5 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500";
  const styles = variant === "primary" ? "bg-blue-600 text-white hover:bg-blue-700" : "bg-transparent text-blue-700 hover:bg-blue-50";
  return <button className={`${base} ${styles} ${className}`} {...props} />;
}


