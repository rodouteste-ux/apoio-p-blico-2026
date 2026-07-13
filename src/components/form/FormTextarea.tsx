import { forwardRef, type TextareaHTMLAttributes } from "react";

interface FormTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  hint?: string;
}

export const FormTextarea = forwardRef<HTMLTextAreaElement, FormTextareaProps>(
  ({ label, error, hint, id, className, ...props }, ref) => {
    const textareaId = id || props.name;
    return (
      <div className="grid gap-1.5">
        <label
          htmlFor={textareaId}
          className="text-sm font-medium text-muted-foreground"
        >
          {label}
        </label>
        <textarea
          id={textareaId}
          ref={ref}
          rows={4}
          {...props}
          className={`min-h-24 w-full rounded-lg border bg-white px-4 py-3 text-base text-foreground outline-none transition placeholder:text-muted-foreground/70 focus:border-primary focus:ring-2 focus:ring-primary/15 ${
            error ? "border-destructive" : "border-border"
          } ${className ?? ""}`}
        />
        {error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : hint ? (
          <p className="text-sm text-muted-foreground">{hint}</p>
        ) : null}
      </div>
    );
  },
);
FormTextarea.displayName = "FormTextarea";
