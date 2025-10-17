# Gym-Mate

A collaborative fitness tracking application that gamifies workouts through avatar progression and enables real-time workout sessions between friends.

## 🚀 Overview

Gym-Mate combines social fitness with gamification, allowing users to:

- **Train Together**: Real-time collaborative workout sessions with friends
- **Track Progress**: Comprehensive exercise history and personal record tracking  
- **Evolve Avatars**: XP-based leveling system with muscle group development
- **Stay Motivated**: Workout streaks, achievements, and social accountability

## 🏗️ Architecture

This is a monorepo containing both backend and mobile applications:

```
Gym-Mate/
├── backend/          # NestJS REST API + WebSocket server
├── mobile/           # React Native mobile application  
└── README.md         # This file
```

## 🛠️ Tech Stack

### Backend
- **Framework**: NestJS (Node.js)
- **Language**: TypeScript
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth
- **Storage**: Firebase Storage
- **Real-time**: Socket.IO WebSockets
- **Validation**: class-validator, class-transformer

### Mobile
- **Framework**: React Native
- **Language**: TypeScript
- **Navigation**: React Navigation v6
- **UI Library**: React Native Paper
- **State Management**: React Context + Hooks
- **Real-time**: Socket.IO client
- **Authentication**: Firebase SDK

## 📋 Prerequisites

- **Node.js**: Version 18 or higher
- **npm**: Version 8 or higher  
- **React Native CLI**: For mobile development
- **Android Studio** or **Xcode**: For device/emulator setup
- **Firebase Project**: With Firestore, Auth, and Storage enabled

## 🚀 Quick Start

### 1. Clone and Install Dependencies

```bash
# Clone the repository
git clone <repository-url>
cd Gym-Mate

# Install root dependencies (includes Husky setup)
npm install

# Install backend dependencies
cd backend
npm install

# Install mobile dependencies  
cd ../mobile
npm install
```

### 2. Firebase Setup

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Firestore, Authentication, and Storage
3. Generate service account credentials for backend
4. Download `google-services.json` (Android) and `GoogleService-Info.plist` (iOS) for mobile

### 3. Environment Configuration

**Backend** (`backend/.env`):
```bash
cp backend/.env.example backend/.env
# Edit with your Firebase credentials
```

**Mobile** (`mobile/.env`):
```bash
cp mobile/.env.example mobile/.env  
# Edit with your backend URL
```

### 4. Start Development Servers

**Terminal 1 - Backend:**
```bash
cd backend
npm run start:dev
```

**Terminal 2 - Mobile:**
```bash
cd mobile
npm start
```

**Terminal 3 - Mobile Platform:**
```bash
cd mobile
npm run android  # or npm run ios
```

## 📚 Documentation

- **[Backend Documentation](./backend/README.md)** - API endpoints, WebSocket events, Firebase setup
- **[Mobile Documentation](./mobile/README.md)** - React Native setup, navigation, components

## 🔧 Development Workflow

### Git Hooks (Husky)

Pre-commit hooks automatically run on both backend and mobile code:
- **ESLint** with auto-fix
- **Prettier** code formatting
- **Type checking**

### Code Style

- **ESLint**: Enforced code quality rules
- **Prettier**: Consistent code formatting
- **TypeScript**: Strict type checking enabled
- **Conventional Commits**: Encouraged for changelog generation

### Testing

```bash
# Backend tests
cd backend
npm run test
npm run test:e2e

# Mobile tests  
cd mobile
npm test
```

## 📱 Key Features

### Real-time Collaborative Sessions
- Turn-based workout progression
- Live set recording and sharing
- Synchronized rest/workout timers
- Exercise progression tracking

### Gamified Avatar System
- **50 Avatar Levels**: XP-based progression with exponential growth
- **Muscle Group Development**: Individual chest, back, legs, shoulders, arms, core (1-10 levels each)
- **Streak Bonuses**: Workout consistency multiplies XP gains
- **Volume Rewards**: Total lifting volume contributes to muscle growth

### Social Features
- Friend system with email-based discovery
- Session invitations and acceptance flow
- Shared workout history and achievements
- Partner progress visibility during sessions

### Progress Tracking
- Personal record tracking per exercise
- Workout history with detailed metrics
- Exercise-specific volume and frequency analysis
- Streak calculation and longest streak records

## 🔄 Real-time Architecture

The application uses WebSocket connections for real-time synchronization:

### WebSocket Events
- `session:update` - Live session state synchronization
- `set:complete` - Immediate set completion notifications
- `timer:start/stop/sync` - Synchronized workout/rest timers
- `avatar:evolution` - Live avatar level-up celebrations
- `exercise:change` - Automatic exercise progression

### State Management
- **Backend**: Authoritative state stored in Firestore
- **Mobile**: Optimistic updates with WebSocket reconciliation
- **Conflict Resolution**: Server state always wins

## 🗄️ Data Models

### Core Collections
- **`/users/{uid}`** - User profiles, friends, avatar state
- **`/sessions/{sessionId}`** - Collaborative workout sessions
- **`/exercises/{exerciseId}`** - Exercise library (100+ curated exercises)
- **`/progress/{uid}`** - Individual workout history and statistics

### Key Relationships
- Users ↔ Friends (bidirectional friendship)
- Sessions ↔ Participants (many-to-many via `participantUids`)
- Progress ↔ Exercise History (aggregated statistics)

## 🚀 Deployment

### Backend
- **Production**: Deploy to any Node.js hosting (Heroku, Railway, etc.)
- **Environment**: Requires production Firebase credentials
- **Indexes**: Deploy Firestore indexes with `firebase deploy --only firestore:indexes`

### Mobile
- **Android**: Build APK/AAB for Play Store or sideloading
- **iOS**: Build for App Store or TestFlight distribution
- **Environment**: Configure production backend URL

## 🤝 Contributing

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'feat: add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Development Guidelines
- Follow existing code style (enforced by ESLint/Prettier)
- Write tests for new features
- Update documentation for API changes
- Test on both Android and iOS for mobile changes

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Issues**: [GitHub Issues](https://github.com/your-username/gym-mate/issues)
- **Documentation**: See individual component READMEs
- **Firebase Setup**: [Backend Firebase Guide](./backend/README.md#firebase-setup)

## 🎯 Roadmap

### Upcoming Features
- [ ] Exercise video demonstrations
- [ ] Custom workout templates  
- [ ] Group challenges and competitions
- [ ] Nutrition tracking integration
- [ ] Wearable device synchronization
- [ ] Advanced analytics and insights

---

**Happy lifting! 💪**
