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
