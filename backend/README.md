# Gym-Mate Backend

Backend API for the Gym-Mate application.

## Tech Stack

- **Framework**: NestJS
- **Language**: TypeScript
- **Database**: Firebase Firestore
- **Storage**: Firebase Storage
- **Authentication**: Firebase Auth
- **Real-time**: Socket.IO

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
- `src/health/`: Health check module with Firebase connectivity checks
- `src/common/`: Shared utilities, filters, interceptors, guards, decorators, DTOs
  - `interfaces/`: TypeScript data model interfaces
  - `constants/`: Application constants and event names
- `src/firebase/`: Firebase Admin SDK integration
  - `services/`: Firestore, Storage, and Auth service wrappers
- `src/websocket/`: Socket.IO gateway for real-time communication
  - `dto/`: WebSocket Data Transfer Objects

## API Documentation

### Health Check

- **GET** `/api/health`: Check the health of the application

## Firebase Setup

### Obtaining Firebase Credentials

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Navigate to **Project Settings** → **Service Accounts**
3. Click **Generate New Private Key**
4. Save the JSON file securely
5. Copy the values from the JSON file to your `.env`:
   - `project_id` → `FIREBASE_PROJECT_ID`
   - `client_email` → `FIREBASE_CLIENT_EMAIL`
   - `private_key` → `FIREBASE_PRIVATE_KEY` (keep `\n` characters)
   - Create storage bucket: `your-project-id.appspot.com` → `FIREBASE_STORAGE_BUCKET`

### Local Development with Firebase Emulator Suite

For local development without consuming Firebase quota:

1. Install Firebase CLI:
   ```bash
   npm install -g firebase-tools
   ```

2. Initialize emulators in the backend directory:
   ```bash
   firebase init emulators
   ```

3. Start emulators:
   ```bash
   firebase emulators:start
   ```

4. Set emulator environment variables in `.env`:
   ```
   FIRESTORE_EMULATOR_HOST=127.0.0.1:8080
   FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099
   FIREBASE_STORAGE_EMULATOR_HOST=127.0.0.1:9199
   ```

5. Access Emulator UI at http://localhost:4000

## WebSocket Configuration

### Socket.IO Namespace

The application uses Socket.IO with the `/sessions` namespace for real-time workout session synchronization.

### Connecting from Clients

```javascript
const socket = io('http://localhost:3000/sessions', {
  transports: ['websocket'],
  upgrade: false
});
```

### Available Events

#### Client → Server Events:
- `session:join` - Join a workout session room
  ```json
  { "sessionId": "session123", "userId": "user456" }
  ```
- `session:leave` - Leave a session room
  ```json
  { "sessionId": "session123" }
  ```
- `set:complete` - Report completed set
  ```json
  { 
    "sessionId": "session123",
    "exerciseId": "exercise789",
    "setNumber": 1,
    "weight": 50,
    "reps": 10
  }
  ```
- `turn:change` - Change active participant
  ```json
  { "sessionId": "session123", "nextUserId": "user789" }
  ```

#### Server → Client Events:
- `session:join` - Broadcast when user joins
- `session:leave` - Broadcast when user leaves
- `set:complete` - Broadcast completed set data
- `turn:change` - Broadcast turn change
- `error` - Error notifications

## Firestore Collections

### Users Collection (`/users/{uid}`)
```typescript
{
  uid: string,              // Firebase Auth UID
  email: string,
  displayName: string,
  photoURL?: string,        // Avatar URL
  height?: number,          // cm
  weight?: number,          // kg
  createdAt: Timestamp,
  updatedAt: Timestamp,
  friends?: string[]        // Array of UIDs
}
```

### Exercises Collection (`/exercises/{exerciseId}`)
```typescript
{
  id: string,
  name: string,
  category: 'chest' | 'back' | 'legs' | 'shoulders' | 'arms' | 'core' | 'cardio',
  muscleGroups: string[],
  instructions: string,
  videoUrl?: string,
  difficulty: 'beginner' | 'intermediate' | 'advanced',
  equipment: string[],
  createdAt: Timestamp
}
```

### Sessions Collection (`/sessions/{sessionId}`)
```typescript
{
  id: string,
  participants: SessionParticipant[],  // Max 2 for Phase 1
  exercises: SessionExercise[],
  status: 'pending' | 'active' | 'completed' | 'cancelled',
  currentTurn: string,                 // Active participant UID
  currentExerciseIndex: number,
  sets: SetRecord[],
  createdBy: string,
  createdAt: Timestamp,
  startedAt?: Timestamp,
  completedAt?: Timestamp
}
```

### Progress Collection (`/progress/{progressId}`)
```typescript
{
  uid: string,
  bodyMetricsHistory: BodyMetrics[],
  exerciseProgress: Map<string, ExerciseProgress>,
  workoutHistory: WorkoutSummary[],
  totalWorkouts: number,
  currentStreak: number,
  longestStreak: number,
  updatedAt: Timestamp
}
```

## Environment Variables

- `PORT`: Port to run the server (default: 3000)
- `NODE_ENV`: Environment (development/production/test)
- `CORS_ALLOWED_ORIGINS`: Comma-separated list of allowed CORS origins (use `*` for all)
- `HEALTH_HEAP_LIMIT_MB`: Heap memory threshold in MB for health checks (default: 150)
- **Firebase Configuration:**
  - `FIREBASE_PROJECT_ID`: Firebase project identifier
  - `FIREBASE_CLIENT_EMAIL`: Service account email
  - `FIREBASE_PRIVATE_KEY`: Service account private key
  - `FIREBASE_STORAGE_BUCKET`: Storage bucket name
- **Firebase Emulators (Development):**
  - `FIRESTORE_EMULATOR_HOST`: Firestore emulator host
  - `FIREBASE_AUTH_EMULATOR_HOST`: Auth emulator host
  - `FIREBASE_STORAGE_EMULATOR_HOST`: Storage emulator host
- **WebSocket Configuration:**
  - `WEBSOCKET_PORT`: WebSocket port (optional, defaults to HTTP port)
  - `WEBSOCKET_CORS_ORIGIN`: Allowed WebSocket origins

### CORS Configuration

- **Development**: CORS is enabled for all origins by default
- **Production**: CORS is **disabled by default** for security. You must explicitly set `CORS_ALLOWED_ORIGINS` in your production environment or clients from other origins will be blocked.

## Development Workflow

### Running with Firebase Emulators

For local development without consuming Firebase quota:

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start Firebase emulators (in a separate terminal):
   ```bash
   firebase emulators:start
   ```

3. Start the backend in development mode:
   ```bash
   npm run start:dev
   ```

The backend will automatically connect to the emulators if the environment variables are set.

### Testing Firebase Connectivity

After starting the backend, test Firebase connectivity:
```bash
curl http://localhost:3000/api/health
```

A successful response should include:
```json
{
  "status": "ok",
  "info": {
    "memory_heap": { "status": "up" },
    "firestore": { "status": "up" }
  }
}
```

## Deployment

### Production Requirements

**⚠️ Critical**: Before deploying to production, ensure the following environment variables are set:

- `CORS_ALLOWED_ORIGINS`: **Must be set** to a comma-separated list of allowed origins (e.g., `https://app.example.com,https://www.example.com`) or `*` to allow all origins. If not set, CORS will be disabled and cross-origin requests will fail.
- **Firebase credentials**: Must be properly configured with production service account credentials

Example production `.env`:
```
NODE_ENV=production
PORT=3000
CORS_ALLOWED_ORIGINS=https://your-frontend-domain.com
HEALTH_HEAP_LIMIT_MB=200
FIREBASE_PROJECT_ID=your-production-project
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_STORAGE_BUCKET=your-project.appspot.com
WEBSOCKET_CORS_ORIGIN=https://your-frontend-domain.com
```

### Deploying Firestore Rules and Indexes

Deploy security rules and indexes to Firebase:
```bash
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
firebase deploy --only storage:rules
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
