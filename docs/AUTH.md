# Auth e acesso ao espaço financeiro

## Rotas implementadas

- `/dashboard`: resumo e histórico financeiro, protegido por sessão e vínculo ao espaço.
- `/login`: e-mail/senha ou Google.
- `/signup`: cadastro com e-mail de confirmação.
- `/forgot-password` e `/update-password`: recuperação e troca da senha.
- `/auth/callback`: troca do código PKCE por sessão.
- `/space`: criação e gerenciamento do espaço, visualização e aceite de convites.
- `/household`: rota antiga que redireciona para `/space`.
- `/mes`, `/historico` e `/cadastros`: exigem sessão autenticada e vínculo ao espaço.

As sessões são guardadas em cookies pelo `@supabase/ssr`. O middleware renova a sessão e valida os claims; as consultas financeiras continuam protegidas por RLS.

## Configuração no Supabase

No projeto de produção, em **Authentication -> URL Configuration**:

- Site URL: `https://finance-beige-chi.vercel.app`
- Redirect URLs: `http://localhost:3000/**` e `https://finance-beige-chi.vercel.app/auth/callback`

O app monta os callbacks de cadastro, recuperação e Google usando a origem atual do navegador, e o callback volta à mesma origem. Para desenvolvimento, teste em `http://localhost:3000` e mantenha `http://localhost:3000/**` na allowlist. Se usar `127.0.0.1` ou outra porta, adicione também a origem correspondente com `/**`. Quando a URL de callback não corresponde à allowlist, o Supabase pode redirecionar para o Site URL acima; isso explica um retorno à produção sem exigir uma URL de produção fixa no código.

No Google Cloud, o cliente OAuth Web precisa das origens JavaScript `http://localhost:3000` e `https://finance-beige-chi.vercel.app`. O URI de redirecionamento autorizado do Google é o callback exibido na configuração do provedor Google no Supabase.

Ao validar login local, inicie o Next em `http://localhost:3000` e confira que o callback exibido na barra de endereço continua nessa origem depois da autenticação. Não altere o Site URL de produção para resolver callbacks locais; ajuste a allowlist de Redirect URLs.

Confirme também que o provedor Email está habilitado e que a confirmação de e-mail está ativa. O SMTP padrão do Supabase tem limite baixo para testes; configure SMTP próprio antes de depender de confirmações, recuperação e convites em uso real.

## Aplicar banco e publicar Edge Function

O banco usa `spaces`, `space_members` e `space_invitations`; os registros financeiros referenciam `space_id`. A migration `20261031120000_rename_households_to_spaces.sql` renomeia o esquema existente preservando dados, políticas e convites. Depois de autenticar a CLI e vincular o projeto de produção, revise a prévia:

```powershell
npx supabase login
npx supabase link --project-ref <project-ref>
npx supabase db push --dry-run
```

Se a prévia listar somente as migrations esperadas, aplique-as e publique a função que envia convites:

```powershell
npx supabase db push
npx supabase functions deploy household-invite
```

A função valida o usuário e o papel `owner` antes de criar convite e chamar Supabase Auth. A chave privilegiada fica no ambiente gerenciado pelo Supabase para Edge Functions; ela não é necessária no `.env.local` nem no Vercel.
