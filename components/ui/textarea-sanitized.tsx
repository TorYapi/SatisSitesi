import * as React from "react"
import { Textarea } from "@/components/ui/textarea"
import { sanitizeInput } from "@/lib/security"
import { cn } from "@/lib/utils"

interface SanitizedTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  sanitize?: boolean;
  maxLength?: number;
}

const SanitizedTextarea = React.forwardRef<HTMLTextAreaElement, SanitizedTextareaProps>(
  ({ className, sanitize = true, maxLength = 1000, onChange, ...props }, ref) => {
    const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      let value = event.target.value;
      
      // Enforce max length
      if (maxLength && value.length > maxLength) {
        value = value.substring(0, maxLength);
      }
      
      // Sanitize input if enabled
      if (sanitize) {
        value = sanitizeInput(value);
      }
      
      event.target.value = value;
      
      if (onChange) {
        onChange(event);
      }
    };

    return (
      <Textarea
        className={className}
        ref={ref}
        onChange={handleChange}
        maxLength={maxLength}
        {...props}
      />
    )
  }
)
SanitizedTextarea.displayName = "SanitizedTextarea"

export { SanitizedTextarea }