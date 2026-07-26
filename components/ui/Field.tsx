import { cn, focusRing } from "@/lib/cn";

export type Option = { value: string; label: string };

type FieldProps = {
  label: string;
  name: string;
  as?: "input" | "select" | "textarea" | "multiselect";
  type?: string;
  options?: Option[];
  placeholder?: string;
  required?: boolean;
  hint?: string;
  error?: string;
  rows?: number;
  className?: string;
  /* Controlled usage, added in stage 7 for the booking flow. Optional, so
     every existing uncontrolled call site is untouched. */
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
};

const LABEL = "block text-[13px] font-medium text-ink";

function controlClass(error?: string) {
  return cn(
    "mt-2 w-full rounded-md border bg-paper px-3.5 py-2.5 text-[15px] text-ink",
    "placeholder:text-muted",
    focusRing,
    error ? "border-attention" : "border-line",
  );
}

export function Field({
  label,
  name,
  as = "input",
  type = "text",
  options = [],
  placeholder,
  required,
  hint,
  error,
  rows = 4,
  className,
  value,
  defaultValue,
  onValueChange,
}: FieldProps) {
  const optionalMark = required ? null : (
    <span className="font-normal text-muted"> (optional)</span>
  );
  const errorId = `${name}-error`;
  const describedBy = error ? errorId : undefined;
  /* No handler unless one was asked for. Field is used from server components
     too, and a function prop on a DOM element there fails the render outright
     rather than being ignored. */
  const change = onValueChange
    ? { onChange: (e: { target: { value: string } }) => onValueChange(e.target.value) }
    : {};
  const controlled =
    value !== undefined ? { value, ...change } : { defaultValue, ...change };

  const messages = (
    <>
      {/* CLAUDE.md section 5 makes `attention` the error colour, but at 2.1:1
          on paper it cannot carry the message text. The colour marks the
          field (border, dot), the text stays ink so it is readable. */}
      {error ? (
        <p id={errorId} className="mt-2 flex items-center gap-2 text-sm font-medium text-ink">
          <span aria-hidden className="h-1.5 w-1.5 shrink-0 rounded-full bg-attention" />
          {error}
        </p>
      ) : null}
      {hint ? <p className="mt-2 text-sm text-muted">{hint}</p> : null}
    </>
  );

  if (as === "multiselect") {
    return (
      <fieldset className={className}>
        <legend className={LABEL}>
          {label}
          {optionalMark}
        </legend>
        <div className="mt-2 flex flex-col gap-2.5">
          {options.map((o) => (
            <label key={o.value} className="flex items-center gap-2.5 text-[15px] text-ink">
              <input
                type="checkbox"
                name={name}
                value={o.value}
                className={cn("h-4 w-4 accent-gold", focusRing)}
              />
              {o.label}
            </label>
          ))}
        </div>
        {messages}
      </fieldset>
    );
  }

  return (
    <div className={className}>
      <label htmlFor={name} className={LABEL}>
        {label}
        {optionalMark}
      </label>
      {as === "select" ? (
        <select
          id={name}
          name={name}
          {...controlled}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={controlClass(error)}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      ) : as === "textarea" ? (
        <textarea
          id={name}
          name={name}
          {...controlled}
          rows={rows}
          required={required}
          placeholder={placeholder}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={controlClass(error)}
        />
      ) : (
        <input
          id={name}
          name={name}
          {...controlled}
          type={type}
          required={required}
          placeholder={placeholder}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={controlClass(error)}
        />
      )}
      {messages}
    </div>
  );
}
