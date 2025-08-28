import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Badge } from '@/components/ui/badge';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

interface SecureDataDisplayProps {
  data: string | null | undefined;
  type: 'email' | 'phone' | 'sensitive';
  label?: string;
  showBadge?: boolean;
  allowToggle?: boolean;
  className?: string;
}

export const SecureDataDisplay: React.FC<SecureDataDisplayProps> = ({
  data,
  type,
  label,
  showBadge = true,
  allowToggle = false,
  className = ""
}) => {
  const { user } = useAuth();
  const [isVisible, setIsVisible] = React.useState(false);
  
  // Check if user has admin role (you might need to adjust this based on your auth system)
  const [isAdmin, setIsAdmin] = React.useState(false);
  
  React.useEffect(() => {
    const checkAdminRole = async () => {
      if (!user) return;
      
      try {
        const { data: roles, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'admin');
          
        setIsAdmin(!!roles && roles.length > 0);
      } catch (error) {
        console.error('Error checking admin role:', error);
      }
    };
    
    checkAdminRole();
  }, [user]);

  if (!data) {
    return <span className={className}>-</span>;
  }

  const maskData = (value: string, dataType: string): string => {
    switch (dataType) {
      case 'email':
        const [localPart, domain] = value.split('@');
        if (!domain) return '***';
        return `${localPart.substring(0, 3)}***@${domain}`;
      case 'phone':
        return `***${value.slice(-4)}`;
      case 'sensitive':
        return '***';
      default:
        return value;
    }
  };

  const displayValue = isAdmin || isVisible ? data : maskData(data, type);
  const isMasked = !isAdmin && !isVisible;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {label && <span className="text-sm text-muted-foreground">{label}:</span>}
      <span className="font-mono text-sm">
        {displayValue}
      </span>
      
      {showBadge && isMasked && (
        <Badge variant="secondary" className="text-xs">
          Masked
        </Badge>
      )}
      
      {allowToggle && !isAdmin && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsVisible(!isVisible)}
          className="h-6 w-6 p-0"
        >
          {isVisible ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
        </Button>
      )}
    </div>
  );
};