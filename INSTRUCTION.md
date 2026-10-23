# Finance — Prompt de implementação para Codex

## Objetivo

Crie um aplicativo web **simples, mobile-first e compartilhado** para controlar as finanças pessoais da minha família. Use **Finance** como nome provisório.

Atualmente usamos planilhas anuais com uma aba por mês. Em `./references/*` estão nossas planilhas financeiras desde 2024. Analise esses arquivos antes de propor o modelo de dados ou qualquer implementação. Eles mostram o fluxo real, mas não devem ser reproduzidos literalmente se houver uma experiência mais simples.

O principal resultado esperado é: **abrir o aplicativo, ver o mês atual com contas e receitas já previstas, atualizar valores variáveis, marcar o que foi pago e estimar facilmente como estaremos nos próximos três meses**. Não quero um ERP, um aplicativo bancário ou dezenas de funcionalidades.

## Problemas a resolver

- Não criar nova planilha a cada ano nem novas abas a cada mês.
- Não copiar manualmente salários, contas fixas e parcelas de um mês para outro.
- Saber rapidamente quanto entrou, quanto já pagamos, quanto ainda falta pagar e quanto sobrará.
- Ter uma **projeção financeira rolante de três meses futuros**, usada frequentemente para planejar despesas e evitar meses apertados.
- Permitir que eu e minha esposa vejamos e atualizemos os mesmos dados.
- Consultar o histórico e entender se a renda e as despesas estão aumentando.

## Como controlamos hoje

Por mês, registramos manualmente:

1. **Receitas:** salários bruto e líquido de ambos, décimo terceiro, PPR/PLR, freelance e outras entradas eventuais. Os valores podem mudar a cada mês.
2. **Gastos fixos:** financiamento imobiliário, energia, água, internet, condomínio e outros. Muitos se repetem, mas seus valores variam.
3. **Dívidas:** cartões de crédito, carro, móveis, boletos e compras parceladas.
4. **Resumo:** total de despesas fixas e dívidas, valores pagos, pendentes e saldo do mês.

## Experiência central do MVP

### 1. Visão mensal

- Navegar livremente entre meses e anos sem criar períodos manualmente.
- Mostrar receitas previstas/recebidas, despesas previstas/pagas, total pendente, vencidas e saldo projetado/realizado.
- Editar um valor variável apenas naquele mês, sem alterar os meses anteriores.
- Marcar pagamento ou recebimento com o mínimo de interações possível.
- Mostrar contas recorrentes e parcelas do período automaticamente.

### 2. Projeção dos próximos três meses — prioridade alta

Crie uma visualização simples do **mês atual + os três meses seguintes** com, para cada mês:

- Receitas esperadas.
- Gastos recorrentes previstos.
- Parcelas, faturas e obrigações já conhecidas.
- Total a pagar.
- Saldo mensal estimado (receitas menos despesas).
- Saldo acumulado estimado, **somente quando houver saldo inicial informado**, partindo desse saldo e adicionando os fluxos futuros. Nunca apresente saldo em conta como se fosse conhecido sem esse dado.
- Destaque discreto para meses com resultado negativo ou maior comprometimento da renda.

O usuário deve poder alterar estimativas para um mês específico (por exemplo, energia mais cara ou renda menor) e ver imediatamente o impacto nos três meses, sem reescrever a recorrência inteira. Diferencie valores confirmados, previstos e hipóteses editadas. Uma projeção nunca deve ser registrada automaticamente como pagamento real.

Para despesas variáveis ainda não conhecidas, use um valor-base explícito (por exemplo, último valor ou média histórica, se houver dados suficientes), indique que é uma estimativa e permita ajuste manual. Não invente precisão. A projeção deve avançar automaticamente conforme o calendário, sem exigir manutenção mensal da estrutura.

**Não construir inicialmente:** simuladores complexos, múltiplos cenários salvos, inteligência artificial, previsão estatística avançada, sincronização bancária ou conciliação automática.

### 3. Cadastros essenciais

- **Receitas:** recorrentes ou eventuais, pessoa responsável, valor previsto e recebido, competência e data de recebimento; bruto e líquido quando aplicável.
- **Despesas:** recorrentes ou avulsas, categoria, valor previsto, vencimento, competência e situação de pagamento.
- **Parcelamentos:** valor total, número de parcelas, início, vencimentos, saldo restante, parcelas pagas e quitação. Aparecem automaticamente nos meses futuros.
- **Cartão de crédito:** representar faturas e compras de forma coerente, evitando contar compra e pagamento da fatura duas vezes. Priorize o modelo mais simples compatível com nossas planilhas.
- **Pagamentos:** registrar pago, pendente e, apenas se necessário pelos dados reais, pagamentos parciais.

Recorrências devem preservar os lançamentos históricos. Defina comportamento claro para editar somente uma competência ou os meses seguintes. Parcelamentos são obrigações rastreáveis; não duplicar seus valores ao consolidar despesas.

### 4. Dashboard enxuto

Priorize uma tela útil, sem excesso de cartões e gráficos:

- Resumo do mês atual.
- Projeção dos três meses seguintes.
- Próximos vencimentos e pendências.
- Dois gráficos históricos: **evolução da renda familiar** e **evolução das despesas/comprometimento da renda** por mês ou ano.

Separe o que é despesa mensal, saldo de dívida e montante pago; não misture métricas. Outros relatórios e gráficos ficam fora do MVP.

### 5. Login e compartilhamento familiar

- Os únicos métodos de autenticação do MVP são **e-mail e senha** e **Google**. Não implemente magic link, OTP, telefone, Apple, GitHub ou outros provedores.
- Supabase Auth: cadastro, confirmação de e-mail, login, logout e recuperação de senha.
- Núcleo familiar compartilhado entre mim e minha esposa, com convite por e-mail.
- Ambos visualizam e gerenciam as contas desse núcleo.
- Segurança via RLS; um núcleo não acessa dados de outro.
- Projete para mais de um núcleo no banco, sem criar uma interface complexa de administração.

### 6. Histórico desde 2024

- Analise todas as planilhas relevantes em `./references/*`, seus períodos, nomenclaturas, fórmulas, receitas, despesas, pagamentos, cartões e parcelamentos.
- Documente ambiguidades, dados ausentes, possíveis duplicidades e regras observadas.
- Planeje importação auditável e idempotente, com prévia/revisão antes de gravar.
- Preserve os arquivos originais. Não assuma que células ambíguas são fatos nem fabrique valores faltantes.
- Os dados históricos devem alimentar consultas e gráficos, mas não bloquear a entrega do fluxo mensal simples.

## Tecnologia e arquitetura

- Next.js (App Router), React e TypeScript.
- Supabase PostgreSQL, Auth e RLS.
- Tailwind CSS e shadcn/ui.
- PWA instalável, com manifest e ícones. Offline avançado e sincronização de alterações offline **fora do MVP**.
- ESLint e Prettier.
- TanStack Query **somente se necessário** para cache/sincronização no cliente.
- Biblioteca de gráficos leve e adequada ao stack, se necessária.
- Utilize versões estáveis e compatíveis; não adicione dependências sem justificativa.

Use uma organização **feature-based** proporcional ao tamanho do projeto: `auth`, `household`, `transactions`, `recurrences`, `installments`, `overview` e `forecast`, adaptando conforme a análise. Evite abstrações prematuras, camadas artificiais e complexidade de domínio que não resolva as dores descritas.

Modele valores monetários com precisão apropriada, competência e datas de vencimento/pagamento separadas, integridade referencial, migrations e autorização no banco. Mantenha credenciais privilegiadas fora do cliente. Garanta que totais e projeções sejam reproduzíveis e não dupliquem obrigações. Diferencie sempre **previsto vs. realizado**.

## Diretrizes de produto

- **Simplicidade acima de quantidade de features.** Poucas telas, textos claros e ações rápidas.
- Mobile-first, boa acessibilidade, estados vazios, carregamento e erro.
- Visual moderno, discreto, profissional e legível; sem gráficos decorativos.
- Evite exigir configurações financeiras complexas no primeiro uso.
- Não implemente orçamento por categoria, metas, open finance, notificações push, investimentos, exportações elaboradas ou outros módulos até que o núcleo esteja funcional.
- Se surgir uma decisão que amplie muito o escopo, proponha a alternativa menor e explique o trade-off.

## Processo obrigatório

### Protocolo de execução por fase

- Meu comando inicial será **`run fase 1`**. Execute somente a fase solicitada, respeitando a ordem e os pré-requisitos abaixo. Não comece fases seguintes automaticamente.
- Ao concluir uma fase, informe o que foi feito, arquivos alterados, critérios atendidos, validações executadas e a próxima fase recomendada. Pare e aguarde meu próximo comando, por exemplo, `run fase 2`.
- Se uma fase depender de configuração ou credencial que só eu possa fornecer, pare nesse ponto. Liste o local exato, os passos manuais, quais valores preciso preencher e como confirmar que terminei. Não invente valores nem peça que eu envie segredos no chat. Quando eu disser que concluí, retome a mesma fase.
- Antes de alterar o projeto, inspecione o estado atual e adapte a fase ao que já existe; não recrie nem sobrescreva trabalho funcional.
- Mantenha cada fase pequena e revisável. Se surgir uma decisão de produto ou modelagem que altere materialmente o resultado, explique a dúvida e pare antes de codificar a parte dependente.
- Nunca modifique os arquivos de `./references/*`. Nunca exponha credenciais em código, logs, screenshots ou commits.

### Fase 1 — Descoberta e especificação (somente leitura)

1. Inspecione a estrutura e o estado do repositório, instruções existentes e todos os arquivos relevantes de `./references/*`.
2. Resuma como as planilhas são usadas, os períodos cobertos, dados existentes, fórmulas e regras observadas; destaque lacunas, ambiguidades e possíveis duplicidades sem assumir fatos.
3. Descreva os fluxos essenciais: **mês atual → ajustar valores → marcar pagamentos → projetar três meses → consultar histórico**.
4. Proponha telas mínimas, modelo de dados, relacionamentos, autorização/RLS e regras de recorrências, parcelas, cartões e projeções.
5. Especifique como a importação histórica será pré-visualizada, revisada e feita de forma auditável e idempotente.
6. Entregue um plano das fases seguintes com dependências, critérios de conclusão e ações que cabem a mim. Faça perguntas somente quando a resposta mudar materialmente o modelo ou os fluxos.

**Saída esperada:** diagnóstico curto, decisões propostas, dúvidas bloqueadoras e plano. Não crie arquivos de produto, código, migrations ou mudanças no banco nesta fase.

### Fase 2 — Fundação do aplicativo

1. Confira a stack existente; se o repositório estiver vazio, prepare Next.js App Router, React, TypeScript, Tailwind e shadcn/ui conforme as decisões aprovadas na Fase 1.
2. Configure estrutura feature-based proporcional, lint/format e a base visual responsiva/mobile-first.
3. Implemente apenas a estrutura navegável e os estados-base das telas do MVP; não simule persistência como se fosse real.

**Critérios de conclusão:** aplicação inicia com comandos documentados, rotas-base abrem, layout funciona em viewport móvel e desktop, sem dependências desnecessárias.

### Fase 3 — Projeto Supabase, esquema e isolamento

1. Prepare configuração local e migrations versionadas para o modelo aprovado, com chaves estrangeiras, restrições e índices necessários.
2. Implemente políticas RLS e funções auxiliares necessárias para garantir isolamento entre núcleos familiares. Acesso a dados deve falhar fechado.
3. Documente como aplicar migrations e como confirmar o isolamento; não aplique alterações em projeto remoto sem meu comando e a configuração manual concluída.

**Ações manuais minhas — antes de conectar o app:**

1. Criar um projeto no Supabase e guardar o Project URL e a chave **publishable** do projeto.
2. Criar/preencher `.env.local` localmente com `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. O agente pode criar `.env.example` somente com nomes e placeholders, nunca com valores reais.
3. Não colocar `service_role`, secret API key, senha do banco ou token pessoal do Supabase em variáveis `NEXT_PUBLIC_*`, no repositório ou no chat. Se uma tarefa administrativa exigir uma credencial privilegiada, pare e instrua-me a fornecê-la por um mecanismo local seguro; não a solicite na conversa.
4. Se a aplicação local precisar vincular a CLI ao projeto, eu farei login e fornecerei localmente as credenciais solicitadas pela CLI. Não presuma que o agente tem acesso ao meu Dashboard.

**Critérios de conclusão:** migrations revisáveis, políticas RLS cobrindo todas as tabelas com dados familiares e instruções claras para aplicá-las. A aplicação remota só é alterada após a ação manual correspondente.

### Fase 4 — Autenticação e núcleo familiar

1. Implemente cadastro/login por e-mail e senha, confirmação de e-mail, logout e recuperação de senha.
2. Implemente login Google via Supabase Auth, callback/retorno de sessão adequado ao Next.js e tratamento de cancelamento e erro.
3. Implemente criação/adesão ao núcleo familiar e convite da esposa por e-mail, com autorização conferida no servidor/banco e pelas políticas RLS.
4. Ofereça somente os dois métodos aprovados: **e-mail/senha ou Google**.

**Ações manuais minhas — provedor de e-mail:**

1. No Supabase Dashboard, conferir que o provedor Email está habilitado e definir a política de confirmação de e-mail.
2. Configurar Site URL e Redirect URLs do Supabase para os endereços locais e de produção, incluindo as rotas reais de confirmação, recuperação e callback que o aplicativo implementar.
3. Para testar confirmações, recuperação e convites, posso usar o serviço de e-mail de teste do Supabase conforme seus limites. Antes de uso real, configurar um provedor SMTP próprio no Dashboard, informando host, porta, usuário, senha e remetente diretamente no painel, nunca no chat ou no código.

**Ações manuais minhas — Google OAuth:**

1. No Google Cloud / Google Auth Platform, criar ou escolher um projeto, configurar branding/audiência e criar uma credencial OAuth de tipo **Web application**.
2. Cadastrar como Authorized JavaScript origins `http://localhost:<porta>` e a origem HTTPS de produção. Adicionar o usuário da minha esposa à lista de usuários de teste se a audiência estiver em modo de teste.
3. Em Authorized redirect URIs, cadastrar a URL de callback do Supabase exibida na página do provedor Google. Em geral, segue o formato `https://<project-ref>.supabase.co/auth/v1/callback`; usar exatamente a URL exibida no meu projeto.
4. Copiar Client ID e Client Secret para o formulário do provedor Google em Supabase Auth. Não inserir o Client Secret no frontend, em `NEXT_PUBLIC_*`, nem em arquivos commitados.
5. Após configurar, avisar que está pronto; então executar/verificar o fluxo Google localmente e ajustar as URLs allowlisted se necessário.

**Critérios de conclusão:** fluxos de e-mail/senha e Google funcionam localmente, sessões protegidas funcionam, recuperação/convite têm URLs corretas e usuário de outro núcleo não consegue ler ou alterar dados.

### Fase 5 — Receitas, despesas e operação mensal

1. Implementar cadastros e edição de receitas/despesas, pessoa responsável, competência, vencimento e estado previsto/realizado.
2. Implementar recorrências e parcelamentos com geração por competência, preservação do histórico e escolha explícita entre editar somente um mês ou meses futuros.
3. Implementar visão mensal, ações rápidas para pago/recebido, pendências/vencidas e resumo consistente, evitando duplicidade entre compras e pagamento de fatura.

**Critérios de conclusão:** valores previstos e realizados não se confundem, totais são reproduzíveis, mudança de uma competência não altera meses anteriores sem confirmação e todos os acessos respeitam o núcleo familiar.

### Fase 6 — Projeção e dashboard

1. Implementar visão do mês atual e três meses futuros com recorrências, parcelas, obrigações conhecidas e entradas esperadas.
2. Exibir saldo mensal projetado e saldo acumulado somente quando houver saldo inicial informado; destacar estimativas e hipóteses editadas.
3. Implementar resumo do mês, próximos vencimentos e os dois gráficos históricos definidos no MVP.

**Critérios de conclusão:** alterar uma hipótese afeta somente o mês selecionado e atualiza a projeção; nenhuma projeção vira pagamento realizado automaticamente; saldos não alegam dados bancários inexistentes.

### Fase 7 — Importação histórica desde 2024

1. Implementar a ferramenta de importação baseada nas regras e ambiguidades aprovadas na Fase 1.
2. Mostrar prévia e erros/avisos antes de gravar, permitir revisão manual e evitar duplicação em reexecuções.
3. Preservar os arquivos-fonte e registrar a origem dos dados importados.

**Critérios de conclusão:** importação auditável e idempotente, ambiguidades não são convertidas em fatos sem confirmação e resultados conciliáveis com os arquivos originais.

### Fase 8 — Revisão e entrega do MVP

1. Revisar os fluxos principais, acessibilidade, estados vazios/erro/carregamento, layout móvel, isolamento de acesso e configuração de produção.
2. Completar PWA instalável (manifest e ícones) dentro do escopo. Offline avançado continua fora do MVP.
3. Executar validações apropriadas disponíveis no repositório para as regras críticas, tipo, lint e build. Distinguir o que foi verificado localmente do que ainda precisa de configuração ou teste manual em produção/aparelho.
4. Documentar comandos, configuração manual restante e critérios de operação/deploy. Não publicar nem alterar serviços remotos sem meu comando explícito.

**Critério global:** entregar uma fase por comando, concluir seus critérios e parar. Não marcar a fase como concluída enquanto houver bloqueador ou fluxo crítico não verificado.

## Critério de sucesso

No início de cada mês, quero abrir o Finance e ver receitas, despesas e parcelas previstas, ajustar valores variáveis e marcar pagamentos. Em poucos segundos, quero entender **quanto falta pagar neste mês e como estarão os próximos três meses**, junto com minha esposa. Também quero acessar nosso histórico desde 2024 e observar a evolução de renda e gastos.

Se uma funcionalidade não ajudar diretamente nessas tarefas, provavelmente não deve entrar no MVP.

**Comece somente pela análise das referências e pelo planejamento técnico. Aguarde aprovação.**
