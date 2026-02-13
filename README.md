# Bun CMS Template

A modern, production-ready CMS template for managing product configurations. Built with TypeScript monorepo architecture using Bun runtime. Perfect as a starter for building your own configuration management systems, product catalogs, or any JSON-based content management.

## 🎯 What is this?

**Bun CMS Template** is a full-stack headless CMS that allows you to:

- Manage **products** with associated **JSON configurations**
- Support **draft/publish workflow** with automatic versioning
- Track **full history** of all changes with **rollback** capability
- **Export/Import** entire products with configs as JSON
- Provide **public API** for consuming published configurations

**Use cases:**
- Product configuration management (e-commerce, SaaS, any domain)
- Multi-tenant settings management
- Feature flags and A/B testing configs
- Localization/translations management
- Any JSON-based content that needs versioning

## ✨ Features

| Feature | Description |
|---------|-------------|
| 📦 **Products CRUD** | Create, read, update, soft-delete products |
| ⚙️ **Config Management** | JSON editor with draft/publish workflow |
| 📜 **Version History** | Full audit trail with rollback to any version |
| 🔍 **Global Search** | Search across products and configurations |
| 🔐 **JWT Authentication** | Secure admin authentication |
| 🌐 **Public API** | Unauthenticated endpoints for consumers |
| 📤 **Export/Import** | Full product export as JSON with import capability |
| 📱 **Responsive UI** | Modern React dashboard with Shadcn/ui |

## 🛠️ Tech Stack

### Backend
| Technology | Purpose |
|------------|---------|
| [Bun](https://bun.sh) v1.1+ | Fast JavaScript runtime & package manager |
| [Elysia](https://elysiajs.com) | Type-safe HTTP framework with Swagger |
| [PostgreSQL 16](https://www.postgresql.org/) | Relational database |
| [Drizzle ORM](https://orm.drizzle.team) | Type-safe SQL ORM |

### Frontend
| Technology | Purpose |
|------------|---------|
| [React 18](https://react.dev) | UI library |
| [Vite](https://vitejs.dev) | Build tool & dev server |
| [Tailwind CSS](https://tailwindcss.com) | Styling |
| [Shadcn/ui](https://ui.shadcn.com) | UI component library |
| [TanStack Query](https://tanstack.com/query) | Server state management |
| [Zustand](https://zustand-demo.pmnd.rs/) | Client state management |
| [React Router](https://reactrouter.com) | Routing |

### Infrastructure
| Technology | Purpose |
|------------|---------|
| [Turborepo](https://turbo.build/repo) | Monorepo build system |
| [Docker](https://www.docker.com/) | PostgreSQL containerization |
| [TypeScript](https://www.typescriptlang.org/) | Type safety |

## 📋 Prerequisites

Before you begin, ensure you have installed:

### 1. Bun (v1.1 or higher)

```bash
# macOS / Linux
curl -fsSL https://bun.sh/install | bash

# Windows (PowerShell as Administrator)
powershell -c "irm bun.sh/install.ps1 | iex"
```

Verify installation:
```bash
bun --version
# Should output: 1.1.x or higher
```

### 2. Docker Desktop

Download and install [Docker Desktop](https://www.docker.com/products/docker-desktop).

**Important:** Make sure Docker is **running** before starting development.

Verify installation:
```bash
docker --version
docker-compose --version
```

## 🚀 Quick Start

### Create from template

```bash
bun create github-user/bun-cms my-app
cd my-app
bun run setup
```

> Replace `github-user/bun-cms` with the actual GitHub `owner/repo`. This clones the repo, removes `.git`, installs dependencies, then `setup` handles Docker, `.env`, migrations, and seeding.

### Or clone manually

```bash
git clone <repository-url>
cd bun-cms-template
bun run setup
```

This single command will:
1. Verify Docker is running
2. Start PostgreSQL container and wait until healthy
3. Install all dependencies
4. Create `.env` files from `.env.example`
5. Run database migrations
6. Seed the database with demo data (admin user + sample product)

Once done, start developing:

```bash
bun run dev
```

| Service | URL | Description |
|---------|-----|-------------|
| **Frontend** | http://localhost:5173 | Admin dashboard |
| **Backend API** | http://localhost:3000 | REST API |
| **Swagger Docs** | http://localhost:3000/swagger | API documentation |

### 🔐 Login Credentials

| Field | Value |
|-------|-------|
| Admin | `admin@example.com` / `admin123!@#` |
| Editor | `editor@example.com` / `editor123!@#` |

<details>
<summary><strong>Manual setup (step-by-step)</strong></summary>

If you prefer to run each step manually:

```bash
# 1. Install dependencies
bun install

# 2. Start PostgreSQL
docker-compose up -d

# 3. Copy environment template (edit JWT_SECRET for production!)
cp .env.example .env
cp .env.example apps/backend/.env

# 4. Run database migrations
bun run db:migrate

# 5. Seed initial data
bun run db:seed

# 6. Start development
bun run dev
```

> **Note:** Drizzle ORM does **not** auto-sync schema like Prisma. You must run migrations manually:
> - `db:generate` — generates SQL migration files from schema changes
> - `db:migrate` — applies pending migrations to database
>
> This is intentional for production safety — you have full control over SQL migrations.

</details>

## 📜 Available Scripts

### Root Commands

| Command | Description |
|---------|-------------|
| `bun run setup` | **Full local setup** (Docker, deps, .env, migrate, seed) |
| `bun run dev` | Start all apps in development mode |
| `bun run build` | Build all apps for production |
| `bun run lint` | Run ESLint on all packages |

### Database Commands

| Command | Description |
|---------|-------------|
| `bun run db:generate` | Generate new migration from schema changes |
| `bun run db:migrate` | Apply pending migrations |
| `bun run db:seed` | Seed database with admin + sample product |

### Docker Commands

| Command | Description |
|---------|-------------|
| `docker-compose up -d` | Start PostgreSQL |
| `docker-compose down` | Stop PostgreSQL |
| `docker-compose down -v` | Stop PostgreSQL and delete data |
| `docker-compose ps` | Check container status |
| `docker-compose logs -f` | Follow container logs |

## 🔧 Configuration

### Config Types

Default config types (in `packages/shared/src/index.ts`):

```typescript
export const CONFIG_TYPES = ['general', 'settings', 'metadata', 'translations'] as const;
```

| Type | Purpose |
|------|---------|
| `general` | Basic product information |
| `settings` | Feature flags, options |
| `metadata` | SEO, Open Graph data |
| `translations` | Multi-language content |

### Customizing Config Types

1. Edit `packages/shared/src/index.ts` - update `CONFIG_TYPES`
2. Edit `apps/backend/src/db/schema.ts` - update `configTypeEnum`
3. Update Elysia schemas in configs and products modules
4. Edit `apps/frontend/src/api/configs.api.ts` - update `ConfigType`
5. Update UI labels in `ConfigEditorPage.tsx`, `HistoryPage.tsx`
6. Generate and run new migration:
   ```bash
   bun run db:generate
   bun run db:migrate
   ```

## 📁 Project Structure

```
bun-cms-template/
├── apps/
│   ├── backend/                 # Elysia API (port 3000)
│   │   ├── drizzle/             # SQL migrations
│   │   └── src/
│   │       ├── auth/            # JWT authentication
│   │       ├── configs/         # Config CRUD + publish
│   │       ├── db/              # Schema, migrations, seed
│   │       ├── products/        # Products CRUD + export/import
│   │       ├── public/          # Public API (no auth)
│   │       ├── search/          # Global search
│   │       └── middleware/      # Error handling, logging
│   │
│   └── frontend/                # React app (port 5173)
│       └── src/
│           ├── api/             # API client (fetch wrapper)
│           ├── components/      # Shadcn/ui components
│           ├── hooks/           # TanStack Query hooks
│           ├── pages/           # Route pages
│           ├── stores/          # Zustand auth store
│           └── utils/           # Helper functions
│
├── packages/
│   └── shared/                  # Shared TypeScript types
│
├── scripts/                     # Setup scripts
├── docker-compose.yml           # PostgreSQL container
├── turbo.json                   # Turborepo config
└── package.json                 # Root workspace
```

## 🔌 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Login and get JWT |
| GET | `/api/auth/me` | Get current admin info |

### Products (requires auth)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products` | List products (paginated) |
| GET | `/api/products/:id` | Get product with config statuses |
| POST | `/api/products` | Create product |
| PUT | `/api/products/:id` | Update product |
| DELETE | `/api/products/:id` | Soft delete product |
| GET | `/api/products/:id/history` | Get change history |
| GET | `/api/products/:id/export` | Export product as JSON |
| PUT | `/api/products/:id/import` | Import product from JSON |

### Configs (requires auth)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/configs/:productId/:configType` | Get config |
| PUT | `/api/configs/:productId/:configType` | Update draft |
| POST | `/api/configs/:productId/:configType/publish` | Publish draft |
| POST | `/api/configs/:productId/:configType/rollback/:version` | Rollback to version |

### Public API (no auth)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/public/configs/:code/:configType` | Get published config by product code |

### Search (requires auth)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/search?q=query` | Global search |

## 🔐 Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes | - | PostgreSQL connection string |
| `JWT_SECRET` | Yes | - | JWT signing secret (min 32 chars) |
| `PORT` | No | `3000` | Backend server port |
| `FRONTEND_URL` | No | `http://localhost:5173` | CORS allowed origin |
| `LOG_LEVEL` | No | `debug` | Log level (debug/info/warn/error) |
| `NODE_ENV` | No | `development` | Environment mode |

## � Security

### Vulnerability Status

Run security audit:
```bash
bun audit
```

**Known issues (as of February 2026):**
- `esbuild <=0.24.2` moderate vulnerability in dev server
  - **Impact:** Development only, does not affect production builds
  - **Source:** Transitive dependency from older `@esbuild-kit/core-utils`
  - **Status:** Main packages (vite, drizzle-kit) use fixed versions (0.25+)

### Security Best Practices

1. **JWT_SECRET** - Use strong, random 32+ character secret in production
2. **DATABASE_URL** - Use SSL connection in production (`?sslmode=require`)
3. **CORS** - Configure `FRONTEND_URL` to your actual domain
4. **Rate Limiting** - Consider adding rate limiting for production

## �🐛 Troubleshooting

### Docker Issues

**PostgreSQL won't start:**
```bash
# Check if port 5432 is in use
netstat -ano | findstr :5432  # Windows
lsof -i :5432                  # macOS/Linux

# Stop other PostgreSQL instances or change port in docker-compose.yml
```

**Container unhealthy:**
```bash
# Check logs
docker-compose logs postgres

# Restart container
docker-compose down
docker-compose up -d
```

### Database Issues

**Migration fails:**
```bash
# Ensure PostgreSQL is running and healthy
docker-compose ps

# Check DATABASE_URL in .env
# Try connecting manually:
docker exec -it cms-postgres psql -U postgres -d cms
```

**Seed fails:**
```bash
# Make sure migrations ran first
bun run db:migrate
bun run db:seed
```

### Frontend Issues

**API connection refused:**
- Check backend is running on port 3000
- Check `VITE_API_URL` in frontend (defaults to `http://localhost:3000`)
- Check CORS settings in backend

## 📝 License

MIT

---

**Built with ❤️ using Bun, Elysia, React, and PostgreSQL**
