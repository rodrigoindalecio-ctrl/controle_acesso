✅ CHECKLIST PRÉ-DEPLOYMENT
═══════════════════════════════════════════════════════════════════════

Este checklist garante que tudo está funcionando antes de fazer deploy
ou compartilhar o projeto com a equipe.

═══════════════════════════════════════════════════════════════════════

📋 VERIFICAÇÕES INICIAIS

[ ] Node.js 18+ instalado
    Verificar: node --version

[ ] npm instalado
    Verificar: npm --version

[ ] Projeto clonado/baixado corretamente
    Verificar: ls -la (ou dir no Windows)

[ ] Arquivos não estão corrompidos
    Verificar: Todos os arquivos .md visíveis

═══════════════════════════════════════════════════════════════════════

🔧 SETUP DO PROJETO

[ ] npm install executado com sucesso
    Executar: npm install
    Resultado: node_modules criado sem erros

[ ] Arquivos de configuração existem
    Verificar: .env.local está presente
    Verificar: prisma/schema.prisma existe

[ ] Banco de dados criado
    Executar: npm run prisma:migrate
    Resultado: Tabelas criadas com sucesso

[ ] Dados iniciais (seed) carregados
    Executar: npm run prisma:seed
    Resultado: Usuário admin criado

[ ] Nenhum erro de tipagem TypeScript
    Verificar: No console durante npm run dev
    Resultado: Sem erros "TS" vermelhos

═══════════════════════════════════════════════════════════════════════

🚀 TESTES FUNCIONAIS

[ ] Servidor inicia sem erros
    Executar: npm run dev
    Resultado: "Local: http://localhost:3000"

[ ] Navegador carrega a página de login
    Acessar: http://localhost:3000
    Resultado: Página de login aparece

[ ] Formulário de login é responsivo
    Redimensionar janela
    Resultado: Layout se adapta bem

[ ] Login com credenciais corretas funciona
    Email: admin@controleacesso.com
    Senha: Admin@123
    Resultado: Redireciona para /dashboard

[ ] Login com credenciais incorretas falha
    Email: test@test.com
    Senha: WrongPassword
    Resultado: Mensagem de erro clara

[ ] Dashboard carrega após login bem-sucedido
    Verificar: Título "Bem-vindo!" visível
    Verificar: Informações do usuário exibidas
    Verificar: Carta com opções visíveis

[ ] Dashboard mostra opções corretas para ADMIN
    Verificar: 4 cards visíveis (Eventos, Usuários, Relatórios, Config)
    Verificar: Texto "👑 Administrador" visível

[ ] Botão de Logout funciona
    Clicar em "Sair"
    Resultado: Redireciona para página de login

[ ] Logout limpa a sessão
    Após logout, tentar acessar /dashboard
    Resultado: Redireciona para /

[ ] Acesso direto a /dashboard sem autenticação redireciona
    Limpar cookies (F12 → Application → Cookies)
    Acessar: http://localhost:3000/dashboard
    Resultado: Redireciona para /

═══════════════════════════════════════════════════════════════════════

🎨 VERIFICAÇÕES VISUAIS

[ ] Layout é responsivo em mobile
    F12 → Toggle device toolbar
    Viewport: 375px (iPhone)
    Resultado: Tudo legível e funcional

[ ] Layout é responsivo em tablet
    Viewport: 768px (iPad)
    Resultado: Proporções mantidas

[ ] Layout é bom em desktop
    Viewport: 1920px (Monitor)
    Resultado: Espaçamento adequado

[ ] Cores seguem a paleta definida
    Dourado (#d4a574) visível em títulos
    Off-white (#faf7f2) como fundo
    Cinza escuro (#2d2d2d) no texto

[ ] Tipografia está correta
    Títulos em serifada (Playfair Display)
    Corpo em sans-serif (Lato/Inter)

[ ] Animações funcionam suavemente
    Hover em botão → sutil movimento
    Loading spinner gira
    Transições de página suaves

[ ] Acessibilidade básica
    Tab navega pelos campos
    Labels visíveis nos inputs
    Contraste adequado

═══════════════════════════════════════════════════════════════════════

🔒 VERIFICAÇÕES DE SEGURANÇA

[ ] Senha é hasheada no banco de dados
    npm run prisma:studio
    Abrir tabela 'users'
    Verificar: password_hash é muito longo e não é a senha original

[ ] JWT token está em HTTP-only cookie
    F12 → Application → Cookies
    Verificar: Cookie 'auth-token' visível
    Verificar: HttpOnly e Secure flags (em produção)

[ ] Senhas não aparecem em console ou network
    F12 → Console
    F12 → Network (fazer login)
    Verificar: Senha não aparece em nenhum lugar

[ ] Rotas protegidas não são acessíveis sem token
    Remover cookie auth-token manualmente
    Tentar acessar /dashboard
    Resultado: Redireciona para /

[ ] Erros não expõem informações sensíveis
    Tentar login com email inválido
    Resultado: Mensagem genérica "Email ou senha inválidos"
    (não "Email não encontrado")

═══════════════════════════════════════════════════════════════════════

📦 VERIFICAÇÕES DE CÓDIGO

[ ] Não há console.log() de produção
    grep -r "console\." app/ lib/
    Resultado: Apenas logs de debug necessários

[ ] TypeScript não tem erros
    npm run build
    Resultado: Build bem-sucedido sem warnings

[ ] .env.local está no .gitignore
    Verificar .gitignore
    Resultado: ".env.local" está listado

[ ] node_modules está no .gitignore
    Resultado: "node_modules/" está listado

[ ] .next está no .gitignore
    Resultado: ".next/" está listado

[ ] Arquivos sensíveis estão protegidos
    .env.local não será commitado
    Database.db não será commitado

═══════════════════════════════════════════════════════════════════════

📚 VERIFICAÇÕES DE DOCUMENTAÇÃO

[ ] README.md existe e é leitura rápida
    Verificar: Estrutura clara
    Verificar: Instruções de setup funcionam

[ ] QUICKSTART.md existe e é simples
    Verificar: 5 passos principais visíveis
    Verificar: Credenciais padrão listadas

[ ] API.md documenta endpoints
    Verificar: /api/auth/login descrito
    Verificar: /api/auth/logout descrito
    Verificar: /api/auth/me descrito

[ ] DEVELOPMENT.md tem roadmap claro
    Verificar: 9 fases listadas
    Verificar: Cada fase tem tarefas definidas

[ ] DEPLOYMENT.md explica deploy
    Verificar: Vercel está documentado
    Verificar: Railway está documentado
    Verificar: Variáveis listadas

═══════════════════════════════════════════════════════════════════════

🔧 VERIFICAÇÕES DE ESTRUTURA

[ ] Pastas estão bem organizadas
    app/          → Frontend e API routes
    lib/          → Lógica compartilhada
    components/   → Componentes reutilizáveis
    prisma/       → Banco de dados

[ ] Arquivos seguem padrão de nomenclatura
    Componentes: PascalCase
    Utilitários: camelCase
    Estilos: .module.css

[ ] Não há código duplicado
    grep -r "function login" .
    Resultado: Uma única implementação

[ ] Imports usam paths corretos
    "@/" aponta para raiz do projeto
    Sem imports circulares

═══════════════════════════════════════════════════════════════════════

🎯 VERIFICAÇÕES FINAIS

[ ] Projeto é acessível via navegador
    npm run dev
    http://localhost:3000 carrega

[ ] Todos os arquivos documentados neste checklist funcionam
    Nenhum arquivo falta
    Nenhum arquivo está corrompido

[ ] Não há erros no console (F12)
    Console vazio ou apenas logs informativos

[ ] Performance é aceitável
    Página de login: < 2s
    Dashboard: < 3s

[ ] Sem warnings não necessários
    npm install não tem vulnerabilidades críticas

═══════════════════════════════════════════════════════════════════════

✅ ANTES DE FAZER COMMIT GIT

[ ] git init (se não inicializado)

[ ] git add . (ou adicione seletivamente)

[ ] git commit -m "Initial: Authentication and RBAC system"

[ ] .gitignore está correto (run: git status)
    Resultado: node_modules/ não aparece
    Resultado: .env.local não aparece
    Resultado: .next/ não aparece

[ ] Primeiro commit é bem-sucedido

═══════════════════════════════════════════════════════════════════════

✅ ANTES DE DEPLOY

[ ] Alterar JWT_SECRET em .env.local
    Execute: openssl rand -base64 32

[ ] Alterar NEXTAUTH_SECRET
    Execute: openssl rand -base64 32

[ ] Arquivo .env.example está completo
    Pode ser compartilhado com equipe?

[ ] Não há hardcoded secrets no código
    grep -r "secret" app/ lib/
    Resultado: Apenas referências a env vars

[ ] Banco de dados está pronto
    npm run prisma:migrate executado

[ ] Build de produção testado
    npm run build
    npm run start
    Testa funcionamento

═══════════════════════════════════════════════════════════════════════

🎉 PARABÉNS!

Se você marcou ✅ em TUDO, seu projeto está pronto para:
  ✓ Compartilhar com a equipe
  ✓ Deploy em produção
  ✓ Começar Fase 2 (CRUD de eventos)

═══════════════════════════════════════════════════════════════════════

📝 NOTAS

- Execute este checklist ANTES de cada commit
- Adicione itens específicos do seu projeto conforme necessário
- Mantenha este arquivo atualizado com novas fases

═══════════════════════════════════════════════════════════════════════

Desenvolvido com ❤️
© 2026 Controle de Acesso
