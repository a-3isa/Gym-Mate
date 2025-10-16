# Gym-Mate Mobile

Train together virtually with the Gym-Mate mobile application built using Expo and React Native.

## Tech Stack

- React Native (Expo)
- TypeScript
- React Navigation (Stack & Bottom Tabs)
- React Native Paper
- Axios
- react-native-dotenv
- react-native-reanimated
- Firebase JS SDK for authentication
- AsyncStorage for persistent sessions
- expo-image-picker for profile photo uploads

## Prerequisites

- Node.js 18+
- npm 9+
- Expo CLI (`npm install -g expo-cli`)

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy the example environment file and update the values:
   ```bash
   cp .env.example .env
   ```
3. Fill in Firebase credentials from the Firebase Console and update `BACKEND_API_URL` if necessary.
   - Firebase configuration values are required for authentication to work
   - Ensure the backend is running and accessible at the specified URL

## Available Scripts

- `npm start` – start the Expo development server
- `npm run android` – run the app on an Android device/emulator (custom client build)
- `npm run android:go` – run the app on Android using Expo Go
- `npm run ios` – run the app on an iOS simulator (macOS only)
- `npm run web` – run the app in a web browser
- `npm run typecheck` – run TypeScript type checking

## Project Structure

```
mobile/
├── App.tsx
├── app.json
├── package.json
├── README.md
├── metro.config.js
├── src/
│   ├── assets/
│   ├── components/
│   ├── navigation/
│   ├── screens/
│   ├── services/
│   ├── theme/
│   ├── types/
│   └── utils/
└── ...
```

- `src/screens/` – screen components grouped by feature
  - `profile/` – profile-related screens (Edit, Friends, Add Friend)
- `src/components/` – reusable UI components
- `src/navigation/` – navigation stacks, tabs, and types
- `src/services/` – API and Firebase integrations
- `src/types/` – TypeScript types and interfaces
- `src/utils/` – utility helpers and constants
- `src/theme/` – theme configuration for React Native Paper

## Environment Variables

All environment variables are defined in `.env` and typed in `src/types/env.d.ts`. See `.env.example` for the required keys.

- `BACKEND_API_URL` – Base URL for Gym-Mate backend API
- `FIREBASE_*` – Firebase configuration values

## Authentication

The app uses Firebase Authentication with the JavaScript SDK for user management. Authentication state is managed globally using React Context.

### Features

- **Email/Password Authentication**: Users can sign up and sign in with email and password
- **Persistent Sessions**: Uses AsyncStorage to maintain authentication state across app restarts
- **Automatic Token Management**: Firebase ID tokens are automatically attached to API requests
- **Token Refresh**: Expired tokens are automatically refreshed on 401 responses
- **Profile Sync**: User profiles are automatically created/synced with the backend on first login

### Authentication Flow

1. **Registration**: User enters email, password, and display name → Firebase creates account → Backend creates user profile
2. **Login**: User enters credentials → Firebase authenticates → Backend returns user profile
3. **Protected Routes**: Authentication state determines navigation (Auth stack vs Main tabs)
4. **API Requests**: Firebase ID token automatically attached to requests via Axios interceptor

### Components

- **AuthProvider**: Global authentication state management
- **AuthContext**: Provides auth methods (login, register, logout, getIdToken, refreshProfile)
- **useAuth Hook**: Access authentication state and methods in components
- **LoginScreen/RegisterScreen**: Authentication UI with validation
- **Conditional Navigation**: AppNavigator shows Auth or Main based on auth state

### Token Management

Firebase ID tokens expire after 1 hour. The app handles this automatically:
- Tokens are refreshed before API requests if expired
- On 401 responses, tokens are force-refreshed and request retried once
- Failed refresh attempts log the user out

## Development Guidelines

- Use path aliases defined in `tsconfig.json` for cleaner imports.
- Keep TypeScript strict mode in mind when creating new components.
- Prefer React Native Paper components for consistent UI.
- Place static assets under `src/assets/` and reference them via aliases.
- Always handle authentication errors gracefully with user-friendly messages

## Development Workflow

### Running the App

The app uses Firebase JavaScript SDK which is compatible with Expo Go:

```bash
npm start
```

Then scan the QR code with the Expo Go app on your mobile device.

### Firebase Setup

1. **Create a Firebase Project**: Go to [Firebase Console](https://console.firebase.google.com/)
2. **Enable Authentication**: Navigate to Authentication → Sign-in method → Enable Email/Password
3. **Get Web App Credentials**: Project Settings → General → Your apps → Add Web app
4. **Copy Configuration**: Copy the Firebase config object to your `.env` file:
   ```
   FIREBASE_API_KEY=your-api-key
   FIREBASE_AUTH_DOMAIN=your-auth-domain
   FIREBASE_PROJECT_ID=your-project-id
   FIREBASE_STORAGE_BUCKET=your-storage-bucket
   FIREBASE_MESSAGING_SENDER_ID=your-sender-id
   FIREBASE_APP_ID=your-app-id
   ```

### Testing Authentication

1. **Start Backend**: Ensure the backend is running and accessible
2. **Configure Backend URL**: Set `BACKEND_API_URL` in `.env`
3. **Run the App**: Use `npm start` and open in Expo Go
4. **Register**: Create a new account on the Register screen
5. **Login**: Sign in with your credentials
6. **Profile**: View your profile and sign out from the Profile tab

## Profile Management

The app includes comprehensive profile management features allowing users to customize their profiles and manage social connections.

### Features

- **Profile Editing**: Update display name, height, weight, and avatar photo
- **Avatar Upload**: Use expo-image-picker to select and upload profile photos
- **Friend Management**: Add and remove friends by email search
- **Nested Navigation**: Profile tab uses nested stack navigation for sub-screens

### Profile Stack Navigation

The Profile tab contains a nested stack navigator with:
- **ProfileScreen**: Main profile view with user info and menu options
- **EditProfileScreen**: Edit profile details and upload avatar
- **FriendListScreen**: View and manage friend list
- **AddFriendScreen**: Search and add friends by email

### Image Handling

#### expo-image-picker Configuration
- **iOS**: Requires photo library permission (configured in app.json)
- **Android**: Uses system photo picker (no permissions needed for Android 13+)
- **Web**: Uses browser file picker

#### Avatar Upload Flow
1. User taps "Change Photo" in Edit Profile
2. System photo picker opens
3. User selects/crops image (1:1 aspect ratio)
4. Image uploaded to backend (max 5MB, JPEG/PNG/WebP)
5. Profile updated with new photoURL

### Friend Management

#### Adding Friends
1. Navigate to Friends → Add Friend
2. Search by email address (debounced search)
3. View search results with profile info
4. Add friend (creates bidirectional friendship)

#### Privacy Features
- **Email Search**: Exact match only, case-insensitive
- **No Enumeration**: Returns null for non-existent users
- **Debounced Search**: 300ms delay to reduce API calls

### Validation Rules

- **Display Name**: 2-50 characters, letters/spaces/hyphens/apostrophes only
- **Height**: 50-300 cm range
- **Weight**: 20-500 kg range
- **Avatar**: Max 5MB, JPEG/PNG/WebP formats
- **Email**: Valid email format for friend search

### API Service

Profile management is handled by `profile.service.ts`:
- `updateProfile()`: Update profile fields
- `uploadAvatar()`: Upload profile photo
- `getFriends()`: Retrieve friend list
- `searchUserByEmail()`: Search users by email
- `addFriend()`: Add friend by email
- `removeFriend()`: Remove friend by UID

## Exercise Library

The app features a comprehensive exercise library with 100+ curated exercises across 7 categories, complete with filtering, search, and detailed exercise information.

### Features

- **Browse Exercises**: View 100+ curated exercises across 7 categories
- **Category Filtering**: Filter by chest, back, legs, shoulders, arms, core, or cardio
- **Search Functionality**: Search by exercise name, category, or muscle groups
- **Exercise Details**: View instructions, muscle groups, equipment, and difficulty level
- **Pull-to-Refresh**: Refresh exercise list with pull gesture

### Nested Navigation Structure

The Exercises tab uses nested stack navigation:
- **ExercisesScreen**: Main library view with filtering and search
- **ExerciseDetailScreen**: Detailed exercise information

### Category Filtering UI

The exercises screen features horizontal scrollable category chips:
- **All**: Show all exercises (default)
- **Category Chips**: Tap to filter by specific category
- **Single-Select**: Tap active category again to show all
- **Icons**: Each category has a unique icon for visual recognition

### Exercise Data Structure

Each exercise includes:
- **Name**: Exercise name
- **Category**: One of 7 main categories
- **Muscle Groups**: Primary muscles targeted
- **Instructions**: Step-by-step guide
- **Difficulty**: Beginner, Intermediate, or Advanced
- **Equipment**: Required equipment (bodyweight, barbell, dumbbell, etc.)

### Client-Side Filtering

With only 100 exercises, filtering is performed client-side for optimal performance:
- Exercises are fetched once on screen focus
- Category and search filters apply instantly
- No additional API calls needed for filtering

### API Service

Exercise data is handled by `exercise.service.ts`:
- `getAllExercises()`: Fetch all exercises from backend
- `getExercisesByCategory()`: Fetch filtered exercises (server-side)
- `getExerciseById()`: Get single exercise details

### Exercise Categories

**Strength Training:**
- **Chest** (15): Bench press, push-ups, flyes, dips
- **Back** (15): Pull-ups, rows, deadlifts, lat pulldowns
- **Legs** (20): Squats, lunges, leg press, calf raises
- **Shoulders** (12): Overhead press, lateral raises, shrugs
- **Arms** (15): Bicep curls, tricep extensions, hammer curls
- **Core** (15): Planks, crunches, leg raises, Russian twists

**Cardiovascular:**
- **Cardio** (8): Running, cycling, rowing, jump rope, burpees

### Future Enhancements (Phase 2)

- Video demonstrations for exercises
- Favorite exercises feature
- Add to workout button
- Exercise history tracking
- Custom exercise creation

## Session Management

The app provides collaborative workout session management with friend invites and turn-based progression.

### Features

- **Create Sessions**: Invite friends for collaborative workouts
- **Select Exercises**: Choose exercises together with target sets configuration
- **Turn-Based Progression**: One user trains while other rests
- **Record Sets**: Track weight and reps after each set
- **Automatic Turn Switching**: Turn switches after set completion
- **Session Status Tracking**: Monitor pending, active, and completed sessions
- **Session History**: View past workout sessions and progress

### Nested Navigation Structure

The Sessions tab uses nested stack navigation:
- **SessionsScreen**: List of all sessions with status filtering
- **CreateSessionScreen**: Friend selection for new session
- **SelectExercisesScreen**: Exercise and target sets selection
- **ActiveSessionScreen**: Live workout with turn-based UI

### Session Creation Flow

1. **Select Friend**: Choose a friend from your friends list
2. **Choose Exercises**: Select exercises and set target sets (1-10 sets per exercise)
3. **Create Session**: Session is created with 'pending' status
4. **Friend Acceptance**: Friend receives invitation (acceptance flow to be enhanced in UI)
5. **Activation**: Once accepted, session becomes 'active' and workout begins

### Active Session UI

The active session screen provides:
- **Current Exercise Display**: Shows exercise name and progress
- **Your Sets**: View your completed sets with weight/reps
- **Partner's Sets**: View partner's completed sets
- **Turn Indicator**: Clear indication of whose turn it is
- **Record Set Button**: Opens modal for weight/reps input (only on your turn)
- **Waiting Indicator**: Shows "Waiting for partner..." when it's their turn
- **Skip Turn**: Option to manually switch turns
- **Complete Session**: End workout early if needed

### Turn-Based Logic

- **Initial Turn**: Creator starts with the first turn
- **Automatic Switching**: Turn switches after recording a set
- **Progress Visibility**: Both users see each other's progress
- **Manual Override**: "Skip Turn" button for flexibility
- **Completion**: Session ends when all sets are finished or manually completed

### Session States

- **Pending**: Invitation sent, awaiting friend acceptance
- **Active**: Both participants ready, workout in progress
- **Completed**: All exercises finished or manually ended
- **Cancelled**: Session cancelled by either participant

### API Service

Session management is handled by `session.service.ts`:
- `createSession()`: Create new session with friend and exercises
- `getUserSessions()`: Fetch user's sessions with optional status filter
- `getSessionById()`: Get specific session details
- `acceptSession()`: Accept or decline session invitation
- `recordSet()`: Record completed set with weight/reps
- `switchTurn()`: Manually switch turn to partner
- `completeSession()`: Mark session as completed

### Real-Time Updates

**Current Implementation**: REST API with 5-second polling for session state updates

**Next Phase (WebSocket)**: Real-time synchronization will be implemented using Socket.IO for:
- Instant turn notifications
- Live set updates
- Real-time progress tracking
- Session state changes

### Troubleshooting Session Issues

**Session Not Updating**:
- Check network connection
- Pull-to-refresh on sessions list
- Polling interval is 5 seconds in active session

**Turn Not Switching**:
- Ensure set was recorded successfully
- Use "Skip Turn" if automatic switch fails
- Check session status is 'active'

**Friend Not Appearing**:
- Ensure friend relationship exists (bidirectional)
- Refresh friends list on create session screen
- Check friend has active account

## Troubleshooting

### Common Authentication Issues

1. **AsyncStorage Warnings**: 
   - Ensure `@react-native-async-storage/async-storage` is installed
   - Clear app data/cache if persistence issues occur

2. **Token Expiration**:
   - Firebase tokens expire after 1 hour
   - The app automatically refreshes tokens
   - If issues persist, try logging out and back in

3. **Network Errors**:
   - Verify `BACKEND_API_URL` is correct
   - Ensure backend is running and accessible
   - Check Firebase project configuration

4. **Firebase Configuration**:
   - Double-check all Firebase environment variables
   - Ensure Email/Password auth is enabled in Firebase Console
   - Verify the Firebase project ID matches backend configuration

5. **Login/Register Errors**:
   - "User not found" - Check if account exists
   - "Wrong password" - Verify credentials
   - "Email already in use" - Account already exists
   - "Weak password" - Use at least 8 characters

### Image Picker Issues

1. **Permission Denied**:
   - iOS: Check Settings → Privacy → Photos
   - Android: Check app permissions in Settings
   - Restart app after granting permissions

2. **Upload Failures**:
   - Check file size (max 5MB)
   - Verify file format (JPEG/PNG/WebP)
   - Check network connection
   - Ensure backend is running

3. **Image Not Displaying**:
   - Clear app cache
   - Check photoURL in user profile
   - Verify storage service is configured

### Friend Search Issues

1. **User Not Found**:
   - Verify email is exact match
   - Check if user has Gym-Mate account
   - Email search is case-insensitive

2. **Cannot Add Friend**:
   - Cannot add yourself
   - Check if already friends
   - Verify user exists

### Dependencies Installation Issues

If you encounter issues with Firebase, AsyncStorage, or expo-image-picker:
```bash
# Clear cache and reinstall
rm -rf node_modules
npm cache clean --force
npm install

# For Expo-specific issues
expo doctor --fix-dependencies

# For expo-image-picker specifically
npx expo install expo-image-picker
```
