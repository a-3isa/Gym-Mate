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

## Authentication

The backend uses Firebase Admin SDK to verify ID tokens sent by mobile clients. Authentication is required for most API endpoints and WebSocket connections.

### How It Works

1. **Token Verification**: The backend verifies Firebase ID tokens sent in the `Authorization` header as `Bearer <token>`
2. **Guard Usage**: Protected endpoints use `@UseGuards(FirebaseAuthGuard)` to enforce authentication
3. **User Access**: Controllers use `@CurrentUser()` decorator to access authenticated user information
4. **Profile Management**: User profiles are automatically created in Firestore on first authenticated request

### WebSocket Authentication

WebSocket clients must provide a Firebase ID token during connection:
- **Query Parameter**: `?token=<Firebase ID Token>`
- **Header**: `Authorization: Bearer <token>`

If authentication fails, the WebSocket connection will be terminated.

### Security Best Practices

- **Token Expiration**: Firebase ID tokens expire after 1 hour. Clients should implement token refresh
- **HTTPS Required**: Always use HTTPS in production to prevent token interception
- **Token Refresh**: Mobile apps should refresh tokens on 401 responses

## API Documentation

### Health Check

- **GET** `/api/health`: Check the health of the application

### Authentication Endpoints

- **GET** `/api/auth/me`: Get or create authenticated user profile
  - **Headers**: `Authorization: Bearer <Firebase ID Token>`
  - **Response**:
    ```json
    {
      "uid": "user123",
      "email": "user@example.com",
      "displayName": "John Doe",
      "photoURL": "https://...",
      "height": 180,
      "weight": 75,
      "friends": [],
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
    ```
  - **Note**: This endpoint creates a user profile in Firestore on first login

### Profile Management

- **PATCH** `/api/auth/profile`: Update user profile
  - **Headers**: `Authorization: Bearer <Firebase ID Token>`
  - **Request Body** (UpdateProfileDto):
    ```json
    {
      "displayName": "John Doe",  // Optional, 2-50 chars, letters/spaces/hyphens/apostrophes
      "height": 180,              // Optional, 50-300 cm
      "weight": 75                // Optional, 20-500 kg
    }
    ```
  - **Response**: Updated User object
  - **Validation**:
    - displayName: 2-50 characters, only letters, spaces, hyphens, and apostrophes
    - height: 50-300 cm
    - weight: 20-500 kg

- **POST** `/api/auth/avatar`: Upload user avatar
  - **Headers**: `Authorization: Bearer <Firebase ID Token>`
  - **Content-Type**: `multipart/form-data`
  - **Form Data**:
    - `avatar`: Image file (JPEG, PNG, or WebP)
  - **Constraints**:
    - Max file size: 5MB
    - Accepted formats: JPEG, PNG, WebP
  - **Response**: Updated User object with new photoURL
  - **Errors**:
    - 400: File size exceeds limit or invalid format
    - 500: Upload failed

### Friend Management

- **GET** `/api/auth/search?email={email}`: Search for user by email
  - **Headers**: `Authorization: Bearer <Firebase ID Token>`
  - **Query Parameters**:
    - `email`: Email address to search (required)
  - **Response**: User object if found, null otherwise
  - **Notes**:
    - Case-insensitive exact match using the stored `emailLower` field
    - Returns null (not 404) to prevent email enumeration
    - Rate limiting should be implemented in production
    - Consider backfilling legacy user documents missing `emailLower`

- **GET** `/api/auth/friends`: Get list of friends
  - **Headers**: `Authorization: Bearer <Firebase ID Token>`
  - **Response**: Array of User objects
    ```json
    [
      {
        "uid": "friend123",
        "email": "friend@example.com",
        "displayName": "Jane Smith",
        "photoURL": "https://...",
        "height": 165,
        "weight": 60
      }
    ]
    ```

- **POST** `/api/auth/friends`: Add a friend
  - **Headers**: `Authorization: Bearer <Firebase ID Token>`
  - **Request Body** (AddFriendDto):
    ```json
    {
      "email": "friend@example.com"
    }
    ```
  - **Response**:
    ```json
    {
      "message": "Friend added successfully",
      "friends": ["uid1", "uid2", ...]
    }
    ```
  - **Errors**:
    - 400: Cannot add yourself as a friend
    - 404: User not found
    - 409: Already friends with this user

- **DELETE** `/api/auth/friends/{friendUid}`: Remove a friend
  - **Headers**: `Authorization: Bearer <Firebase ID Token>`
  - **Path Parameters**:
    - `friendUid`: UID of the friend to remove
  - **Response**:
    ```json
    {
      "message": "Friend removed successfully"
    }
    ```

## Exercise Library

The backend provides read-only access to a curated library of exercises. Exercises are populated via a seed script and served through authenticated API endpoints.

### Exercise Endpoints

- **GET** `/api/exercises`: Get all exercises or filter by category
  - **Headers**: `Authorization: Bearer <Firebase ID Token>`
  - **Query Parameters** (optional):
    - `category`: Filter by category (`chest`, `back`, `legs`, `shoulders`, `arms`, `core`, `cardio`)
  - **Response**: Array of Exercise objects
    ```json
    [
      {
        "id": "abc123",
        "name": "Bench Press",
        "category": "chest",
        "muscleGroups": ["pectoralis major", "triceps"],
        "instructions": "Lie on bench, grip bar wider than shoulders...",
        "difficulty": "intermediate",
        "equipment": ["barbell", "bench"],
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ]
    ```

- **GET** `/api/exercises/:id`: Get a single exercise by ID
  - **Headers**: `Authorization: Bearer <Firebase ID Token>`
  - **Response**: Single Exercise object
  - **Errors**:
    - 404: Exercise not found

### Seeding Exercises

To populate the exercises collection with curated data:

1. Configure Firebase credentials in `.env`
2. Run the seed script:
   ```bash
   npm run seed:exercises
   ```

The seed script:
- Uses Firebase Admin SDK BulkWriter for efficient batch writes
- Supports both emulator (set `FIRESTORE_EMULATOR_HOST`) and production environments
- In production, requires `--force` flag or `NODE_ENV` not set to `production`
- Is idempotent and can be run multiple times safely (uses deterministic document IDs with format `{category}-{slugified-name}`)
- Includes preflight duplicate detection to prevent naming collisions across categories
- Seeds 100 curated exercises across 7 categories

### Exercise Categories

The library includes exercises in the following categories:
- **Chest**: 15 exercises (bench press variations, push-ups, flyes)
- **Back**: 15 exercises (pull-ups, rows, deadlifts)
- **Legs**: 20 exercises (squats, lunges, leg press)
- **Shoulders**: 12 exercises (overhead press, lateral raises)
- **Arms**: 15 exercises (bicep curls, tricep extensions)
- **Core**: 15 exercises (planks, crunches, leg raises)
- **Cardio**: 8 exercises (running, cycling, burpees)

Each exercise includes variations for different equipment levels (barbell, dumbbell, machine, bodyweight).

### Future Enhancements

- Admin endpoints for exercise management (create/update/delete)
- Video URLs for exercise demonstrations
- Exercise favorites and history tracking
- Custom exercise creation by users

## Session Management

The backend provides collaborative workout session management with friend invites and turn-based progression.

### Session Endpoints

- **POST** `/api/sessions`: Create a new workout session
  - **Headers**: `Authorization: Bearer <Firebase ID Token>`
  - **Request Body** (CreateSessionDto):
    ```json
    {
      "friendUid": "friend123",
      "exercises": [
        {
          "exerciseId": "chest-bench-press",
          "exerciseName": "Bench Press",
          "targetSets": 3
        },
        {
          "exerciseId": "chest-dumbbell-flyes",
          "exerciseName": "Dumbbell Flyes",
          "targetSets": 4
        }
      ]
    }
    ```
  - **Response**: Created Session object
  - **Requires authentication**

- **GET** `/api/sessions`: Get user's sessions
  - **Headers**: `Authorization: Bearer <Firebase ID Token>`
  - **Query Parameters** (optional):
    - `status`: Filter by status (`pending`, `active`, `completed`, `cancelled`)
  - **Response**: Array of user's Session objects
  - **Requires authentication**

- **GET** `/api/sessions/:id`: Get a specific session
  - **Headers**: `Authorization: Bearer <Firebase ID Token>`
  - **Response**: Single Session object
  - **Errors**:
    - 404: Session not found or user not participant
  - **Requires authentication**

- **POST** `/api/sessions/:id/accept`: Accept or decline session invitation
  - **Headers**: `Authorization: Bearer <Firebase ID Token>`
  - **Request Body** (AcceptSessionDto):
    ```json
    {
      "accepted": true,
      "exercises": []  // Optional: propose exercise modifications
    }
    ```
  - **Response**: Updated Session object
  - **Requires authentication**

- **PATCH** `/api/sessions/:id/status`: Update session status
  - **Headers**: `Authorization: Bearer <Firebase ID Token>`
  - **Request Body** (UpdateSessionDto):
    ```json
    {
      "status": "active"
    }
    ```
  - **Response**: Updated Session object
  - **Requires authentication**

- **POST** `/api/sessions/:id/sets`: Record a completed set
  - **Headers**: `Authorization: Bearer <Firebase ID Token>`
  - **Request Body** (RecordSetDto):
    ```json
    {
      "exerciseId": "chest-bench-press",
      "setNumber": 1,
      "weight": 60,
      "reps": 10
    }
    ```
  - **Response**: Updated Session with new set recorded
  - **Requires authentication**

- **POST** `/api/sessions/:id/turn`: Switch turn to other participant
  - **Headers**: `Authorization: Bearer <Firebase ID Token>`
  - **Response**: Updated Session with toggled turn
  - **Requires authentication**

- **POST** `/api/sessions/:id/complete`: Complete the session
  - **Headers**: `Authorization: Bearer <Firebase ID Token>`
  - **Response**: Completed Session object
  - **Requires authentication**

### Session Flow

The collaborative workout process follows these steps:

1. **Creation**: Creator invites a friend with pre-selected exercises
2. **Acceptance**: Friend accepts/declines invitation (can propose exercise modifications)
3. **Agreement**: Both users must agree on exercises before session starts
4. **Activation**: Status changes from `pending` to `active`
5. **Turn-based progression**: One user trains while other rests
6. **Set recording**: After each set, the active user records weight/reps
7. **Turn switching**: Turn automatically switches after set completion
8. **Completion**: Session completes when all exercises finished or manually ended

### Session States

Sessions transition through the following states:

- **pending**: Invitation sent, awaiting acceptance
- **active**: Both participants ready, workout in progress
- **completed**: All exercises finished or manually ended
- **cancelled**: Session cancelled by either participant

### Turn-Based Logic

- Creator starts with the first turn (`currentTurn` set to creator's UID)
- After recording a set, turn automatically switches to partner
- Both users can see each other's progress in the session
- Manual turn switching is available via the `/turn` endpoint
- Session completes when all target sets are finished by both participants

**Note**: Real-time synchronization via WebSocket is planned for Phase 1 - Real-time Session Sync. This phase focuses on REST API state management.

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

### Storage Rules

- **Rules file**: Defined at `storage.rules` and deployed with `firebase deploy --only storage:rules`.
- **Access model**: `StorageService` uploads avatar objects as private by default. Private files receive long-lived signed URLs in production and tokenized download URLs when running against emulators.
- **Emulator URLs**: When `STORAGE_EMULATOR_HOST` or `FIREBASE_STORAGE_EMULATOR_HOST` is set, download URLs follow `http://<host>/v0/b/<bucket>/o/<path>?alt=media[&token=...]`.
- **Scope**: Avatars live under `avatars/{uid}/...`; authenticated users can only access their own subtree.

## WebSocket Configuration

### Socket.IO Namespace

The application uses Socket.IO with the `/sessions` namespace for real-time workout session synchronization.

### Connecting from Clients

```javascript
// First, get the Firebase ID token
const idToken = await firebase.auth().currentUser.getIdToken();

// Then connect with authentication
const socket = io('http://localhost:3000/sessions', {
  transports: ['websocket'],
  upgrade: false,
  query: {
    token: idToken
  }
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
- `server:error` - Error notifications

## Validation

### UpdateProfileDto
Used for profile updates with the following validation rules:
- **displayName**: Optional string, 2-50 characters, only letters, spaces, hyphens, and apostrophes
- **height**: Optional number, 50-300 cm range
- **weight**: Optional number, 20-500 kg range
- **photoURL**: System-set after avatar upload

### AddFriendDto
Used for adding friends by email:
- **email**: Required, valid email format

## Firestore Collections

### Users Collection (`/users/{uid}`)
```typescript
{
  uid: string,              // Firebase Auth UID
  email: string,
  emailLower?: string,      // Lowercased email for case-insensitive search
  displayName: string,
  photoURL?: string,        // Avatar URL from Storage
  height?: number,          // Height in cm (50-300)
  weight?: number,          // Weight in kg (20-500)
  createdAt: Timestamp,
  updatedAt: Timestamp,
  friends?: string[]        // Array of friend UIDs
}
```

> Keep `participantUids` in sync with `participants.map(p => p.uid)` during create/update flows. A future helper may populate this automatically to avoid divergence.

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
  participantUids: string[], // required for access checks and array-contains queries
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

// SessionParticipant
{
  uid: string,
  displayName: string,
  status: 'invited' | 'accepted' | 'declined' | 'active' | 'resting'
}

// SessionExercise
{
  exerciseId: string,
  exerciseName: string,
  targetSets: number,
  completedSets: number
}

// SetRecord
{
  participantUid: string,
  exerciseId: string,
  setNumber: number,
  weight: number,        // in kilograms
  reps: number,
  completedAt: Timestamp
}
```

### Progress Collection (`/progress/{progressId}`)
```typescript
{
  uid: string,
  bodyMetricsHistory: BodyMetrics[],
  exerciseProgress: Record<string, ExerciseProgress>, // serializable map keyed by exerciseId
  workoutHistory: WorkoutSummary[],
  totalWorkouts: number,
  currentStreak: number,
  longestStreak: number,
  updatedAt: Timestamp
}
```

`exerciseProgress` is stored as a plain object so Firestore can serialize it without custom converters.

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
  - `WEBSOCKET_CORS_ORIGIN`: Allowed WebSocket origins (comma-separated)

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

**Note**: Before deploying, update `.firebaserc` with your actual Firebase project ID from Firebase Console.

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
