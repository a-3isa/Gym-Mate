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
- Firebase native modules (`@react-native-firebase/*`) deferred until Authentication phase to keep Expo Go compatibility

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

## Available Scripts

- `npm start` – start the Expo development server
- `npm run android` – run the app on an Android device/emulator
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

## Development Guidelines

- Use path aliases defined in `tsconfig.json` for cleaner imports.
- Keep TypeScript strict mode in mind when creating new components.
- Prefer React Native Paper components for consistent UI.
- Place static assets under `src/assets/` and reference them via aliases.

## Development Workflow

### Expo Go Compatibility

To maintain compatibility with **Expo Go** during the initial development phase, Firebase packages (`@react-native-firebase/*`) have been deferred and will be reintroduced during the authentication implementation phase.

**Note:** These `@react-native-firebase/*` packages remain deferred until the Authentication phase and will require a custom development client once added.

This allows you to run the app directly in Expo Go without requiring a custom development client:

```bash
npm start
```

Then scan the QR code with the Expo Go app on your mobile device.

### Firebase Integration (Future Phase)

When Firebase authentication and Firestore are needed, the following packages will be added:
- `@react-native-firebase/app`
- `@react-native-firebase/auth`
- `@react-native-firebase/firestore`

At that point, you'll need to use a custom development client:

1. **Custom Dev Client**: Use `npx expo run:android` or `npx expo run:ios` to build and run with native Firebase modules.

2. **EAS Development Build**: Alternatively, create an EAS development build:
   ```bash
   npx eas build --profile development --platform android
   ```

## TODO

### Authentication Phase: Firebase Native Dependencies

The following Firebase native packages need to be added when implementing the Authentication feature:

- `@react-native-firebase/app` – Core Firebase SDK for React Native
- `@react-native-firebase/auth` – Firebase Authentication module
- `@react-native-firebase/firestore` – Cloud Firestore database module

**Rationale for deferral**: These packages require native modules that are incompatible with Expo Go. They have been intentionally deferred to maintain Expo Go compatibility during the initial development phase. Once authentication is implemented, the app will require a custom development client (via `expo run:android/ios` or EAS Build).
