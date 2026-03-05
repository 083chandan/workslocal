# WorksLocal

> Free, open-source tunneling — expose localhost to the internet via secure HTTPS tunnels.

[![CI](https://github.com/workslocal/workslocal/actions/workflows/ci.yml/badge.svg)](https://github.com/workslocal/workslocal/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

**"It works on my local."**

WorksLocal is a free alternative to ngrok. It creates secure HTTPS tunnels so you can share your local development server with anyone on the internet. Desktop app, CLI, REST API, and first-class AI integration included.

## Features

- **HTTPS tunnels** — Expose `localhost` via `https://myapp.workslocal.exposed`
- **Multiple domains** — Choose from `.exposed`, `.io`, or `.run`
- **Desktop app** — Dark-mode GUI with real-time request monitoring (macOS + Windows)
- **CLI tool** — `workslocal http 3000` and you're live
- **REST API** — Programmatic tunnel management
- **AI integration** — MCP server for Claude, TypeScript SDK, OpenAPI spec
- **Free & open source** — MIT licensed, forever free

## Quick Start

```bash
git clone git@github.com:workslocal/workslocal.git
cd workslocal
./scripts/setup.sh
```

### Common Commands

```bash
pnpm build          # Build all (via Turborepo)
pnpm typecheck      # Type-check all packages
pnpm lint           # ESLint all packages
pnpm test           # Vitest all packages
pnpm format         # Prettier format all
pnpm changeset      # Create a changeset for versioning
```

## Tech Stack

| Layer               | Technology                               |
| ------------------- | ---------------------------------------- |
| Package Manager     | pnpm 9+                                  |
| Build Orchestration | Turborepo                                |
| Library Builds      | tsup (dual CJS/ESM)                      |
| Testing             | Vitest                                   |
| Auth                | Clerk                                    |
| Database            | Neon DB (serverless PostgreSQL) + Prisma |
| Cache               | Redis                                    |
| Deployment          | Coolify on Hetzner VPS                   |
| Portal Hosting      | Vercel                                   |
| DNS/CDN             | Cloudflare                               |
| Versioning          | Changesets                               |

## Links

- **Website:** [workslocal.dev](https://workslocal.dev)
- **Docs:** [workslocal.dev/docs](https://workslocal.dev/docs)
- **API:** [api.workslocal.dev](https://api.workslocal.dev)

## How It Works End-to-End
```
Browser/curl                    Relay Server                     CLI/Client
     |                              |                                |
     |  GET myapp.workslocal.exposed/api/users                       |
     |  Host: myapp.workslocal.exposed                               |
     | ---------------------------→ |                                |
     |                              |                                |
     |              1. Extract subdomain from Host header            |
     |              2. Look up wl:tunnel:workslocal.exposed:myapp    |
     |                 in Redis → get connectionId                   |
     |              3. Serialize HTTP request                        |
     |              4. Generate requestId                            |
     |              5. Create pending request Promise                |
     |                              |                                |
     |                              |  WS: http_request              |
     |                              | -----------------------------→ |
     |                              |                                |
     |                              |       6. Forward to localhost  |
     |                              |       7. Capture response      |
     |                              |                                |
     |                              |  WS: http_response             |
     |                              | ←----------------------------- |
     |                              |                                |
     |              8. Match requestId to pending Promise            |
     |              9. Relay response (status, headers, body)        |
     |             10. Log request (fire-and-forget)                 |
     |                              |                                |
     |  HTTP 200 { "users": [...] } |                                |
     | ←--------------------------- |                                |
```
## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

MIT — see [LICENSE](LICENSE) for details.

```

**Key decisions:**

- **`depends_on` with `condition: service_healthy`:** The relay server doesn't start until Redis reports healthy. This prevents the server from crashing on startup because Redis isn't ready yet.

- **Redis health check:** Pings Redis every 10 seconds. Uses the password so it actually authenticates.

- **Custom network:** Both services on the same `workslocal` bridge network. Redis is not exposed to the host — only the relay server can reach it via the Docker DNS name `redis`.

- **`REDIS_PASSWORD` from env:** Set this in your `.env.production` file. The docker-compose reads it for the Redis command, and your server reads `REDIS_URL=redis://:${REDIS_PASSWORD}@redis:6379` from the env file.

---
