import * as React from "react"
import { Input } from "@/components/ui/input"
import { sanitizeInput, validateEmail, validatePhone } from "@/lib/security"
import { cn } from "@/lib/utils"

interface SanitizedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  sanitize?: boolean;
  validationType?: 'email' | 'phone' | 'text';
  onValidationChange?: (isValid: boolean) => void;
}

const SanitizedInput = React.forwardRef<HTMLInputElement, SanitizedInputProps>(
  ({ className, type, sanitize = true, validationType = 'text', onValidationChange, onChange, ...props }, ref) => {
    const [isValid, setIsValid] = React.useState(true);

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      let value = event.target.value;
      
      // Sanitize input if enabled
      if (sanitize) {
        value = sanitizeInput(value);
        event.target.value = value;
      }

      // Validate based on type
      let valid = true;
      if (value) {
        switch (validationType) {
          case 'email':
            valid = validateEmail(value);
            break;
          case 'phone':
            valid = validatePhone(value);
            break;
          case 'text':
          default:
            valid = value.length > 0;
            break;
        }
      }

      setIsValid(valid);
      onValidationChange?.(valid);
      
      if (onChange) {
        onChange(event);
      }
    };

    return (
      <Input
        type={type}
        className={cn(
          className,
          !isValid && props.value && "border-destructive focus:border-destructive"
        )}
        ref={ref}
        onChange={handleChange}
        {...props}
      />
    )
  }
)
SanitizedInput.displayName = "SanitizedInput"

export { SanitizedInput }