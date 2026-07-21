# VX House Web

Production-ready foundation for a premium SaaS website. The application uses
the Next.js App Router, TypeScript, Tailwind CSS v4, shadcn-compatible UI
primitives, Framer Motion, and Lucide icons. The initial route is intentionally
empty so product sections can be added without undoing starter content.

## Commands

```bash
pnpm install
pnpm dev
pnpm build
pnpm lint
pnpm exec tsc --noEmit
```

Node.js 22.13 or newer is required.

## Structure

```text
app/                 App Router pages, metadata, and global entry styles
components/          Shared application components
  ui/                shadcn-compatible primitives
  sections/          Reusable page-section wrappers and future sections
hooks/                Client-side React hooks
lib/                  Framework-agnostic helpers and motion presets
styles/               Design tokens and reusable visual effects
public/               Static assets
```

## Foundation conventions

- Dark mode is the default and is applied at the document root.
- Semantic colors, spacing, typography, radii, and elevation live in
  `styles/theme.css`.
- Tailwind mappings and accessibility defaults live in `app/globals.css`.
- Gradient, grid, glass, and edge-fade utilities live in `styles/effects.css`.
- Compose classes with `cn()` from `lib/utils.ts`.
- Prefer `Container` and `Section` for page layout consistency.
- Add UI primitives to `components/ui` and export them from its barrel file.
- Reuse motion presets from `lib/motion.ts` and respect reduced-motion choices.
- Set `NEXT_PUBLIC_SITE_URL` in production so canonical metadata resolves to
  the deployed origin.

## Hosting

The bundled vinext adapter produces a Cloudflare Workers-compatible build.
Optional D1, R2, and workspace-auth helpers remain available but are not active
in the foundation.
