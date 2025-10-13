# Gym-Mate Backend

Backend API for the Gym-Mate application.

## Tech Stack

- **Framework**: NestJS
- **Language**: TypeScript
- **Database**: (Future) Firebase
- **Real-time**: (Future) Socket.IO

## Prerequisites

- Node.js (version 18 or higher)
- npm or yarn

## Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy environment variables:
   ```bash
   cp .env.example .env
   ```

3. Configure your environment variables in `.env` file.

## Scripts

- `npm run start:dev`: Start the application in development mode with hot reload
- `npm run build`: Build the application for production
- `npm run start:prod`: Start the production build
- `npm run test`: Run unit tests
- `npm run test:e2e`: Run end-to-end tests
- `npm run lint`: Lint the code
- `npm run format`: Format the code with Prettier

## Project Structure

- `src/config/`: Configuration files and environment validation
- `src/health/`: Health check module
- `src/common/`: Shared utilities, filters, interceptors, guards, decorators, DTOs

## API Documentation

### Health Check

- **GET** `/api/health`: Check the health of the application

## Environment Variables

- `PORT`: Port to run the server (default: 3000)
- `NODE_ENV`: Environment (development/production/test)
- `CORS_ALLOWED_ORIGINS`: Comma-separated list of allowed CORS origins (use `*` for all)
- `HEALTH_HEAP_LIMIT_MB`: Heap memory threshold in MB for health checks (default: 150)

### CORS Configuration

- **Development**: CORS is enabled for all origins by default
- **Production**: CORS is **disabled by default** for security. You must explicitly set `CORS_ALLOWED_ORIGINS` in your production environment or clients from other origins will be blocked.

## Deployment

### Production Requirements

**⚠️ Critical**: Before deploying to production, ensure the following environment variables are set:

- `CORS_ALLOWED_ORIGINS`: **Must be set** to a comma-separated list of allowed origins (e.g., `https://app.example.com,https://www.example.com`) or `*` to allow all origins. If not set, CORS will be disabled and cross-origin requests will fail.

Example production `.env`:
```
NODE_ENV=production
PORT=3000
CORS_ALLOWED_ORIGINS=https://your-frontend-domain.com
HEALTH_HEAP_LIMIT_MB=200
```

## Git Hooks

This project uses Husky for Git hooks, configured at the **monorepo root** (`d:\Work\Gym-Mate`).

### Setup

1. **Initial setup** (after cloning the repository):
   ```bash
   # From the monorepo root (d:\Work\Gym-Mate)
   npm install
   ```

2. **Pre-commit hook**: Automatically runs `lint-staged` on the backend code before each commit, which:
   - Runs ESLint with auto-fix
   - Formats code with Prettier

### Important Notes

- The Git repository is initialized at the **monorepo root** (`d:\Work\Gym-Mate`), not in the `backend` directory
- Husky hooks are located in `d:\Work\Gym-Mate/.husky/`
- The pre-commit hook changes to the `backend` directory before running lint-staged

## Contributing

1. Follow the code style enforced by ESLint and Prettier
2. Run tests before committing
3. Use conventional commits
4. Ensure all pre-commit hooks pass
