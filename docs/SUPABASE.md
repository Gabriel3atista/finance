# Supabase local e segurança

## O que está preparado

- `supabase/config.toml` define a configuração local. A API expõe `public`, `storage` e `graphql_public`; o schema `private` usado pelas funções de autorização não é exposto pelo PostgREST.
- `supabase/migrations/20261022120000_household_finance_schema.sql` cria núcleos familiares, membros, convites, recorrências, parcelamentos, lançamentos financeiros e lotes de importação.
- RLS está habilitado em todas as tabelas públicas. Leitura e escrita financeira exigem associação autenticada ao mesmo núcleo; sem sessão, `auth.uid()` é nulo e nenhuma política concede acesso.
- O criador do núcleo é incluído por um trigger privado. Um segundo membro só pode entrar com convite pendente, não expirado e dirigido ao e-mail confirmado da sessão.
- Chaves compostas impedem que lançamento financeiro aponte para recorrência, parcelamento ou lote de outro núcleo. `household_id` e autor de criação são imutáveis em registros financeiros.
- Lançamentos preservam o estado de pagamento (`planned`, `settled` ou `cancelled`) e a data de baixa; continuam editáveis enquanto existirem e são removidos do banco ao excluir. Atraso é derivado da data de vencimento e do estado pendente.
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

A rota `/mes` carrega os lançamentos de uma competência (`?month=AAAA-MM`). Receitas e despesas avulsas, ocorrências recorrentes e parcelas usam a mesma tabela `financial_entries`, com sua origem registrada. A rota `/cadastros` cria recorrências e parcelamentos; suas ocorrências são criadas de forma idempotente quando o respectivo mês é consultado. A seleção “Este e próximos meses” em uma ocorrência recorrente altera todas as ocorrências dessa competência em diante. Excluir uma ocorrência recorrente ou parcela remove a linha financeira e registra uma exclusão da ocorrência para impedir que a geração automática a recrie.

`supabase/migrations/20261023000000_financial_series_responsibility.sql` é uma migration histórica que adicionou categoria a parcelamentos e campos de responsável. As migrations seguintes removem a atribuição de responsáveis. A migration `20261029120000_entry_exclusions_and_delete.sql` permite exclusão definitiva e registra ocorrências recorrentes/parcela excluídas para impedir a regeneração, sem remover o estado de pagamento. Antes de usar as novas telas conectadas, aplique as migrations pendentes no projeto Supabase escolhido e confirme que `.env.local` aponta para esse projeto. Não envie valores do arquivo ao suporte ou ao chat.

- A competência fica no primeiro dia do mês. `amount` representa o valor do lançamento. `status` e `settled_at` registram a baixa do lançamento.
- Encerrar uma recorrência ou parcelamento impede novas ocorrências; os lançamentos que já existem permanecem editáveis até serem excluídos.
- Parcelas são despesas. A divisão usa centavos inteiros, distribuindo o resto entre as primeiras parcelas para que a soma seja exatamente igual ao valor total.

## Histórico importado

A rota `/historico` é somente leitura e consulta os lançamentos históricos já gravados em `financial_entries`, junto com os lotes e a origem de cada item em `import_batches`. Os registros preservam o hash SHA-256 do arquivo e as referências de aba, linha e célula. Esses dados continuam sujeitos ao RLS por núcleo familiar.

O fluxo de envio foi aposentado: a interface, o parser `.xlsx`, a dependência de planilhas e a função `public.commit_historical_import(...)` foram removidos. A migration de aposentadoria revoga inserção e atualização autenticadas em `import_batches`, sem apagar lotes, lançamentos ou campos de proveniência existentes. Use o app para cadastrar novos lançamentos.

## Remoção da projeção

A rota `/projecao` foi aposentada. A migration `20261030120000_remove_forecast_feature.sql` remove as tabelas usadas exclusivamente por essa tela e o trigger que apagava hipóteses ao atualizar o status de um lançamento. A limpeza era apenas um efeito colateral da projeção; a operação de pagamento continua atualizando `financial_entries.status` diretamente.

Os dois gráficos históricos usam lançamentos realizados por competência para exibir receitas e despesas nos últimos seis meses. Lançamentos históricos importados são consultáveis em `/historico`.

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
