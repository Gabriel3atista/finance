# Instalação e validação mobile

O aplicativo publica `/manifest.webmanifest` com modo standalone, cores escuras e ícones em 192×192, 512×512, maskable e Apple Touch Icon. Não há service worker nem suporte offline: instalação na tela inicial não implica armazenamento ou sincronização offline.

## Validação manual em aparelho real

1. Abra a URL HTTPS publicada no Safari do iPhone ou Chrome do Android.
2. Use **Adicionar à Tela de Início** (iOS) ou **Instalar app** (Android).
3. Abra pelo ícone e confirme que o app inicia em `/dashboard`, sem barra de endereço dentro do modo standalone.
4. Navegue pelas quatro rotas principais, role a tela e abra formulários com o teclado virtual. Confirme que cabeçalho, navegação inferior, notch e indicador de início não cobrem conteúdo.
5. Gire o aparelho para paisagem e confirme que os formulários continuam utilizáveis.

Confirme login, convite e isolamento usando duas contas de teste e dois núcleos diferentes antes de considerar o comportamento de produção validado. A inspeção de migrations confirma as políticas declaradas, mas não substitui esse teste comportamental com sessões reais.
