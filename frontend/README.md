# Ogenna — Frontend

Next.js application for the Ogenna fabric e-commerce platform. Contains the public storefront and the admin dashboard used to manage products, variants, categories, collections, media, storefront content, discounts, and referrals.

## Stack

- **Framework:** Next.js 16 (App Router) + React 19
- **Language:** TypeScript
- **Styling:** styled-components with a shared theme (`src/styles/theme.js`)
- **Data fetching:** TanStack Query (`@tanstack/react-query`) over an Axios client
- **Icons:** `react-icons` (Phosphor Light, `react-icons/pi`, for UI; Font Awesome 6 for brand logos)
- **Typography:** Petrona (headings), Lora (sub-headings), Inter / PingFang SC (body)

## Prerequisites

- Node.js 20+
- npm 10+
- A running instance of the backend API (see `../backend/README.md`)

## Getting started

```bash
# from the repo root
cd frontend
npm install
npm run dev
```

The app runs at [http://localhost:3000](http://localhost:3000).

## Scripts

| Command         | Description                             |
| --------------- | --------------------------------------- |
| `npm run dev`   | Start the Next.js dev server on `:3000` |
| `npm run build` | Create a production build               |
| `npm run start` | Serve the production build on `:3000`   |
| `npm run lint`  | Run ESLint                              |

## Environment

Create a `.env.local` at the project root with at least the backend base URL used by the Axios client:

```
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

Only variables prefixed with `NEXT_PUBLIC_` are exposed to the browser. Never place secrets in frontend env files.

## Project structure

```
src/
  app/                  # Next.js App Router entries
    (storefront)/       # Public storefront routes
    admin/              # Authenticated admin dashboard
  components/
    admin/              # Admin shell, sidebar, header, tables
    common/             # Shared buttons, inputs, badges, dialogs
    features/           # Feature-scoped UI
    media/              # Media picker + uploader
    storefront/         # Storefront building blocks
  constants/
  contexts/
  hooks/
  lib/
  services/             # Axios client + per-resource API calls
  styles/               # Theme + global styles
  types/
```

## Conventions

- Use the shared theme in `src/styles/theme.js` for colours, typography, spacing, and radii. Do not scatter hex values.
- Keep API access in `src/services/*`. Components should go through TanStack Query hooks, not raw `fetch`.
- Treat the backend as the source of truth for products, prices, stock, discounts, and permissions.
- Handle loading, error, empty, and success states explicitly.
- Hiding a navigation link is not authorization — the backend enforces access control.

See `CLAUDE.md` for the full architecture and design-system guidelines.
