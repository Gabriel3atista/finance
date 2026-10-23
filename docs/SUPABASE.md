# Supabase local e segurança

## O que está preparado

- `supabase/config.toml` define a configuração local. A API expõe `public`, `storage` e `graphql_public`; o schema `private` usado pelas funções de autorização não é exposto pelo PostgREST.
- `supabase/migrations/20261022120000_household_finance_schema.sql` cria núcleos familiares, membros, convites, recorrências, parcelamentos, lançamentos financeiros e lotes de importação.
- RLS está habilitado em todas as tabelas públicas. Leitura e escrita financeira exigem associação autenticada ao mesmo núcleo; sem sessão, `auth.uid()` é nulo e nenhuma política concede acesso.
- O criador do núcleo é incluído por um trigger privado. Um segundo membro só pode entrar com convite pendente, não expirado e dirigido ao e-mail confirmado da sessão.
- Chaves compostas impedem que lançamento financeiro aponte para recorrência, parcelamento ou lote de outro núcleo. `household_id` e autor de criação são imutáveis em registros financeiros.
- Pagamento parcial não está modelado: cada lançamento tem um único valor e uma data de liquidação. Atraso é derivado de vencimento passado com status `planned`.
- Uma fatura é uma despesa (`source_kind = 'card_statement'`). Compras individuais não são gravadas junto com o pagamento da fatura; isso evita somar compra e fatura em dobro no modelo inicial.
- Os lançamentos históricos importados preservam hash SHA-256 do arquivo e referência de aba/linha/célula para consulta e auditoria. O envio de novas planilhas foi desativado; registros e metadados existentes permanecem no banco.

As funções `SECURITY DEFINER` ficam no schema privado, têm `search_path` vazio e nomes de tabela/schema qualificados. Não use uma chave `service_role`/secret no navegador; ela ignora RLS.

## Aplicar no Supabase local

Pré-requisitos: Supabase CLI e Docker Desktop (ou runtime compatível) instalados e iniciados. A CLI está disponível como dependência local; no terminal, na raiz do repositório:

```bash
npx supabase start
npx supabase status
```

Na primeira execução, `supabase start` baixa as imagens locais e aplica as migrations pendentes. Para recriar **somente o banco local** do zero e reaplicar todas as migrations:

```bash
npx supabase db reset
```

Esse reset apaga os dados locais. Nunca acrescente `--linked` a `db reset`: esse modo apagaria e reconstruiria o banco remoto.

O `npx supabase status` exibe a URL e a chave publishable locais. Use valores locais em `.env.local` para desenvolvimento local. Em produção, o Vercel usa o Project URL e a chave **publishable** nas variáveis `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. `.env.example` contém apenas nomes e placeholders. Nunca use `service_role`, secret API key ou senha do banco em `NEXT_PUBLIC_*`, no repositório ou no chat.

As rotas de autenticação, configuração de redirects e publicação do convite por e-mail estão descritas em [AUTH.md](AUTH.md).

## Operação mensal e cadastros

A rota `/mes` carrega os lançamentos de uma competência (`?month=AAAA-MM`). Receitas e despesas avulsas, ocorrências recorrentes e parcelas usam a mesma tabela `financial_entries`, com sua origem registrada. A rota `/cadastros` cria recorrências e parcelamentos; suas ocorrências são criadas de forma idempotente quando o respectivo mês é consultado. A seleção “Este e próximos meses” em uma ocorrência recorrente altera apenas ocorrências previstas dessa competência em diante; o histórico e lançamentos já realizados ficam preservados.

`supabase/migrations/20261023000000_financial_series_responsibility.sql` adiciona pessoa responsável e categoria aos cadastros recorrentes e parcelados, validando que o responsável pertence ao mesmo núcleo. Antes de usar as novas telas conectadas, aplique as migrations pendentes no projeto Supabase escolhido e confirme que `.env.local` aponta para esse projeto. Não envie valores do arquivo ao suporte ou ao chat.

- A competência fica no primeiro dia do mês. `amount` representa o valor do lançamento, e `status` distingue `planned`, `settled` e `cancelled`; `settled_at` é preenchido somente ao marcar como realizado.
- Encerrar uma recorrência ou parcelamento preserva ocorrências realizadas e históricas, cancela ocorrências previstas a partir do mês atual e impede a geração das seguintes.
- Parcelas são despesas. A divisão usa centavos inteiros, distribuindo o resto entre as primeiras parcelas para que a soma seja exatamente igual ao valor total.

## Histórico importado

A rota `/historico` é somente leitura e consulta os lançamentos históricos já gravados em `financial_entries`, junto com os lotes e a origem de cada item em `import_batches`. Os registros preservam o estado original, o hash SHA-256 do arquivo e as referências de aba, linha e célula. Esses dados continuam sujeitos ao RLS por núcleo familiar.

O fluxo de envio foi aposentado: a interface, o parser `.xlsx`, a dependência de planilhas e a função `public.commit_historical_import(...)` foram removidos. A migration de aposentadoria revoga inserção e atualização autenticadas em `import_batches`, sem apagar lotes, lançamentos ou campos de proveniência existentes. Use o app para cadastrar novos lançamentos.

## Projeções e saldo acumulado

`supabase/migrations/20261024000000_forecast_settings_and_overrides.sql` cria `household_finance_settings` para registrar o saldo inicial e a data de conferência, e `financial_forecast_overrides` para hipóteses vinculadas a lançamentos previstos. Ambas têm RLS por núcleo. Um trigger rejeita hipótese em lançamento já realizado e remove a hipótese quando o lançamento é realizado ou cancelado.

`supabase/migrations/20261024120000_historical_category_forecasts.sql` cria uma tabela separada e protegida por RLS para ajustes de estimativas históricas de categorias variáveis.

A projeção materializa recorrências e parcelas para o mês atual e os três seguintes, soma recebimentos/despesas por competência e mostra saldo acumulado somente após informar um saldo inicial datado. O saldo acumulado considera lançamentos pendentes e liquidações posteriores à data do saldo informado; valores já liquidados antes dessa data já estão refletidos no saldo inicial. Hipóteses afetam somente a projeção e nunca alteram `financial_entries.amount` ou seu estado.

Despesas categorizadas sem previsão recorrente usam como estimativa a média dos valores realizados nas competências com dados dentro dos seis meses anteriores. Só mostramos a estimativa quando há pelo menos duas competências registradas e nenhuma despesa prevista da mesma categoria naquele mês. A hipótese ajustada é salva por núcleo, competência e categoria em `financial_forecast_category_overrides`, sem criar um lançamento financeiro.

Os dois gráficos históricos usam somente lançamentos `settled`: renda recebida e despesas pagas/percentual da renda comprometida nos últimos seis meses. Lançamentos históricos importados são consultáveis em `/historico`; seus estados permanecem como foram registrados durante a importação.

## Conferir isolamento entre núcleos

Para conferir o isolamento, crie dois usuários confirmados (A e B), cada qual com um núcleo separado, e cadastre pelo menos um lançamento com cada sessão. Faça as verificações usando a API com a chave publishable e o access token da sessão correspondente:

1. Com a sessão A, liste núcleos e lançamentos. Só devem aparecer o núcleo A e seus lançamentos.
2. Repita com a sessão B. Só devem aparecer o núcleo B e seus lançamentos.
3. Tente inserir ou atualizar um lançamento usando o `household_id` do outro núcleo. A operação deve ser negada por RLS; uma consulta filtrada pelo núcleo alheio deve retornar zero linhas.
4. Sem access token, tente ler e gravar cada tabela pública acima. Nenhum dado familiar pode ser retornado; leitura pode ser negada por falta de grant e gravação deve ser negada.
5. Confirme que `household_members` não permite inserir vínculo arbitrário, trocar o `household_id` de um lançamento, ou aceitar convite com e-mail diferente/não confirmado.

No Studio local, também é possível conferir cobertura estrutural com:

```sql
select tablename, rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename in (
    'households', 'household_members', 'household_invitations',
    'recurring_items', 'installment_plans', 'financial_entries', 'import_batches'
  )
order by tablename;
```

Todas as linhas devem mostrar `rowsecurity = true`. Esta consulta confirma que RLS está habilitado; os testes com duas sessões são necessários para confirmar o isolamento comportamental.
