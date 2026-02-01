# Cloudflare Full-Stack React Template

[cloudflarebutton]

A production-ready full-stack starter template for Cloudflare Pages and Workers. Build modern web apps with React, Tailwind CSS, shadcn/ui, Hono API routes, TanStack Query, and TypeScript. Features hot-reloading development, automatic asset bundling, and seamless deployment to Cloudflare.

## ✨ Key Features

- **Hybrid Architecture**: Static assets served from Cloudflare Pages, dynamic API routes via Cloudflare Workers
- **Modern React Stack**: Vite + React 18 + React Router + TanStack Query
- **Beautiful UI**: shadcn/ui components, Tailwind CSS with custom animations and themes
- **API-First Backend**: Hono framework with CORS, logging, and error handling
- **Developer Experience**: Type-safe TypeScript, hot module replacement, error boundaries
- **Theming & Responsiveness**: Dark/light mode, mobile-first design
- **Production Ready**: Code splitting, optimizations, analytics-ready
- **Easy Customization**: Modular file structure, sidebar layout included

## 🛠 Tech Stack

| Category | Technologies |
|----------|--------------|
| **Frontend** | React 18, Vite, TypeScript, Tailwind CSS, shadcn/ui, Lucide Icons, React Router, TanStack Query, Sonner (toasts), Framer Motion |
| **Backend** | Cloudflare Workers, Hono, TypeScript |
| **UI/UX** | Headless UI (Radix), Tailwind Animate, clsx, class-variance-authority |
| **State/Data** | Zustand, Immer, React Hook Form, Zod |
| **Dev Tools** | Bun, ESLint, Wrangler, Cloudflare Vite Plugin |
| **Other** | Recharts, Date-fns, UUID, Vaul (drawers) |

## 🚀 Quick Start

### Prerequisites

- [Bun](https://bun.sh/) (package manager)
- [Cloudflare Account](https://dash.cloudflare.com/) with Pages/Workers enabled
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/) (`bunx wrangler@latest login`)

### Installation

1. Clone the repository
2. Install dependencies:
   ```
   bun install
   ```
3. Generate Worker types (if needed):
   ```
   bun run cf-typegen
   ```

### Development

Start the development server:
```
bun dev
```

- Frontend: http://localhost:3000 (Vite HMR)
- API: http://localhost:3000/api/* (proxied to Worker)
- Access: http://localhost:3000

Key development files:
- `src/pages/HomePage.tsx`: Main app entrypoint (replace the demo)
- `src/components/layout/AppLayout.tsx`: Sidebar layout (optional)
- `worker/userRoutes.ts`: Add your API routes here
- `src/index.css`: Custom Tailwind styles

### Usage Examples

#### Adding API Routes
```ts
// worker/userRoutes.ts
import { Hono } from 'hono';

export function userRoutes(app: Hono) {
  app.get('/api/users', async (c) => {
    return c.json({ users: [] });
  });
}
```
Routes auto-reload in dev.

#### Using shadcn/ui Components
All components are pre-installed:
```tsx
// src/components/MyForm.tsx
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function MyForm() {
  return (
    <div>
      <Input placeholder="Email" />
      <Button>Submit</Button>
    </div>
  );
}
```

#### API Calls with TanStack Query
```tsx
// src/hooks/useUsers.ts
import { useQuery } from '@tanstack/react-query';

export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: () => fetch('/api/users').then(res => res.json()),
  });
}
```

## ☁️ Deployment

Deploy to Cloudflare Pages + Workers:

```
bun deploy
```

This builds assets and deploys via Wrangler.

[cloudflarebutton]

### Custom Deployment

1. **Configure Wrangler**:
   ```
   bunx wrangler@latest login
   bunx wrangler@latest deploy --name your-project-name
   ```

2. **Environment Variables**:
   Edit `wrangler.jsonc` for bindings (KV, D1, R2, etc.).

3. **Pages Dashboard**:
   - Bind custom domain
   - Configure routes: `/api/*` → Worker
   - Enable analytics

## 🤝 Contributing

1. Fork the repo
2. Create a feature branch (`bun dev`)
3. Commit changes (`git commit -m 'feat: add X'`)
4. Push and open PR

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

## 🙌 Support

- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [shadcn/ui Docs](https://ui.shadcn.com/)
- [Hono Docs](https://hono.dev/)

Built with ❤️ for Cloudflare developers.