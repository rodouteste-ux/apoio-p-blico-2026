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
          className="text-xs font-medium uppercase tracking-wide text-muted-foreground"
        >
          {label}
        </label>
        <textarea
          id={textareaId}
          ref={ref}
          rows={4}
          {...props}
          className={`w-full rounded-lg border bg-white px-3.5 py-2.5 text-[15px] text-foreground outline-none transition placeholder:text-muted-foreground/70 focus:border-primary focus:ring-2 focus:ring-primary/15 ${
            error ? "border-destructive" : "border-border"
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
FormTextarea.displayName = "FormTextarea";
