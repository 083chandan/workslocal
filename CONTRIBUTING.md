# Contributing to WorksLocal

## Prerequisites

- **Node.js** 20+ (use `.nvmrc`: `nvm use`)
- **pnpm** 9+ (auto-installed via `corepack enable`)
- **Docker** (for local Redis)

## Setup

```bash
git clone git@github.com:workslocal/workslocal.git
cd workslocal
corepack enable
./scripts/setup.sh
```

## Development Workflow

### 1. Create a branch

```bash
git checkout staging && git pull
git checkout -b feat/my-feature
```

### 2. Make changes

### 3. Run checks

```bash
pnpm lint          # ESLint (via Turborepo)
pnpm typecheck     # tsc --noEmit (via Turborepo)
pnpm build         # Full build (via Turborepo)
pnpm test          # Vitest (via Turborepo)
```

### 4. Commit (Conventional Commits)

```bash
git commit -m "feat: add domain selector to tunnel creation"
git commit -m "fix: handle WebSocket reconnection timeout"
```

Prefixes: `feat:`, `fix:`, `chore:`, `docs:`, `test:`, `refactor:`, `style:`, `ci:`, `perf:`, `revert:`

### 5. Open a PR targeting `staging`

## Questions?

Open a [Discussion](https://github.com/workslocal/workslocal/discussions).
