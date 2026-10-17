# Offer Gateway Panel

Painel administrativo do **Offer Gateway**: lista ofertas de marketplaces (ex.: Shopee), gerencia instâncias de WhatsApp da [Evolution API](https://github.com/EvolutionAPI/evolution-api) e envia ofertas para grupos. Consome a API NestJS do repositório [`offer-gateway`](https://github.com/henriqueEz4568/offer-gateway).

O tema é **white-label**: as cores primária e secundária, o nome e o logo vêm da API (`GET /theme`), com padrão preto e branco quando ela não responde.

## Funcionalidades

- **Ofertas**: filtros por provedor, ID e busca; miniatura, preço, comissão e valor a receber; envio por linha ou pelo formulário para um grupo salvo; paginação.
- **Instâncias**: listagem do banco ou direto da Evolution API, criação, conexão (QR code e pairing code) e exclusão com confirmação.
- **Grupos**: consulta na Evolution API e salvamento com status (ativo, pendente, desativado).
- **Tema**: cores da API com contraste WCAG garantido, modo claro/escuro/sistema sem flash na carga.
- **Idiomas**: inglês (padrão), português (Brasil) e espanhol, com seletor na sidebar e no login.
- **UX**: sidebar responsiva (drawer no mobile), skeletons, empty states, toasts, foco e erros acessíveis.

## Stack

- [Next.js 16](https://nextjs.org) (App Router, React Compiler) e React 19
- Tailwind CSS v4 com tokens semânticos em CSS variables, [shadcn/ui](https://ui.shadcn.com) + [Radix UI](https://www.radix-ui.com) (pacote `radix-ui`)
- [Sonner](https://sonner.emilkowal.ski) (toasts), [lucide-react](https://lucide.dev) (ícones), Geist via `next/font`
- Axios para a API, Vitest para testes unitários, ESLint, GitHub Actions

## Começando

Pré-requisitos: Node.js 20+ e Yarn 1.x.

```bash
cp .env.example .env.local   # informe NEXT_PUBLIC_API_URL
yarn install
yarn dev                     # http://localhost:3000
```

### Variáveis de ambiente

| Variável | Obrigatória | Descrição |
| --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | Sim (fora do modo release) | URL base da API NestJS (ex.: `http://localhost:3001`). Sem ela, o app falha com uma mensagem explicando o que configurar. |
| `NEXT_PUBLIC_NODE_ENV` | Não | `release` liga o [modo release](#modo-release-dados-fictícios) (dados fictícios, sem API). Nunca use em produção. |
| `NEXT_PUBLIC_THEME_PRIMARY` | Não | Cor primária `#RRGGBB` usada quando a API não define uma. |
| `NEXT_PUBLIC_THEME_SECONDARY` | Não | Cor secundária `#RRGGBB` usada quando a API não define uma. |

Quando o painel roda em HTTPS e a API em HTTP, as chamadas passam pelo proxy `src/app/api/proxy` para evitar mixed content.

### Scripts

| Script | O que faz |
| --- | --- |
| `yarn dev` | Servidor de desenvolvimento |
| `yarn build` / `yarn start` | Build e servidor de produção |
| `yarn dev:release` / `yarn start:release` | Mesmo que acima, em [modo release](#modo-release-dados-fictícios) |
| `yarn lint` | ESLint |
| `yarn typecheck` | `tsc --noEmit` |
| `yarn test` | Testes unitários (Vitest); `yarn test:watch` em modo watch |

O CI (`.github/workflows/ci.yml`) roda install, lint, typecheck, test e build em cada push e pull request.

## Tema

### Contrato `GET {API}/theme`

Endpoint público (a tela de login também usa). Todos os campos são opcionais.

| Campo | Formato | Uso |
| --- | --- | --- |
| `primary` | `#RRGGBB` | Botões principais, item ativo da navegação, foco, destaques |
| `secondary` | `#RRGGBB` | Botões secundários (sempre com borda) |
| `primaryForeground` | `#RRGGBB` | Texto sobre `primary`. Se ausente ou ilegível, é calculado |
| `secondaryForeground` | `#RRGGBB` | Texto sobre `secondary`. Se ausente ou ilegível, é calculado |
| `radius` | `0.5rem` ou `8px` (até `2rem`/`32px`) | Raio de borda base |
| `appName` | texto, até 40 caracteres | Nome exibido na marca e no título da página |
| `logoUrl` | URL `https://` | Logo exibido na marca |

```json
{ "primary": "#2563eb", "secondary": "#f59e0b", "appName": "Acme Ofertas" }
```

### Como funciona

- **Prioridade**: API > `NEXT_PUBLIC_THEME_*` > padrão preto e branco, campo a campo.
- **Sem flash**: o layout raiz busca o tema no servidor (`fetch` com `revalidate: 60` e timeout de 2 s) e injeta as variáveis `--theme-*` no `<html style>`. Um script inline no `<head>` aplica o modo claro/escuro salvo antes da primeira pintura.
- **Resiliência**: timeout, 404, erro de rede ou JSON inválido resultam no tema padrão, sem erro visível e sem quebrar o build.
- **Segurança**: cada campo é validado individualmente (hex com `/^#[0-9a-fA-F]{6}$/`, `logoUrl` só `https`, `appName` tratado como texto). Valores inválidos são ignorados; nenhum dado da API passa por `dangerouslySetInnerHTML`.
- **Acessibilidade**: o texto sobre as cores da marca é preto ou branco, o que tiver maior contraste (mínimo 4,5:1). Se a `primary` tiver menos de 3:1 contra o fundo, ela é escurecida (modo claro) ou clareada (modo escuro) até atingir o mínimo.
- **Derivação**: hover, ring, accent, sidebar e charts derivam de `--primary`/`--secondary` com `color-mix()` em `src/app/globals.css`.

Toda a lógica fica em funções puras em [`src/lib/theme.ts`](src/lib/theme.ts), cobertas por [`tests/theme.test.ts`](tests/theme.test.ts).

### Testando sem o endpoint no backend

O `GET /theme` ainda não existe no backend; o painel funciona sem ele. Para ver as cores customizadas, use as variáveis de ambiente:

```bash
NEXT_PUBLIC_THEME_PRIMARY=#2563eb NEXT_PUBLIC_THEME_SECONDARY=#f59e0b yarn dev
```

Ou sirva um JSON qualquer em `{NEXT_PUBLIC_API_URL}/theme`. Em produção, mudanças no tema aparecem em até 60 segundos.

## Idiomas (i18n)

O painel está em **inglês (`en`, padrão)**, **português (`pt-BR`)** e **espanhol (`es`)**. O idioma é escolhido no seletor da sidebar (ou no canto do login) e fica salvo no cookie `locale` por um ano.

- **Sem mudar as URLs**: o idioma vem do cookie, não do caminho. O layout raiz lê o cookie no servidor (`src/i18n/server.ts`), então a página já chega no idioma certo, com `<html lang>` e a descrição da página traduzidos, sem flash. Sem cookie, ou com valor inválido, vale o inglês. Como o layout lê um cookie, as páginas são renderizadas por requisição (dinâmicas).
- **Dicionários tipados**: `src/i18n/dictionaries/en.ts` é a referência e define o tipo `Dictionary`; `pt-BR.ts` e `es.ts` precisam ter exatamente as mesmas chaves, ou o `tsc` falha. Textos com valores usam funções, ex.: ``sentBy: (name) => `Sent through instance ${name}.` ``.
- **Uso nos componentes**: `const { t, locale } = useI18n()` (`src/i18n/provider.tsx`) e `t.offers.title`. Os helpers de `src/lib` recebem o dicionário ou o locale (`required(value, label, t.validation)`, `getInstanceStatus(status, t.status.instance)`, `formatCurrency(value, locale)`).
- **Troca de idioma**: atualiza o cookie, o `<html lang>` e remonta o conteúdo, para que mensagens já exibidas (ex.: erros de validação) também mudem de idioma. Um formulário preenchido pela metade é limpo nessa troca.
- **O que não é traduzido**: mensagens de erro vindas da API (aparecem como a API enviou) e dados (nomes de produtos, grupos, instâncias). Valores continuam em BRL; só o formato do número segue o idioma (`R$1,234.50`, `R$ 1.234,50`, `1234,50 R$`).

Para adicionar um idioma: crie o dicionário em `src/i18n/dictionaries/`, registre-o em `dictionaries/index.ts` e inclua o código em `locales` e `localeNames` (`src/i18n/config.ts`).

## Modo release (dados fictícios)

No modo release **nenhuma** chamada vai para a API real: o axios (`src/lib/api.ts`) usa um adapter que responde com dados fixos em memória. Serve para qualquer pessoa testar o painel sem backend. Todo o código fica em `src/mock/`.

> **Atenção:** nunca defina `NEXT_PUBLIC_NODE_ENV=release` no ambiente de produção. Nesse modo o login aceita **qualquer** e-mail e senha (bypass de autenticação).

### Como ligar

Coloque `NEXT_PUBLIC_NODE_ENV=release` no `.env` (veja `.env.example`) e rode `yarn dev`, ou use os scripts:

```bash
yarn dev:release     # next dev com NEXT_PUBLIC_NODE_ENV=release
yarn start:release   # build + start com NEXT_PUBLIC_NODE_ENV=release
```

Não é preciso definir `NEXT_PUBLIC_API_URL`.

- `isMock()` (`src/mock/index.ts`) verifica só `NEXT_PUBLIC_NODE_ENV === "release"`. Sem essa variável (por exemplo, em produção com `NODE_ENV=production`), o painel chama a API normalmente.
- O `NODE_ENV` não é usado para ligar o mock: o Next só aceita `production`, `development` e `test` (`environment-variables.md`), define o valor antes de ler o `.env` e, no código do navegador, sempre o troca por `development` ou `production`. Variáveis com prefixo `NEXT_PUBLIC_` chegam ao navegador normalmente.
- O valor é embutido no bundle **no momento do build**. Por isso `start:release` refaz o build com a variável; um build feito sem ela não liga o modo release.

### O que é mockado

| Rota | Resposta |
| --- | --- |
| `POST /auth/login` | qualquer credencial, devolve `{ access_token: "mock-token" }` |
| `GET /users/me` | usuário fixo |
| `GET /offers` | 12 ofertas; respeita `page`, `limit`, `search` e `id` |
| `POST /offers/send-offer` | `{ sent: true, instanceName, description, offer }` |
| `GET /instances` / `POST /instances` / `POST /instances/import` | lista (filtros `id`, `external_id`, `name`), cria e devolve a lista |
| `POST /instances/:id/connection` | status `connecting`, QR code fictício e pairing code `ABCD-1234` |
| `DELETE /instances/:id` | remove a instância |
| `GET /evolution/groups` | `source=database` devolve os grupos linkados, `source=evolution` os grupos da Evolution; respeita `search` |
| `POST /evolution/groups/import`, `/reset`, `/:groupId/link` | respostas no formato de `src/lib/types.ts`; `link` cria ou atualiza o grupo linkado |

Seeds: 2 instâncias (uma `open`, uma `close`), 6 grupos da Evolution (3 já linkados) e 12 ofertas. Rotas não mapeadas também respondem com sucesso: `GET` devolve `[]` e os outros métodos `{}`. A rota `/api/proxy` responde 404 e a busca de `GET {API}/theme` é pulada nesse modo (o tema usa as variáveis `NEXT_PUBLIC_THEME_*` ou o padrão).

### Estado

O estado fica em arrays em memória no navegador (`src/mock/data.ts`): criar, deletar e linkar alteram esses arrays, e **recarregar a página volta ao estado original**.

Uma faixa "Modo release: dados fictícios" aparece no rodapé enquanto o modo está ativo. Quando o modo está desligado, as rotas e os dados do mock não são carregados (import dinâmico dentro do adapter).

## Estrutura

```
src/
  app/                  rotas (login, offer, instances, groups) e layout raiz
  components/
    app-shell.tsx       sidebar, guarda de autenticação e menu do usuário
    theme/              provider, toggle e script de modo claro/escuro
    ui/                 componentes base (button, input, badge, modal, ...)
  i18n/                 idiomas: config, dicionários, provider e leitura do cookie
  lib/
    api.ts              cliente da API
    theme.ts            lógica pura do tema
    theme-server.ts     busca do tema no servidor
  mock/                 modo release: adapter, dados e rotas fictícias
tests/                  testes unitários
```
