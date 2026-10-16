This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

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

Seeds: 2 instâncias (uma `open`, uma `close`), 6 grupos da Evolution (3 já linkados) e 12 ofertas. Rotas não mapeadas também respondem com sucesso: `GET` devolve `[]` e os outros métodos `{}`. A rota `/api/proxy` responde 404 nesse modo.

### Estado

O estado fica em arrays em memória no navegador (`src/mock/data.ts`): criar, deletar e linkar alteram esses arrays, e **recarregar a página volta ao estado original**.

Uma faixa "Modo release: dados fictícios" aparece no rodapé enquanto o modo está ativo. Quando o modo está desligado, as rotas e os dados do mock não são carregados (import dinâmico dentro do adapter).
