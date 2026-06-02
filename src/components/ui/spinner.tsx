import type { SVGProps } from "react";
import { ReactComponent as ArgusSpinnerIcon } from "./argus-spinner.svg";
import { cn } from "../../lib/utils";

export interface ISVGProps extends SVGProps<SVGSVGElement> {
    size?: number;
    className?: string;
}

  
export const LoadingSpinner = ({
    size = 24,
    className,
    ...props
}: ISVGProps) => {
    return (
      <ArgusSpinnerIcon
        width={size}
        height={size}
        aria-label="Loading"
        {...props}
        className={cn("text-current", className)}
      />
    );
  };