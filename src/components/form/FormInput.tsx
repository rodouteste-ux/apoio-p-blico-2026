import { forwardRef, type InputHTMLAttributes } from "react";

interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
}

export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  ({ label, error, hint, id, className, ...props }, ref) => {
    const inputId = id || props.name;
    return (
      <div className="grid gap-1.5">
        <label
          htmlFor={inputId}
          className="text-xs font-medium uppercase tracking-wide text-muted-foreground"
        >
          {label}
        </label>
        <input
          id={inputId}
          ref={ref}
          {...props}
          className={`h-11 w-full rounded-lg border bg-white px-3.5 text-[15px] text-foreground shadow-[0_1px_0_rgba(15,23,42,0.02)] outline-none transition placeholder:text-muted-foreground/70 focus:border-primary focus:ring-2 focus:ring-primary/15 ${
            error ? "border-destructive focus:border-destructive focus:ring-destructive/15" : "border-border"
          } ${className ?? ""}`}
        />
        {error ? (
          <p className="text-xs text-destructive">{error}</p>
        ) : hint ? (
          <p className="text-xs text-muted-foreground">{hint}</p>
        ) : null}
      </div>
    );
  },
);
FormInput.displayName = "FormInput";
