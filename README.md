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

## Docker

Copy the sample env file first if you want to override the defaults:

```bash
cp .env.example .env
```

For local development, start the container with:

```bash
docker compose up --build
```

This setup expects the backend stack from `faith-forge` to be running on the shared Docker network `faith_forge_network` and reachable through `http://nginx/api`.

If you want a single compose that starts both repos together from this project, use:

```bash
docker compose -f docker-compose.stack.yml up --build
```

That file uses the backend sources from `../faith-forge` and the frontend sources from this repo.

You can also use:

```bash
npm run dev:stack
```

To stop it later:

```bash
npm run dev:stack:down
```

If Postgres keeps an old migration state, rebuild it from scratch with:

```bash
npm run dev:stack:reset
```

For a production-style run, use:

```bash
docker compose -f docker-compose.prod.yml up --build -d
```

Both modes accept `NEXT_PUBLIC_API_BASE_URL` and `NEXT_PUBLIC_CHURCH_ID` from the environment when you need to override the defaults.
