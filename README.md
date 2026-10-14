# Offer Gateway Panel

Painel administrativo do **Offer Gateway**: lista ofertas de marketplaces (ex.: Shopee), gerencia instâncias de WhatsApp da [Evolution API](https://github.com/EvolutionAPI/evolution-api) e envia ofertas para grupos. Consome a API NestJS do repositório [`offer-gateway`](https://github.com/henriqueEz4568/offer-gateway).

O tema é **white-label**: as cores primária e secundária, o nome e o logo vêm da API (`GET /theme`), com padrão preto e branco quando ela não responde.

## Funcionalidades

- **Ofertas**: filtros por provedor, ID e busca; miniatura, preço, comissão e valor a receber; envio por linha ou pelo formulário para um grupo salvo; paginação.
- **Instâncias**: listagem do banco ou direto da Evolution API, criação, conexão (QR code e pairing code) e exclusão com confirmação.
- **Grupos**: consulta na Evolution API e salvamento com status (ativo, pendente, desativado).
- **Tema**: cores da API com contraste WCAG garantido, modo claro/escuro/sistema sem flash na carga.
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
| `NEXT_PUBLIC_API_URL` | Sim | URL base da API NestJS (ex.: `http://localhost:3001`). Sem ela, o app falha com uma mensagem explicando o que configurar. |
| `NEXT_PUBLIC_THEME_PRIMARY` | Não | Cor primária `#RRGGBB` usada quando a API não define uma. |
| `NEXT_PUBLIC_THEME_SECONDARY` | Não | Cor secundária `#RRGGBB` usada quando a API não define uma. |

Quando o painel roda em HTTPS e a API em HTTP, as chamadas passam pelo proxy `src/app/api/proxy` para evitar mixed content.

### Scripts

| Script | O que faz |
| --- | --- |
| `yarn dev` | Servidor de desenvolvimento |
| `yarn build` / `yarn start` | Build e servidor de produção |
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

## Estrutura

```
src/
  app/                  rotas (login, offer, instances, groups) e layout raiz
  components/
    app-shell.tsx       sidebar, guarda de autenticação e menu do usuário
    theme/              provider, toggle e script de modo claro/escuro
    ui/                 componentes base (button, input, badge, modal, ...)
  lib/
    api.ts              cliente da API
    theme.ts            lógica pura do tema
    theme-server.ts     busca do tema no servidor
tests/                  testes unitários
```
