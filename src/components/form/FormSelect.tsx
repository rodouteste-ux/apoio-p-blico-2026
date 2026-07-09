import { forwardRef, type SelectHTMLAttributes } from "react";

interface FormSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  options: string[];
  placeholder?: string;
}

export const FormSelect = forwardRef<HTMLSelectElement, FormSelectProps>(
  ({ label, error, options, placeholder, id, className, ...props }, ref) => {
    const selectId = id || props.name;
    return (
      <div className="grid gap-1.5">
        <label
          htmlFor={selectId}
          className="text-xs font-medium uppercase tracking-wide text-muted-foreground"
        >
          {label}
        </label>
        <div className="relative">
          <select
            id={selectId}
            ref={ref}
            {...props}
            className={`h-11 w-full appearance-none rounded-lg border bg-white px-3.5 pr-10 text-[15px] text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15 ${
              error ? "border-destructive focus:border-destructive focus:ring-destructive/15" : "border-border"
            } ${className ?? ""}`}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
          <svg
            className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M5.23 7.21a.75.75 0 011.06.02L10 11.06l3.71-3.83a.75.75 0 111.08 1.04l-4.25 4.39a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
    );
  },
);
FormSelect.displayName = "FormSelect";
