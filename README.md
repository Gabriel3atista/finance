# Finance

Aplicação web da família para acompanhar receitas, despesas e o histórico financeiro mensal.

## Desenvolvimento local

Requisitos: Node.js 20.9 ou superior e npm.

```bash
npm install
npm run dev
```

Abra <http://localhost:3000>. A aplicação oferece `/login`, `/signup`, `/forgot-password`, `/update-password` e `/household`, além das rotas `/mes`, `/historico` e `/cadastros`.

## Qualidade e produção

```bash
npm run lint
npm run format:check
npm run build
npm run start
```

As rotas financeiras exigem uma sessão Supabase e vínculo com um núcleo familiar. As variáveis `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` precisam estar configuradas no `.env.local` para autenticação funcionar localmente.

## Supabase

Configuração local, migrations, RLS e comandos de produção estão em [docs/SUPABASE.md](docs/SUPABASE.md). Rotas e configuração da autenticação estão em [docs/AUTH.md](docs/AUTH.md).

## Fluxo financeiro

- `/dashboard`: acompanhe a evolução da receita e das despesas realizadas nos últimos 12 meses, o resumo do mês e os próximos vencimentos.
- `/mes`: navegue por competência, cadastre receitas e despesas avulsas, ajuste valores previstos e marque recebimentos/pagamentos.
- `/cadastros`: configure receitas/despesas recorrentes e parcelamentos. As ocorrências aparecem no mês quando ele é aberto e ficam associadas ao núcleo ativo.
- Aplique as migrations pendentes do Supabase antes de usar essas telas em um ambiente conectado. Veja [SUPABASE.md](docs/SUPABASE.md) para o modelo e os comandos locais.

## Instalação no celular

O app inclui manifest e ícones para instalação. Abra o site publicado em HTTPS no navegador do celular e escolha **Adicionar à tela inicial** (iOS/Safari) ou **Instalar app** (Android/Chrome). Valide navegação, teclado aberto, áreas seguras e exibição em modo instalado no aparelho real; emuladores não cobrem o comportamento completo do navegador móvel.
