import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, AlertTriangle, Info } from 'lucide-react';

interface SecurityAlertProps {
  type: 'info' | 'warning' | 'error';
  title: string;
  message: string;
  onDismiss?: () => void;
}

export const SecurityAlert: React.FC<SecurityAlertProps> = ({
  type,
  title,
  message,
  onDismiss
}) => {
  const getIcon = () => {
    switch (type) {
      case 'info':
        return <Info className="h-4 w-4" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4" />;
      case 'error':
        return <Shield className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  const getVariant = () => {
    switch (type) {
      case 'error':
        return 'destructive';
      default:
        return 'default';
    }
  };

  return (
    <Alert variant={getVariant()} className="mb-4">
      {getIcon()}
      <div className="flex-1">
        <div className="font-medium">{title}</div>
        <AlertDescription className="mt-1">
          {message}
        </AlertDescription>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="ml-auto text-muted-foreground hover:text-foreground"
        >
          ×
        </button>
      )}
    </Alert>
  );
};