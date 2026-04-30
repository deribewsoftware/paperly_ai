# Paperly AI

Paperly AI is an advanced AI-powered document creation platform that helps users generate professional research papers, business proposals, resumes, reports, presentations, and LaTeX documents in minutes. It transforms simple ideas into polished **PDF**, **DOCX**, and **PPTX** files with smart writing assistance, grammar correction, humanized content, charts, formulas, and modern formatting. Built for students, researchers, startups, and professionals, Paperly AI makes document creation faster, easier, and more intelligent.

[https://www.loom.com/share/277c565748704159b78e7dcdaf1552390](https://www.loom.com/share/277c565748704159b78e7dcdaf155239) when available.

## Features

- **AI generation** — Prompt-based document generation with streaming updates and multi-step LangChain tooling (structure, sections, grammar, humanization, and more).
- **Live editor** — TipTap-powered editing with a live page preview, typography and layout controls, and optional running headers, footers, and page numbers.
- **Rich content** — Tables, bullets, images (Cloudinary upload), charts in document sections, and **LaTeX-style equations rendered with KaTeX** (not a standalone LaTeX compiler).
- **Continue writing** — Extend the document onto additional pages when content overflows.
- **Exports** — Download **PDF**, **DOCX**, and **PPTX** via the export pipeline.
- **Authentication** — Google sign-in via NextAuth (JWT sessions).
- **Billing** — Stripe checkout and webhooks for subscription tiers (optional in local development).
- **Persistence** — Documents stored in **MongoDB** via Mongoose.

## Tools and technologies

**Core**

- [Next.js](https://nextjs.org/) 16 (App Router), [React](https://react.dev/) 19, [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/) 4
- [LangChain](https://www.langchain.com/) and the [OpenAI API](https://platform.openai.com/)
- [MongoDB](https://www.mongodb.com/) with [Mongoose](https://mongoosejs.com/) (this repository does **not** use PostgreSQL)
- Export: [pdf-lib](https://pdf-lib.js.org/), [docx](https://www.npmjs.com/package/docx), [pptxgenjs](https://gitbrent.github.io/PptxGenJS/)

**UI and content**

- [TipTap](https://tiptap.dev/) (editor), [KaTeX](https://katex.org/) (math preview), [Framer Motion](https://www.framer.com/motion/)
- Charts: [Recharts](https://recharts.org/) (insights chart); [Chart.js](https://www.chartjs.org/) is included in dependencies for chart payloads and future use

**Platform**

- [NextAuth.js](https://next-auth.js.org/) (Google provider), [Stripe](https://stripe.com/), [Cloudinary](https://cloudinary.com/)
- [Redux Toolkit](https://redux-toolkit.js.org/), [Zod](https://zod.dev/)
- Tests: [Vitest](https://vitest.dev/)

## Prerequisites

- **Node.js** 20 or newer (LTS recommended) and **npm**
- A **MongoDB** deployment (local or [Atlas](https://www.mongodb.com/atlas)) and connection string
- **OpenAI** API access for generation features
- For full local parity: **Google OAuth** app, **Cloudinary** account, and **Stripe** (only if you exercise billing)

## Environment variables

Create `.env.local` in the project root (never commit secrets). Use the table below as a guide.

| Variable | Required for | Purpose |
|----------|----------------|---------|
| `NEXTAUTH_SECRET` | Auth | Session encryption secret |
| `NEXTAUTH_URL` | Auth, billing redirects | Public site URL (e.g. `http://localhost:3000`) |
| `GOOGLE_CLIENT_ID` | Sign-in | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Sign-in | Google OAuth client secret |
| `MONGODB_URI` | Persistence | MongoDB connection string |
| `OPENAI_API_KEY` | Generation | OpenAI API key |
| `CLOUDINARY_CLOUD_NAME` | Image upload | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Image upload | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Image upload | Cloudinary API secret |
| `STRIPE_SECRET_KEY` | Billing | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | Billing webhooks | Stripe webhook signing secret |
| `STRIPE_PRICE_PRO` | Checkout | Price ID for Pro plan |
| `STRIPE_PRICE_TEAM` | Checkout | Price ID for Team plan |
| `STRIPE_PRICE_ENTERPRISE` | Checkout | Price ID for Enterprise plan |

Example skeleton (replace values):

```env
NEXTAUTH_SECRET=your-long-random-secret
NEXTAUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

MONGODB_URI=mongodb://localhost:27017/paperly
OPENAI_API_KEY=

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Optional until you test billing locally
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_PRO=
STRIPE_PRICE_TEAM=
STRIPE_PRICE_ENTERPRISE=
```

## Getting started

```bash
git clone <your-fork-or-repo-url>
cd paperly_ai
npm install
```

Copy the environment skeleton into `.env.local`, fill in at least `NEXTAUTH_*`, `GOOGLE_*`, `MONGODB_URI`, and `OPENAI_API_KEY` for core studio and generation behavior.

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Features that depend on missing providers (Cloudinary, Stripe) will degrade gracefully or show messaging in the UI until configured.

## npm scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Next.js in development mode |
| `npm run build` | Production build |
| `npm run start` | Run production server (after `build`) |
| `npm run lint` | Run ESLint |
| `npm test` | Run Vitest once |
| `npm run test:watch` | Run Vitest in watch mode |

## Testing

```bash
npm test
```

Uses Vitest (`vitest run`) for unit and API-oriented tests under `tests/`.

## Project layout

- `app/` — App Router pages, layouts, and Route Handlers (`app/api/*`)
- `components/` — React UI (studio panels, charts, auth controls)
- `features/` — Redux slices and feature-specific state
- `lib/` — Database, auth, billing, contracts, editor helpers, LangChain tools
- `agents/` — Higher-level generation and export agents

## Deployment

Deploy like any Next.js app (e.g. [Vercel](https://vercel.com/)). Set all required environment variables on the host, including a production `NEXTAUTH_URL`, MongoDB URI, and OpenAI key. Configure the Stripe webhook endpoint to point at your deployment’s billing webhook route and set `STRIPE_WEBHOOK_SECRET` accordingly.

## License

This project is **private** (see `private` in `package.json`). All rights reserved unless otherwise stated by the repository owner.
