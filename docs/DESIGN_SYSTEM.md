# Design system

Este documento define a identidade visual de referência do produto. A rota
`/mes` é a referência prática: fundo carvão, superfícies em camadas, texto
claro, amarelo para a ação principal e cores semânticas reservadas para estados
financeiros. Os tokens ficam em `tailwind.config.ts`; os componentes visuais
compartilhados ficam em `src/components/ui`.

## Princípios

- Use superfícies escuras em camadas, com diferenças de tom pequenas e
  consistentes. Bordas e sombras apoiam a separação sem criar cartões pesados.
- Reserve o amarelo para a ação principal e destaques de identidade. Use cores
  semânticas quando elas comunicarem um estado financeiro ou uma ação.
- Prefira os tokens e variantes dos componentes compartilhados a cores e estilos
  improvisados em cada tela.
- A composição deve funcionar em celular e desktop. Preserve alvos de toque,
  áreas seguras, conteúdo sem overflow e controles que não encolhem dentro de
  flex layouts.

## Cores

### Camadas graphite

Os números da escala graphite seguem o uso visual do tema: **quanto maior o
número, mais escuro o tom**. Não suponha a direção de brilho das escalas padrão
do Tailwind.

| Token | HSL | Uso |
| --- | --- | --- |
| `graphite-600` | `hsl(225 13% 12%)` | Bordas de maior contraste e divisões de superfícies internas. |
| `graphite-700` | `hsl(225 14% 9%)` | Superfície interna, controles secundários e cartões agrupados. |
| `graphite-800` | `hsl(225 15.38% 7%)` | Camada elevada, como drawer e conteúdo de dropdown. |
| `graphite-900` | `hsl(225 15.38% 5.1%)` | Fundo principal, cartões base, inputs e menus. |

As cores `graphite-50` a `graphite-500` são tons progressivamente mais claros
da mesma família. Use-as apenas quando a composição precisar de mais contraste;
não introduza outra família neutra para criar camadas.

### Tokens semânticos

| Token | HSL / origem | Uso |
| --- | --- | --- |
| `canvas` | Igual a `graphite-900` | Fundo global do aplicativo. |
| `ink` | `hsl(210 18% 94%)` | Texto principal, títulos, valores e ícones com alto contraste. |
| `muted` | `hsl(220 8% 60%)` | Texto auxiliar, rótulos, placeholders e ícones secundários. |
| `line` | `hsl(225 10% 17%)` | Bordas sutis, separadores e contorno padrão dos controles. |
| `accent` | `yellow-500` (`hsl(43.92 100% 50.98%)`) | Links e destaques da identidade visual. |
| `accent-soft` | `yellow-500` a 12% | Fundo discreto de destaques e ícones de acento. |
| `mint-*` | Escala mint definida no Tailwind | Recebimentos, pagamentos concluídos e feedback positivo. |
| `rose-*` | Escala rose do Tailwind | Destruição, exclusão, erro, atraso e despesas. |
| `blue-*` | Escala blue do Tailwind | Progresso circular, conforme o resumo mensal. |

Use `text-ink` e `text-muted` para texto. Use `border-line` para contornos
padrão; prefira `divide-line` para divisões. Use `text-white` sobre imagens ou
fundos coloridos com contraste suficiente. Não substitua esses tokens por
valores HSL/RGB locais sem uma necessidade visual específica.

### Significado das cores

- **Amarelo:** ação principal, seleção em destaque e identidade do produto.
- **Mint:** entrada de dinheiro, item pago/recebido e confirmação de sucesso.
- **Rose:** despesa, vencimento destrutivo, exclusão e erro.
- **Azul:** progresso circular do resumo mensal.
- **Graphite:** estrutura e profundidade; não representa um estado financeiro.

Mantenha o mesmo significado em todas as telas. Não use apenas a cor para
comunicar um estado: inclua rótulo, ícone ou outro indicador acessível.

## Tipografia e números

- `font-sans` (Inter) é a fonte padrão para a interface.
- `font-kantumruy-pro` é uma exceção localizada, usada pelo seletor de mês.
- Títulos de página seguem o padrão de `/mes`: `text-[28px] sm:text-[34px]`,
  `font-semibold` e `tracking-[-0.04em]`.
- Títulos de cartões ficam próximos de `text-[15px] font-semibold`; texto de
  interface usa normalmente `text-sm`; rótulos usam `text-xs`.
- Valores financeiros usam `tabular-nums` e o componente `FinancialValue`, que
  também respeita a preferência de ocultar valores.
- Use pesos moderados (`medium`/`semibold`) e hierarquia por tamanho e contraste;
  evite excesso de caixa alta ou texto auxiliar com baixo contraste.

## Superfícies, contornos e forma

- Fundo do aplicativo: `bg-graphite-900`.
- Cartão base: `bg-graphite-900 border border-line shadow-card`, com raio de
  aproximadamente `18px` e padding de `p-5 sm:p-7`.
- Superfície interna: `bg-graphite-700` com `border-graphite-600` quando a
  separação precisar ser mais evidente; use `graphite-800` para camadas elevadas.
- Controles comuns usam `rounded-xl`; cartões usam `rounded-[18px]` ou
  `rounded-2xl`; cápsulas e chips usam `rounded-full`.
- Sombras servem para profundidade, não para substituir bordas ou contraste.
  Reutilize `shadow-card` em cartões e o padrão de sombra dos componentes em
  popovers e drawers.
- Espaçamentos observados em `/mes`: `gap-2` para grupos de controles,
  `gap-3` para conteúdo próximo e `mt-5`/`mt-6` para separar blocos.

## Componentes e variantes

Use os componentes em `src/components/ui` como fonte de verdade. Evite repetir
seus estilos em cada tela.

- **Button:** escolha uma variante sem recriar suas classes. `primary` é amarelo;
  `default` é claro; `white` é branco; `secondary` usa graphite; `outline` usa
  borda; `ghost` é discreto; `destructive` é rose; `destructive-subtle` é rose
  translúcido; `unstyled` serve para controles que precisam do comportamento e
  acessibilidade do Button sem sua aparência padrão. `Select` herda as variantes
  do Button.
- **Badge:** use `primary`, `default`, `white`, `secondary`, `outline`, `ghost`
  ou `destructive` conforme o significado e a hierarquia. Para filtros
  selecionáveis, mantenha estado acessível (`aria-pressed`) e use `Badge` como
  apresentação visual. `leadingIcon` e `trailingIcon` posicionam ícones nas
  extremidades do conteúdo.
- **Dropdown:** use os wrappers Radix/shadcn em
  `src/components/ui/dropdown-menu.tsx`. O menu usa superfície elevada,
  `border-line`, raio de `rounded-xl`, padding compacto e foco em graphite; não
  implemente outro menu manual. `DropdownMenuItem` e `DropdownMenuSubTrigger`
  aceitam `leadingIcon` e `trailingIcon`.
- **Select e Input:** prefira o componente compartilhado. A aparência padrão é
  graphite-900 com `border-line`, texto `ink`, placeholder `muted` e raio
  `rounded-xl`. Preserve tamanho e largura em layouts flexíveis.
- **Card:** use `Card`, `CardHeader`, `CardTitle`, `CardDescription` e
  `CardContent` para novas superfícies reutilizáveis; personalize apenas o
  layout necessário.
- **Drawer:** use o componente compartilhado, limite a altura a `80dvh`, mantenha
  header/footer fixos e faça o conteúdo rolar dentro de `DrawerBody`.
- **Skeleton:** use `Skeleton` e defina largura/altura no ponto de uso.

Ao adicionar uma variante compartilhada, atualize os tipos e playgrounds de
design system correspondentes. Quando um componente usa `cva`, centralize a
variante nessa definição em vez de condicionar classes em cada consumidor.

## Movimento e estados de interação

- Feedbacks de cor usam transições curtas, normalmente entre `120ms` e `160ms`.
- O dropdown usa a animação centralizada de `globals.css` (entrada/saída de
  `160ms`, originada pelo lado do trigger); o Select usa a transição do seu
  componente. Reutilize esses padrões.
- Respeite `prefers-reduced-motion`. Para arrasto, mantenha o movimento ligado
  diretamente ao gesto e use mola discreta apenas no assentamento.
- Não aplique estados de hover que persistam incorretamente em toque. Mantenha o
  foco de teclado visível e o estilo mobile definido pelos componentes.

## Aplicação em novas telas

Antes de criar estilos, consulte uma tela de referência próxima, os tokens neste
documento e as variantes dos componentes compartilhados. Prefira ajustar o
componente ou o token semântico quando um padrão se repetir. Não altere outras
telas só para documentar esta identidade; faça a migração visual como uma tarefa
separada.
