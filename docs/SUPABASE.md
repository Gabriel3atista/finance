# Supabase local e segurança

## O que está preparado

- `supabase/config.toml` define a configuração local. A API expõe `public`, `storage` e `graphql_public`; o schema `private` usado pelas funções de autorização não é exposto pelo PostgREST.
- `supabase/migrations/20261022120000_household_finance_schema.sql` cria núcleos familiares, membros, convites, recorrências, parcelamentos, lançamentos financeiros e lotes de importação.
- RLS está habilitado em todas as tabelas públicas. Leitura e escrita financeira exigem associação autenticada ao mesmo núcleo; sem sessão, `auth.uid()` é nulo e nenhuma política concede acesso.
- O criador do núcleo é incluído por um trigger privado. Um segundo membro só pode entrar com convite pendente, não expirado e dirigido ao e-mail confirmado da sessão.
- Chaves compostas impedem que lançamento financeiro aponte para recorrência, parcelamento ou lote de outro núcleo. `household_id` e autor de criação são imutáveis em registros financeiros.
- Pagamento parcial não está modelado: cada lançamento tem um único valor e uma data de liquidação. Atraso é derivado de vencimento passado com status `planned`.
- Uma fatura é uma despesa (`source_kind = 'card_statement'`). Compras individuais não são gravadas junto com o pagamento da fatura; isso evita somar compra e fatura em dobro no modelo inicial.
- A importação guarda hash SHA-256 do arquivo e referência de aba/linha. A chave única por núcleo/hash e por lote/aba/linha dá suporte à idempotência e auditoria da fase 7.

As funções `SECURITY DEFINER` ficam no schema privado, têm `search_path` vazio e nomes de tabela/schema qualificados. Não use uma chave `service_role`/secret no navegador; ela ignora RLS.

## Aplicar no Supabase local

Pré-requisitos: Supabase CLI e Docker Desktop (ou runtime compatível) instalados e iniciados. A CLI não está instalada neste ambiente. No terminal, na raiz do repositório:

```bash
supabase start
supabase status
```

Na primeira execução, `supabase start` baixa as imagens locais e aplica as migrations pendentes. Para recriar **somente o banco local** do zero e reaplicar todas as migrations:

```bash
supabase db reset
```

Esse reset apaga os dados locais. Não acrescente `--linked`: esse modo aponta para o projeto remoto. Não execute `supabase db push` nem associe um projeto remoto nesta fase.

O `supabase status` exibe a URL e a chave publishable locais. Quando a aplicação for conectada na Fase 4, copie esses valores para `.env.local`. Para o projeto hospedado, crie manualmente um projeto no Supabase e use o Project URL e a chave **publishable** no `.env.local`. `.env.example` contém apenas nomes e placeholders. Nunca use `service_role`, secret API key ou senha do banco em `NEXT_PUBLIC_*`, no repositório ou no chat.

## Conferir isolamento entre núcleos

Após login ser implementado na Fase 4, crie dois usuários confirmados (A e B), cada qual com um núcleo separado, e cadastre pelo menos um lançamento com cada sessão. Faça as verificações usando a API local com a chave publishable local e o access token da sessão correspondente:

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
