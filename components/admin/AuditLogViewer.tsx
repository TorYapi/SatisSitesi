import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { adminSecurity, type AuditLogEntry } from "@/lib/adminSecurity";
import { useToast } from "@/hooks/use-toast";
import { Shield, Eye, AlertTriangle, RefreshCw } from "lucide-react";

const AuditLogViewer = () => {
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      const logs = await adminSecurity.getAuditLogs(200);
      setAuditLogs(logs);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      toast({
        title: "Hata",
        description: "Denetim kayıtları yüklenirken bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getActionBadgeVariant = (action: string) => {
    switch (action) {
      case 'SELECT_CUSTOMERS':
        return 'default';
      case 'SELECT_CUSTOMER_DETAILS':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'SELECT_CUSTOMERS':
        return 'Müşteri Listesi';
      case 'SELECT_CUSTOMER_DETAILS':
        return 'Müşteri Detayı';
      default:
        return action;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('tr-TR');
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Güvenlik Denetim Kayıtları
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-10 bg-muted rounded w-full"></div>
            <div className="h-64 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Güvenlik Denetim Kayıtları
          </CardTitle>
          <Button
            onClick={fetchAuditLogs}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Yenile
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Admin kullanıcılarının müşteri verilerine erişim kayıtları
        </p>
      </CardHeader>
      <CardContent>
        {auditLogs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Henüz denetim kaydı bulunmuyor.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Son {auditLogs.length} kayıt gösteriliyor</span>
              <Badge variant="outline" className="flex items-center gap-1">
                <Shield className="h-3 w-3" />
                Güvenlik Aktif
              </Badge>
            </div>
            
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tarih</TableHead>
                    <TableHead>Admin</TableHead>
                    <TableHead>İşlem</TableHead>
                    <TableHead>IP Adresi</TableHead>
                    <TableHead>Detaylar</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-mono text-xs">
                        {formatDate(log.created_at)}
                      </TableCell>
                      <TableCell>
                        <div className="font-mono text-xs">
                          {log.admin_user_id.slice(0, 8)}...
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getActionBadgeVariant(log.action_type)}>
                          {getActionLabel(log.action_type)}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {log.ip_address || '-'}
                      </TableCell>
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedLog(log)}
                              className="flex items-center gap-1"
                            >
                              <Eye className="h-3 w-3" />
                              Görüntüle
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Denetim Kaydı Detayları</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="text-sm font-medium">Tarih</label>
                                  <p className="text-sm text-muted-foreground font-mono">
                                    {formatDate(log.created_at)}
                                  </p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium">Admin ID</label>
                                  <p className="text-sm text-muted-foreground font-mono">
                                    {log.admin_user_id}
                                  </p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium">İşlem Türü</label>
                                  <p className="text-sm text-muted-foreground">
                                    {getActionLabel(log.action_type)}
                                  </p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium">IP Adresi</label>
                                  <p className="text-sm text-muted-foreground font-mono">
                                    {log.ip_address || 'Bilinmiyor'}
                                  </p>
                                </div>
                              </div>
                              
                              {log.record_id && (
                                <div>
                                  <label className="text-sm font-medium">Kayıt ID</label>
                                  <p className="text-sm text-muted-foreground font-mono">
                                    {log.record_id}
                                  </p>
                                </div>
                              )}
                              
                              {log.customer_data && (
                                <div>
                                  <label className="text-sm font-medium">Erişilen Veriler</label>
                                  <ScrollArea className="h-32 w-full border rounded p-2">
                                    <pre className="text-xs">
                                      {JSON.stringify(log.customer_data, null, 2)}
                                    </pre>
                                  </ScrollArea>
                                </div>
                              )}
                            </div>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AuditLogViewer;