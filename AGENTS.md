# Uso das skills

As skills deste repositório estão em `.agents/skills/`. Use este mapa para escolher a skill adequada; não carregue nem invoque todas em cada tarefa. Quando uma skill se aplicar, invoque-a pelo nome (por exemplo, `$animate`) e siga o `SKILL.md` correspondente. Leia arquivos de `references/` ou outros recursos da skill quando as próprias instruções pedirem ou quando precisar de detalhes específicos.

## Mapa de seleção

| Skill                           | Use quando                                                                                                                                                                              |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `$emil-design-eng`              | Criar ou revisar uma interface web de forma ampla, com foco em acabamento visual, componentes e decisões de interação. Para um pedido específico abaixo, prefira a skill especializada. |
| `$animate`                      | Implementar uma animação ou transição. Decide primeiro se deve haver movimento e então orienta ferramenta, propriedades, tempo, interrupção e acessibilidade.                           |
| `$animation-performance`        | Diagnosticar animações com engasgos, quadros perdidos ou custo de renderização; investigar propriedades animadas, trabalho na thread principal e medições.                              |
| `$animation-vocabulary`         | Identificar o nome técnico de um efeito descrito informalmente. Responder com o termo do glossário, sem projetar ou implementar o efeito.                                               |
| `$apple-design`                 | Projetar ou revisar interações web inspiradas nos princípios da Apple: gestos, arrasto, momentum, folhas, molas, materiais translúcidos, tipografia ou acessibilidade relacionada.      |
| `$create-icon`                  | Adicionar um ícone fornecido ao catálogo `NextIcon`, nomeando o componente, escolhendo sua categoria e registrando-o no índice central.                                                    |
| `$ask-sonner`                   | Configurar, usar, estilizar ou depurar a biblioteca Sonner e seus toasts. Consulte `API.md` da skill se precisar de nomes ou tipos exatos de propriedades.                              |
| `$break-ui`                     | Procurar falhas de uma tela/componente com dados realistas de pior caso. A skill monta um modo de demonstração e reporta os problemas; implemente correções apenas se o usuário pedir.  |
| `$find-animation-opportunities` | Procurar, em modo somente leitura, pontos de uma interface que poderiam se beneficiar de movimento e também rejeitar animações desnecessárias. Não implementa.                          |
| `$improve-animations`           | Auditar o movimento de uma área ou do projeto e propor correções priorizadas. É somente leitura ao analisar e planejar; não aplique as correções durante essa auditoria.                |
| `$mobile-native`                | Ajustar uma aplicação web para uso em celulares: viewport, áreas seguras, toque, rolagem, teclado virtual e diferenças que exigem validação em aparelho real. Não é para React Native.  |
| `$pick-ui-library`              | Escolher uma biblioteca da lista curada para uma necessidade de frontend. Esta skill tem `disable-model-invocation`; só a use quando o usuário a chamar explicitamente.                 |
| `$review-animations`            | Revisar código ou alterações existentes de animação/movimento e apontar problemas com evidências. É uma revisão, não uma implementação; só a invoque explicitamente.                    |

## Como resolver sobreposições

- Para uma interface ampla, use `$emil-design-eng`; para um pedido de movimento bem definido, use `$animate` ou a skill de movimento mais específica.
- Para movimento novo, use `$animate`; para investigar desempenho, `$animation-performance`; para revisar movimento existente, `$review-animations`; para auditar uma área ou o repositório e planejar melhorias, `$improve-animations`; para apenas sugerir onde movimento poderia ajudar, `$find-animation-opportunities`.
- Para gestos e princípios de interação física, prefira `$apple-design`. Se o problema principal for comportamento específico de navegador móvel em uma aplicação web, use `$mobile-native`.
- Use `$break-ui` para encontrar problemas com dados extremos, não como uma revisão estética geral. Use `$animation-vocabulary` somente para nomear um efeito.
- Não combine skills por rotina. Combine-as apenas quando o pedido exigir etapas distintas, respeitando o escopo de cada uma. Em caso de dúvida, use a skill mais específica; se a tarefa não corresponder a uma skill, trabalhe normalmente.

## Invocação e escopo

- A seleção automática pode usar uma skill quando o pedido corresponde à descrição dela; não é necessário ativar todas a cada prompt. Se o usuário quiser garantir uma skill específica, invoque-a pelo nome (`$nome-da-skill`).
- Skills com `disable-model-invocation: true` exigem chamada explícita do usuário. Neste conjunto, são `$pick-ui-library` e `$review-animations`.
- Antes de executar, confira se a skill é de implementação, análise somente leitura ou planejamento. Respeite também os limites indicados no respectivo `SKILL.md` e a solicitação atual do usuário.
- A skill fornece instruções de trabalho; ela não substitui o contexto do projeto, os pedidos do usuário nem a validação necessária para a tarefa.

## Componentes de interface

- Antes de criar qualquer componente de interface, procure primeiro se o shadcn/ui oferece um componente equivalente, incluindo componentes que podem ser adicionados ao projeto.
- Use os componentes shadcn existentes ou adicione a implementação oficial do shadcn quando ela estiver disponível. Isso vale para qualquer componente, não apenas botões, campos e seletores.
- Crie um componente local reutilizável somente quando o shadcn/ui não oferecer um equivalente. Nesse caso, mantenha a implementação e os estilos centralizados nesse componente.
- Não substitua um componente shadcn disponível por uma implementação manual com HTML ou outra biblioteca.
- Prefira classes utilitárias do Tailwind para layout, espaçamento, cores, tipografia, estados e responsividade. Adicione CSS próprio somente quando não houver uma solução direta com utilitários, variantes ou configuração do Tailwind.
- Antes de adicionar um seletor ou regra em CSS, confira se pode expressar o mesmo estilo no `className` ou em uma variante/plugin do Tailwind.

## Paleta de cores

- Quando o usuario indicar uma cor para a paleta do Tailwind, aplique-a ao tom `500` da escala correspondente, salvo se ele indicar outro tom.
- Escreva os valores de cor em HSL.
