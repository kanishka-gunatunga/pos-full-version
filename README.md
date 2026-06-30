# Restaurant POS - Frontend

Web-based Point of Sale (POS) system for restaurant operations. Built with Next.js, TypeScript, and Tailwind CSS. Connects to an Express.js backend (in development by another team).

## Prerequisites

- Node.js 22+ (see `.nvmrc`)
- npm 10+

## Getting Started

### 1. Clone and install

```bash
git clone git@github.com:kanishka-gunatunga/restaurant-pos-frontend.git
cd restaurant-pos-frontend
npm install
```

### 2. Environment variables

Copy the example env file and configure:

```bash
cp .env.example .env.local
```

Edit `.env.local` and set `NEXT_PUBLIC_API_URL` to your Express backend **origin** (e.g. `http://localhost:5000`). The frontend will call `${NEXT_PUBLIC_API_URL}/api/...`.

### 3. Run development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Documentation

- **[Drawer Management & Device Registration](docs/DRAWER_MANAGEMENT_IMPLEMENTATION_GUIDE.md)** — Implementation guide for the cash drawer management system (multi-branch, multi-terminal).

## Project Structure

```
src/
├── app/              # Next.js App Router pages and layouts
├── components/       # Reusable UI components (Figma designs)
│   └── ui/           # Base UI primitives
├── lib/              # Utilities and shared logic
│   └── api/          # API client for Express backend
├── hooks/            # Custom React hooks
└── types/            # TypeScript types (align with backend)
```

## Scripts

| Command          | Description                  |
| ---------------- | ---------------------------- |
| `npm run dev`    | Start dev server (port 3000) |
| `npm run build`  | Production build             |
| `npm run start`  | Start production server      |
| `npm run lint`   | Run ESLint                   |
| `npm run format` | Format code with Prettier    |

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4
- **Linting:** ESLint (Next.js config)
- **Formatting:** Prettier

## Backend Integration

The backend is built with Express.js and is under development. The API client in `src/lib/api/client.ts` is ready for integration. Update `NEXT_PUBLIC_API_URL` when endpoints are available.

## UI Design

Figma designs are partially complete. Components will be implemented as designs are finalized.

## Connect to GitHub

If you have an existing GitHub repository:

```bash
git remote add origin https://github.com/kanishka-gunatunga/restaurant-pos-frontend.git
git branch -M main
git push -u origin main
```

To create a new repo on GitHub first: create the repo (no README), then run the commands above.

## Contributing

1. Create a feature branch from `main`
2. Follow existing code style (ESLint + Prettier)
3. Run `npm run lint` before committing
