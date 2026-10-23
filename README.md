# Finance

Aplicação web da família para acompanhar receitas, despesas e projeções mensais.

## Desenvolvimento local

Requisitos: Node.js 20.9 ou superior e npm.

```bash
npm install
npm run dev
```

Abra <http://localhost:3000>. O caminho inicial leva à visão do mês. As rotas-base são `/mes`, `/projecao`, `/historico` e `/cadastros`.

## Qualidade e produção

```bash
npm run lint
npm run format:check
npm run build
npm run start
```

Esta fase entrega apenas estrutura visual e navegação. As telas não leem nem salvam dados. A conexão Supabase e autenticação ficam para fases posteriores.

## Supabase

Configuração local, migrations, RLS, comandos e passos de conferência estão em [docs/SUPABASE.md](docs/SUPABASE.md). Nenhum projeto remoto é conectado ou alterado nesta fase.
