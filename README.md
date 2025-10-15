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

This monorepo uses Husky for Git hooks located in the repository root:

- **Pre-commit**: Runs linting and formatting on staged files in the backend by executing `cd backend && npx lint-staged`
- Hooks are configured in the root `.husky/` directory
- The lint-staged configuration lives in `backend/.lintstagedrc.json`
- Hooks are automatically installed when you run `npm install` at the root

## Development

Refer to each project's README for specific development instructions:

- [Backend README](./backend/README.md)
- [Mobile README](./mobile/README.md)

### Mobile Development Strategy

The mobile app is built with **Expo** and currently maintains **Expo Go compatibility** for rapid development. Firebase native SDKs (`@react-native-firebase/app`, `@react-native-firebase/auth`, `@react-native-firebase/firestore`) are intentionally deferred until the Authentication phase to avoid requiring custom development clients during initial development.

**See [Mobile README](./mobile/README.md#backlog--future-tasks)** for detailed information on when and how to add Firebase native packages.

## Contributing

1. Follow the code style enforced by ESLint and Prettier
2. Run tests before committing
3. Use conventional commits
4. Ensure all pre-commit hooks pass
