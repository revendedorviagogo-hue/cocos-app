# Cocos App - TODO

## ✅ Funcionalidades Implementadas

### Backend & Database
- [x] Adicionar backend com tRPC + Express
- [x] Configurar banco de dados MySQL/TiDB
- [x] Criar schema de usuários com autenticação
- [x] Criar schema de PIX Payments
- [x] Criar schema de Transfers
- [x] Criar schema de PIX Keys
- [x] Criar schema de Contacts

### PIX - Funcionalidades Completas
- [x] Criar pagamento PIX
- [x] Gerar QR Code para pagamento
- [x] Copiar chave PIX
- [x] Confirmar pagamento PIX
- [x] Listar histórico de pagamentos PIX
- [x] Consultar status de pagamento
- [x] Registrar chaves PIX (EMAIL, PHONE, CPF, CNPJ, RANDOM)
- [x] Listar chaves PIX do usuário
- [x] Deletar chaves PIX

### Transferências - Funcionalidades Completas
- [x] Enviar transferência (PIX, TED, DOC, INTERNAL)
- [x] Agendar transferências
- [x] Listar histórico de transferências
- [x] Consultar status de transferência
- [x] Transferências enviadas e recebidas
- [x] Comprovantes de transferência

### Contatos
- [x] Adicionar contatos
- [x] Listar contatos
- [x] Deletar contatos
- [x] Atualizar contatos
- [x] Marcar contatos como favoritos

### Autenticação
- [x] Login com Manus OAuth
- [x] Logout
- [x] Verificar usuário autenticado
- [x] Proteção de rotas

## 🚀 Próximas Funcionalidades (Opcional)

### Frontend
- [ ] Página de PIX com formulário de pagamento
- [ ] Página de Transferências
- [ ] Página de Histórico
- [ ] Página de Contatos
- [ ] Dashboard com saldo e transações

### Integrações
- [ ] Integração com API real de PIX
- [ ] Integração com bancos (TED/DOC)
- [ ] Notificações push para transações
- [ ] Webhooks para confirmação de pagamentos

### Segurança
- [ ] 2FA para transações
- [ ] Limites de transferência
- [ ] Verificação de identidade (KYC)
- [ ] Auditoria de transações

## 🔧 Correções Concluídas

- [x] Adicionar interceptador de erros do Google Tag Manager
- [x] Limpar console de erros de tracking


## 📱 Detecção Mobile (Concluído)

- [x] Adicionar detecção de plataforma (Android/iOS)
- [x] Habilitar opções específicas de menu mobile
- [x] Adicionar botões de câmera e compartilhar para apps nativos
- [x] Badge de plataforma no header (Android/iOS/Mobile Web)


## 🔓 Modo Nativo Forçado (Concluído)

- [x] Modificar detecção de plataforma para sempre retornar modo nativo
- [x] Habilitar todos os botões (Pagar, Dólares, Extraer, etc)
- [x] Remover restrições de funcionalidades por plataforma
- [x] Criar capacitor-mock.js para simular ambiente nativo
- [x] Forçar isNative: true em todos os ambientes


## 🔧 Override JavaScript Original (Concluído)

- [x] Analisar verificações de plataforma no JavaScript original
- [x] Criar overrides para desabilitar todas as verificações
- [x] Injetar código antes do carregamento do app (force-native.js)
- [x] Forçar capacitor:// protocol como se fosse app nativo
- [x] Proxy para interceptar TODOS os acessos ao Capacitor
- [x] Disparar evento deviceready manualmente


## 🐛 Correção de Erros (Concluído)

- [x] Adicionar mock do Ampli (Amplitude Analytics)
- [x] Adicionar mock do cordova
- [x] Suprimir erros do Google Tag Manager
- [x] Adicionar mock do Braze (AppboyPlugin)
- [x] Interceptar console.error para suprimir erros de tracking


## 🚫 Bloqueio Total GTM (Concluído)

- [x] Interceptar window.onerror para bloquear erros do GTM
- [x] Adicionar window.addEventListener('error') com useCapture
- [x] Bloquear todos os erros do GTM antes de chegarem ao console


## 🎯 Remoção Profissional de Atualização + Modo Mobile Forçado (Concluído)

- [x] Analisar todas as classes CSS da mensagem de atualização
- [x] Criar interceptador para bloquear modal de atualização
- [x] Remover elementos do DOM automaticamente (MutationObserver)
- [x] Forçar versão mobile em TODOS os ambientes (desktop incluído)
- [x] Remoção periódica a cada 500ms
- [x] Bloquear verificações de versão via fetch
- [x] Bloquear alerts/confirms de atualização
