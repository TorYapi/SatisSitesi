import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const MaintenanceOverlay = () => {
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user, isAdmin, loading: authLoading } = useAuth();

  console.log('MaintenanceOverlay rendered!');

  useEffect(() => {
    console.log('MaintenanceOverlay useEffect triggered');
    checkMaintenanceMode();
  }, []);

  const checkMaintenanceMode = async () => {
    console.log('Checking maintenance mode...');
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'maintenance_mode')
        .single();

      console.log('Maintenance mode query result:', { data, error });
      console.log('Raw data.value:', data?.value, 'Type:', typeof data?.value);

      if (error) {
        console.error('Error checking maintenance mode:', error);
        setIsMaintenanceMode(false);
      } else {
        // JSONB field might store boolean as string or actual boolean
        const value = data?.value;
        const maintenanceValue = value === true || value === 'true' || value === "true";
        console.log('Final maintenance value:', maintenanceValue);
        setIsMaintenanceMode(maintenanceValue);
      }
    } catch (error) {
      console.error('Error checking maintenance mode:', error);
      setIsMaintenanceMode(false);
    } finally {
      setLoading(false);
    }
  };

  // Check if user is logged in via email (exclude admin users)
  const isEmailUser = user && user.app_metadata?.provider === 'email';
  const shouldShowMaintenance = isMaintenanceMode && isEmailUser && !isAdmin;

  console.log('MaintenanceOverlay render check - loading:', loading, 'authLoading:', authLoading, 'isMaintenanceMode:', isMaintenanceMode, 'isEmailUser:', isEmailUser, 'isAdmin:', isAdmin, 'shouldShowMaintenance:', shouldShowMaintenance);

  if (loading || authLoading) {
    console.log('MaintenanceOverlay - returning null because loading');
    return null;
  }

  if (!shouldShowMaintenance) {
    console.log('MaintenanceOverlay - returning null because maintenance should not show');
    return null;
  }

  console.log('MaintenanceOverlay - showing maintenance screen');

  return (
    <div className="fixed inset-0 bg-background z-[1000] flex items-center justify-center">
      <div className="text-center">
        <div className="loading-container mb-8">
          <div className="loading-text">BAKIMDAYIZ</div>
        </div>
        <div className="max-w-md mx-auto px-4">
          <h1 className="text-2xl md:text-3xl font-bold mb-4 text-foreground">
            Site Bakımda
          </h1>
          <p className="text-muted-foreground mb-6">
            Sitemiz şu anda bakım çalışmaları nedeniyle geçici olarak hizmet dışıdır. 
            En kısa sürede yeniden hizmetinizde olacağız.
          </p>
          <p className="text-sm text-muted-foreground">
            Anlayışınız için teşekkür ederiz.
          </p>
        </div>
      </div>
    </div>
  );
};

export default MaintenanceOverlay;