import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AuditLogEntry {
  id: string;
  admin_user_id: string;
  action_type: string;
  table_name: string;
  record_id?: string;
  customer_data?: any;
  ip_address?: string | null;
  user_agent?: string | null;
  created_at: string;
}

export const useSecurityAudit = () => {
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const logSecurityEvent = useCallback(async (
    eventType: string,
    details: Record<string, any>,
    tableName: string = 'security_events'
  ) => {
    try {
      await supabase.rpc('log_sensitive_operation', {
        p_operation_type: eventType,
        p_table_name: tableName,
        p_sensitive_data: details,
        p_user_agent: navigator.userAgent
      });
    } catch (error) {
      console.warn('Failed to log security event:', error);
    }
  }, []);

  const fetchAuditLogs = useCallback(async (limit: number = 50) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('admin_audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      setAuditLogs((data || []).map(row => ({
        ...row,
        ip_address: row.ip_address as string | null,
        user_agent: row.user_agent as string | null
      })));
    } catch (error: any) {
      toast.error('Failed to fetch audit logs: ' + error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const trackPageView = useCallback(async (pageName: string) => {
    await logSecurityEvent('PAGE_VIEW', {
      page: pageName,
      timestamp: new Date().toISOString(),
      user_agent: navigator.userAgent
    });
  }, [logSecurityEvent]);

  const trackDataAccess = useCallback(async (
    dataType: string,
    recordId?: string,
    accessType: 'view' | 'edit' | 'delete' | 'export' = 'view'
  ) => {
    await logSecurityEvent('DATA_ACCESS', {
      data_type: dataType,
      record_id: recordId,
      access_type: accessType,
      timestamp: new Date().toISOString()
    });
  }, [logSecurityEvent]);

  const trackSecurityEvent = useCallback(async (
    eventType: 'LOGIN_ATTEMPT' | 'PERMISSION_DENIED' | 'RATE_LIMIT_HIT' | 'SUSPICIOUS_ACTIVITY',
    details: Record<string, any>
  ) => {
    await logSecurityEvent(eventType, {
      ...details,
      timestamp: new Date().toISOString(),
      severity: eventType === 'SUSPICIOUS_ACTIVITY' ? 'HIGH' : 'MEDIUM'
    });
  }, [logSecurityEvent]);

  return {
    auditLogs,
    loading,
    fetchAuditLogs,
    trackPageView,
    trackDataAccess,
    trackSecurityEvent,
    logSecurityEvent
  };
};