import { cn } from "@/lib/utils/cn";
import type { InputHTMLAttributes, LabelHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ className, label, error, id, ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && <FieldLabel htmlFor={id}>{label}</FieldLabel>}
      <input
        id={id}
        className={cn(
          "rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400",
          "focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500",
          error && "border-red-400 focus:border-red-500 focus:ring-red-500",
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

export function FieldLabel({
  className,
  ...props
}: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn("text-sm font-medium text-gray-700", className)}
      {...props}
    />
  );
}
