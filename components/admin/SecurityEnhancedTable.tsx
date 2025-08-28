import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { SecureDataDisplay } from '@/components/ui/secure-data-display';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, Download, Shield } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface CustomerData {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  company_name?: string;
  tax_number?: string;
  is_corporate?: boolean;
  created_at?: string;
}

interface SecurityEnhancedTableProps {
  customers: CustomerData[];
  loading?: boolean;
  onViewDetails?: (customerId: string) => void;
  onExportData?: (customers: CustomerData[]) => void;
}

export const SecurityEnhancedTable: React.FC<SecurityEnhancedTableProps> = ({
  customers,
  loading = false,
  onViewDetails,
  onExportData
}) => {
  const { user } = useAuth();
  
  const handleSecureExport = () => {
    if (!onExportData) return;
    
    // Log the export action
    toast.info('Exporting customer data - action will be logged for security');
    onExportData(customers);
  };

  const handleViewDetails = (customerId: string) => {
    if (!onViewDetails) return;
    
    // This will be logged by the adminSecurity service
    onViewDetails(customerId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Security Header */}
      <div className="flex items-center justify-between bg-card/50 p-4 rounded-lg border">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          <span className="font-medium">Secure Customer Data Access</span>
          <Badge variant="secondary" className="text-xs">
            RLS Protected
          </Badge>
        </div>
        
        {onExportData && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleSecureExport}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Export Data
          </Button>
        )}
      </div>

      {/* Enhanced Table */}
      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.map((customer) => (
              <TableRow key={customer.id}>
                <TableCell className="font-medium">
                  <div>
                    <div className="font-semibold">
                      {customer.first_name} {customer.last_name}
                    </div>
                    {customer.is_corporate && customer.company_name && (
                      <SecureDataDisplay
                        data={customer.company_name}
                        type="sensitive"
                        className="text-sm text-muted-foreground"
                        showBadge={false}
                      />
                    )}
                  </div>
                </TableCell>
                
                <TableCell>
                  <SecureDataDisplay
                    data={customer.email}
                    type="email"
                    allowToggle={true}
                    showBadge={false}
                  />
                </TableCell>
                
                <TableCell>
                  <SecureDataDisplay
                    data={customer.phone}
                    type="phone"
                    allowToggle={true}
                    showBadge={false}
                  />
                </TableCell>
                
                <TableCell>
                  <Badge variant={customer.is_corporate ? "default" : "secondary"}>
                    {customer.is_corporate ? "Corporate" : "Individual"}
                  </Badge>
                </TableCell>
                
                <TableCell className="text-sm text-muted-foreground">
                  {customer.created_at 
                    ? new Date(customer.created_at).toLocaleDateString()
                    : '-'
                  }
                </TableCell>
                
                <TableCell className="text-right">
                  {onViewDetails && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewDetails(customer.id)}
                      className="gap-2"
                    >
                      <Eye className="h-4 w-4" />
                      View Details
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        
        {customers.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No customers found
          </div>
        )}
      </div>
      
      {/* Security Footer */}
      <div className="text-xs text-muted-foreground bg-muted/30 p-3 rounded-lg">
        🔒 All data access is logged for security purposes. 
        Sensitive information is masked based on your role permissions.
      </div>
    </div>
  );
};