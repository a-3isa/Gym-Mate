# Gym-Mate

A comprehensive gym and fitness tracking application.

## Project Structure

This is a monorepo containing:

- **`backend/`**: NestJS backend API
- **`mobile/`**: React Native mobile application

## Getting Started

### Prerequisites

- Node.js (version 18 or higher)
- npm or yarn
- Git

### Initial Setup

1. **Clone the repository** (if not already done):
   ```bash
   git clone <repository-url>
   cd Gym-Mate
   ```

2. **Install root dependencies** (for Git hooks):
   ```bash
   npm install
   ```

3. **Set up backend**:
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Configure your .env file
   ```

4. **Set up mobile**:
   ```bash
   cd mobile
   npm install
   cp .env.example .env
   # Configure your .env file
   ```

## Git Hooks

This monorepo uses Husky for Git hooks:

- **Pre-commit**: Runs linting and formatting on staged files in the backend
- Hooks are configured in `.husky/` directory
- Automatically installed when you run `npm install` at the root

## Development

Refer to each project's README for specific development instructions:

- [Backend README](./backend/README.md)
- [Mobile README](./mobile/README.md)

## Contributing

1. Follow the code style enforced by ESLint and Prettier
2. Run tests before committing
3. Use conventional commits
4. Ensure all pre-commit hooks pass
