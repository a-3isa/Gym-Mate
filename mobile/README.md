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
- Avatar display alongside workout history entries (backlog)

## Session Management

## Avatar System

The mobile app features a gamified avatar system that evolves based on your workout data. Your avatar levels up and develops muscle groups based on exercise history and workout consistency.

### Avatar Features

- **Gamified Avatar**: SVG-based avatar that evolves with workout progress
- **XP-based Leveling**: 50 levels with exponential progression curve
- **Muscle Group Development**: Individual muscle groups (chest, back, legs, shoulders, arms, core) grow independently (1-10 levels each)
- **Visual Feedback**: Level-up celebration modal when advancing to a new level
- **Real-time Updates**: Avatar updates automatically after session completion

### Avatar Display Locations

- **ProfileScreen**: Large avatar with full progression stats
- **HomeScreen**: Medium avatar with welcome message and level display
- **ActiveSessionScreen**: Small avatars next to participant names

### Progression System

**XP Earned**:
- Base 100 XP per workout
- Streak bonus multiplier increases rewards
- Volume bonus based on total weight lifted

**Muscle Groups**:
- Each muscle group levels 1-10 independently
- Level based on exercise categories performed
- Visual changes: body parts scale and change color with level

**Level-up Triggers**:
- Evolution modal appears when reaching new level
- Celebration animation with confetti effect
- Shows muscle groups that improved

### Avatar Components

**AvatarDisplay**:
- SVG avatar renderer using react-native-svg
- Customizable muscle group visualization
- Body parts scale based on muscle levels (0.5x to 1.5x)
- Color intensity increases with muscle definition

**AvatarProgressCard**:
- Stats card showing level, XP, streak, and muscle groups
- Compact mode for small displays
- Full mode with detailed muscle breakdown
- Progress bars for visual feedback

**AvatarEvolutionModal**:
- Level-up celebration modal
- Shows level progression (e.g., "Level 5 → Level 6")
- Displays improved muscle groups
- Spring animation for celebration effect

**useAvatar Hook**:
- Avatar state management
- Automatic fetching on authentication
- Refresh capability after workouts
- Error handling and loading states

### Avatar Customization

The avatar system now supports visual customization separate from progression mechanics. Users can personalize their avatar's appearance while maintaining their workout-based muscle development.

**CustomizeAvatarScreen Features**:
- **Live Preview**: Real-time preview of customization changes
- **Body Type Selection**: Choose from slim, athletic, muscular, or heavy builds
- **Skin Tone Customization**: 7 preset skin tone options from light to dark  
- **Hair Styling**: 6 hair styles including bald, short, medium, long, curly, buzz cut
- **Hair Colors**: 6 preset hair color options (black, brown, blonde, red, gray, white)
- **Clothing Options**: 5 clothing styles (tank top, t-shirt, hoodie, sports bra, compression)
- **Clothing Colors**: 8 vibrant color options for outfits
- **Save/Reset**: Save customization or reset to defaults

**Accessing Customization**:
- Navigate to Profile screen
- Tap "Customize Avatar" button (between Edit Profile and Friends)
- Opens modal with live preview and customization options
- Changes saved to backend and sync across app

**Customization Options**:

*Body Types*:
- **Slim**: Lean build (0.9x width multiplier)
- **Athletic**: Balanced proportions (1.0x)
- **Muscular**: Broad build (1.15x width)
- **Heavy**: Larger frame (1.25x width)

*Visual Elements*:
- **Skin Tones**: Preset colors from #FFE0BD (light) to #4A2C2A (dark)
- **Hair Styles**: Various lengths and textures rendered with SVG
- **Hair Colors**: Natural color palette with hex values
- **Clothing Styles**: Different athletic wear options
- **Clothing Colors**: Bright color palette for personalization

**Integration with Progression**:
- Customization applied as base layer
- Muscle group development scales on top
- Body type affects overall proportions
- Both systems work together for unique avatars

### Customization (Progression-Based)

**Avatar Appearance**:
- Muscle groups scale from 50% to 150% of base size
- Colors range from light (beginner) to dark (advanced)
- Body proportions change based on workout focus
- Core definition lines appear at higher levels

### Project Structure

New directories and files for avatar system:
- `components/avatar/` - Avatar display components
  - `AvatarDisplay.tsx` - SVG avatar renderer with customization support
  - `AvatarProgressCard.tsx` - Stats display card
  - `AvatarEvolutionModal.tsx` - Level-up celebration
- `screens/profile/` - Profile-related screens
  - `CustomizeAvatarScreen.tsx` - Avatar customization interface
- `hooks/useAvatar.ts` - Avatar state management hook
- `services/api/`
  - `avatar.service.ts` - Avatar progression API calls
  - `profile.service.ts` - Extended with updateAvatarConfig for customization
- `types/models.ts` - Extended with MuscleGroups, AvatarState, and AvatarConfig interfaces
- `utils/constants.ts` - Extended with avatar customization presets

### Troubleshooting

**Avatar not rendering**:
- Ensure react-native-svg is installed (`npm install`)
- Check that avatar state is loaded (not null)
- Verify backend avatar endpoint is accessible

**SVG Performance**:
- Avatar components use optimized SVG paths
- Consider reducing avatar size on low-end devices
- Use React.memo for avatar components if needed

**Evolution modal not showing**:
- Check that session completion triggers avatar refresh
- Verify level comparison logic in ActiveSessionScreen
- Ensure modal visibility state is properly managed

**Stats not updating**:
- Pull-to-refresh on ProfileScreen to force update
- Check backend progress tracking is working

**Avatar customization issues**:
- **Avatar not updating after save**: Check network connection and API response
- **Colors not displaying correctly**: Verify hex color format (#RRGGBB)
- **Customization reset after app restart**: Ensure refreshProfile is called after save
- **Preview not matching saved state**: Clear app cache and reload user profile
- Verify session completion flow

## 3D Avatar System (Phase 2A)

The app now features an advanced 3D avatar rendering system that enhances the existing 2D SVG avatars with Three.js-powered 3D models, providing a more immersive fitness tracking experience.

### Technology Stack

- **Three.js** via expo-three + expo-gl for WebGL-based 3D rendering
- **@react-three/fiber** for React Native Three.js integration  
- **Hybrid Rendering Strategy**: Automatic 3D on capable devices, 2D SVG fallback on low-end devices
- **Bundle Size Impact**: Adds ~10-15MB with Three.js (vs 50-100MB with Unity alternative)

### Setup Requirements

**Important**: 3D avatar rendering requires a custom Expo development build and will NOT work in Expo Go.

```bash
# Install dependencies
npm install

# Create custom dev build
npx expo prebuild

# Run on Android
npx expo run:android

# Run on iOS (macOS only)
npx expo run:ios
```

### Device Capability Detection

The system automatically detects if a device can handle 3D rendering:

- **iOS**: iPhone 8+ (2017 or newer) are considered capable
- **Android**: Requires 3GB+ RAM and 1080p+ screen resolution
- **Caching**: Detection results cached for 7 days to avoid repeated checks
- **Manual Override**: Users can manually enable/disable in settings

### Performance Monitoring

Real-time performance monitoring ensures smooth experience:

- **FPS Tracking**: Monitors frames per second during 3D rendering
- **Auto-Downgrade**: Switches to 2D if FPS drops below 25 for 5+ seconds
- **Performance Metrics**: View current and average FPS in settings
- **Memory Warnings**: Tracks memory pressure events

### Components

**Avatar3DDisplay** (Hybrid Component):
- Intelligently chooses between 3D and 2D rendering
- Handles device capability detection
- Manages performance monitoring
- Provides seamless fallback to 2D

**ThreeAvatarView** (3D Renderer):
- Three.js/WebGL-based 3D avatar rendering
- Placeholder geometry (box) for Phase 2A
- Prepared for GLTF model integration in Phase 2B
- Camera angle control (front/side/three-quarter)

**Avatar3DSettingsScreen** (User Preferences):
- Manual 3D enable/disable toggle
- Device capability status display
- Real-time performance metrics (FPS)
- Quality settings (placeholder for LOD)
- Reset to defaults option

**use3DAvatar Hook** (State Management):
- Centralized 3D avatar state
- Device capability checking
- User preference management
- Easy toggle between 2D/3D

### Performance Optimization

- **Device Capability Caching**: Reduces repeated detection overhead
- **Automatic Downgrade**: Maintains usability on performance drops
- **Small Avatar Optimization**: Forces 2D for small avatars (48px) in ActiveSessionScreen
- **Quality Settings**: Future LOD (Level of Detail) support prepared

### User Controls

Navigate to **Profile → 3D Avatar Settings** to:

- View device 3D capability status
- Manually enable/disable 3D rendering
- Monitor real-time performance (FPS)
- Select quality level (coming in future update)
- Reset all preferences to defaults

### Migration Path

- **Phase 2A** (Current): Three.js foundation with placeholder 3D models
- **Phase 2B** (Next): Exercise animation library & model retargeting
- **Evaluation Point**: Consider Unity migration if animation needs exceed Three.js capabilities
- **Backward Compatibility**: 2D SVG system remains fully functional

### GLTF Model Requirements (Phase 2B)

Future 3D models should meet these specifications:

**Format & Structure**:
- GLTF 2.0 or GLB (binary GLTF)
- Humanoid skeleton with standard bone names
- 5-10k triangle count for mobile optimization

**Morph Targets**:
- Blend shapes for muscle groups (chest, back, legs, shoulders, arms, core)
- Names matching MuscleGroups interface

**Materials**:
- Named materials for customization (skin, hair, clothing)
- Max 1024x1024 texture resolution
- Draco compression recommended

**Model Sources**:
- Ready Player Me (API-based generation)
- Mixamo (free rigged characters)
- Sketchfab (check licenses)
- Custom modeling (Blender)

### Troubleshooting 3D Issues

**"3D not working in Expo Go"**:
- 3D requires custom dev build
- Run `npx expo prebuild` and use `expo run:android/ios`

**"Black screen in 3D view"**:
- Check WebGL support
- Verify Three.js dependencies installed
- Check console for GLTF loading errors

**"Low FPS / Stuttering"**:
- Check device meets minimum requirements
- Try manual 2D mode in settings
- Reduce quality setting (when available)
- Close other apps to free memory

**"3D not available on my device"**:
- iOS: Requires iPhone 8 or newer
- Android: Needs 3GB+ RAM and 1080p+ screen
- Can still use 2D avatars normally

**"Crashes on Android"**:
- Check available RAM (Settings → About Phone)
- Verify GPU compatibility
- Try clearing app cache
- Use 2D mode as fallback

### Project Structure Additions

New files for 3D avatar system:
- `components/avatar/Avatar3DDisplay.tsx` - Hybrid 3D/2D component
- `components/avatar/ThreeAvatarView.tsx` - Three.js renderer
- `screens/profile/Avatar3DSettingsScreen.tsx` - 3D preferences UI
- `hooks/use3DAvatar.ts` - 3D state management
- `utils/deviceCapability.ts` - Device detection logic
- `utils/performanceMonitor.ts` - FPS monitoring
- `assets/models/README.md` - 3D model documentation

Modified files:
- `ProfileScreen.tsx` - Uses Avatar3DDisplay
- `HomeScreen.tsx` - Uses Avatar3DDisplay  
- `ActiveSessionScreen.tsx` - Uses Avatar3DDisplay with force2D
- `navigation/types.ts` - Added Avatar3DSettings route
- `navigation/ProfileStackNavigator.tsx` - Added settings screen
- `utils/constants.ts` - Added AVATAR_3D config object
- `types/models.ts` - Added Avatar3DConfig interface

## Real-time WebSocket Synchronization

The app uses `socket.io-client` to connect to the backend `/sessions` namespace for real-time session updates. `SessionSocketProvider` manages the connection with Firebase authentication and room join/leave. Use `useSessionSocket` to access the socket in screens and components.

Connection flow:

- `SessionSocketProvider` wraps the app (inside `AuthProvider`, outside `NavigationContainer`).
- `ActiveSessionScreen` calls `connect(sessionId)` on mount, which includes the Firebase ID token and joins `session:{sessionId}`.

Handled events:

- `session:update`: updates local session state immediately after server-side mutations.
- `set:complete`, `weight:update`, `turn:change`, `exercise:change`, `session:start`, `session:end`: UI reacts accordingly; navigation occurs on session end.
- `timer:start`, `timer:sync`: keep client-side timers aligned between participants.
- Note: The `weight:update` event is emitted alongside `set:complete` for external consumers who expect this event name. The `turn:change` event is non-authoritative and intended only for transient UI hints.

Timers:

- Rest timer (default 90s) and workout timer (default 5m) are managed by `useTimer` and visualized by `TimerDisplay`.
- Starting a timer emits `timer:start { sessionId, timerType, duration }`.
- While active, the screen emits `timer:sync` every ~3 seconds with remaining seconds.

Hybrid REST + WebSocket:

- All authoritative mutations use REST endpoints (record set, switch turn, complete session) for validation and persistence.
- The server broadcasts the committed state via WebSocket; the client listens for `session:update` to render the source-of-truth state.

New structure additions:

- `contexts/SessionSocketProvider.tsx`, `contexts/SessionSocketContext.tsx`
- `hooks/useSessionSocket.ts`, `hooks/useTimer.ts`
- `components/session/TimerDisplay.tsx`
- `services/socket/socket.service.ts`

Troubleshooting:

- If not connecting, confirm `BACKEND_API_URL` is set and the token is valid.
- If events are missing, verify you called `connect(sessionId)` and joined the correct room.
- If timers desync, ensure `timer:sync` is emitted and handled.

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
