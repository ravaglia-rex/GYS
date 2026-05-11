import * as React from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "../../lib/utils";
import { Input, type InputProps } from "./input";

export interface PasswordInputProps extends Omit<InputProps, "type"> {
  variant?: "light" | "dark";
}

const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, variant = "light", ...props }, ref) => {
    const [visible, setVisible] = React.useState(false);
    const toggleClasses =
      variant === "dark"
        ? "text-slate-400 hover:text-white"
        : "text-slate-500 hover:text-slate-800";

    return (
      <div className="relative">
        <Input
          ref={ref}
          type={visible ? "text" : "password"}
          className={cn("pr-10", className)}
          {...props}
        />
        <button
          type="button"
          className={cn(
            "absolute right-1.5 top-1/2 -translate-y-1/2 rounded-md p-1.5 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-offset-0",
            variant === "dark" ? "focus-visible:ring-indigo-500" : "focus-visible:ring-blue-600",
            toggleClasses
          )}
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
        >
          {visible ? <EyeOff className="h-4 w-4" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}
        </button>
      </div>
    );
  }
);
PasswordInput.displayName = "PasswordInput";

export { PasswordInput };
