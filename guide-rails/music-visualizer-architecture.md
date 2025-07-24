# Music Visualizer Architecture

## System Overview

The Music Visualizer is a modern web application that creates real-time audio visualizations with social sharing capabilities. The architecture is built around real-time audio processing, Canvas-based rendering, and a social platform backend.

```
┌─────────────────────────────────────────────────────────────┐
│                    Music Visualizer                         │
├─────────────────┬──────────────────┬────────────────────────┤
│   Frontend      │   Audio Engine   │   Backend Services     │
│   (React/TS)    │   (Web Audio)    │   (Supabase)          │
└─────────────────┴──────────────────┴────────────────────────┘
```

---

## Frontend Architecture

### **React Application Structure**

```
src/
├── routes/                 # File-based routing
│   ├── _index.tsx         # Main visualization creation page
│   ├── explore/           # Community discovery page
│   ├── saved/             # User's saved visualizations
│   ├── profile/           # User profile management
│   └── test-auth/         # Development debugging tools
├── components/            # Reusable UI components
│   ├── auth/             # Authentication components
│   ├── AudioSourceSelector/ # Multi-input audio controls
│   ├── AudioLevelMeter/   # Real-time audio feedback
│   └── KeyboardInput/     # Virtual keyboard interface
├── visualizers/          # Visualization engine system
│   ├── VisualizationCanvas.tsx  # Canvas management
│   ├── engines/          # Individual visualization algorithms
│   └── types.ts          # Shared visualization types
├── audio/                # Audio processing system
│   ├── sources/          # Input source implementations
│   ├── analysis/         # Audio analysis algorithms
│   └── AudioManager.ts   # Central audio coordination
├── ui/                   # Subframe UI components
│   ├── components/       # Individual UI components
│   └── layouts/          # Page layout components
└── lib/                  # Utility libraries
    ├── supabase.ts       # Database client
    └── api/              # API abstraction layer
```

### **Component Hierarchy**

```
DefaultPageLayout
├── SidebarCollapsible
│   ├── Navigation Items
│   └── Authentication Footer
└── Main Content Area
    ├── Visualization Creation (_index)
    │   ├── AudioSourceSelector
    │   ├── VisualizationCanvas
    │   └── Parameter Controls (Tabs)
    ├── Explore Page
    │   ├── Visualization Grid
    │   └── Trending Creators
    └── Profile Pages
        ├── User Information
        └── Visualization Gallery
```

---

## Audio Processing Architecture

### **Multi-Source Audio System**

```
AudioManager (Central Coordinator)
├── FileSource (MP3/Audio File Upload)
├── MicrophoneSource (Live Audio Input)
└── KeyboardSource (Synthesized Audio)
    └── SynthEngine (Oscillator + Effects)
```

### **Audio Analysis Pipeline**

```
Audio Input → Web Audio API → Analysis Chain → Visualization Data
                    ↓
            ┌─────────────────┐
            │  AnalyserNode   │
            │  - FFT Analysis │
            │  - Frequency    │
            │  - Time Domain  │
            └─────────────────┘
                    ↓
            ┌─────────────────┐
            │ Feature Extract │
            │  - Beat Detection│
            │  - Onset Analysis│
            │  - RMS/Peak     │
            └─────────────────┘
                    ↓
            ┌─────────────────┐
            │ Visualization   │
            │ Parameter Map   │
            └─────────────────┘
```

### **Real-time Processing Flow**

1. **Audio Capture** - Get audio data from selected source
2. **Analysis** - Extract frequency, amplitude, and rhythm features
3. **Parameter Mapping** - Convert audio features to visual parameters
4. **Rendering** - Update Canvas visualization at 60fps
5. **User Interaction** - Handle real-time parameter adjustments

---

## Visualization Engine Architecture

### **Engine Abstraction**

```typescript
abstract class VisualizationEngine {
  abstract render(audioData: AudioAnalysisData, settings: VisualizationSettings): void;
  abstract updateSettings(settings: Partial<VisualizationSettings>): void;
  abstract cleanup(): void;
}
```

### **Implemented Engines**

#### **CircleVisualizer**
- **Pattern:** Radial particle system with central focus
- **Audio Mapping:** Frequency → radius, Beat → pulse, Onset → flash
- **Performance:** Efficient particle management with object pooling

#### **BarsVisualizer** 
- **Pattern:** Traditional frequency spectrum bars
- **Audio Mapping:** Frequency bins → bar heights, Beat → bar width pulse
- **Performance:** Optimized rectangle drawing with gradient caching

#### **WaveVisualizer**
- **Pattern:** Flowing waveform with particle trails
- **Audio Mapping:** Waveform → path shape, Energy → particle density
- **Performance:** Path optimization with simplified curve calculations

### **Settings Architecture**

```typescript
interface VisualizationSettings {
  // Core visualization type
  type: VisualizationType;
  
  // Visual appearance
  colorTheme: ColorTheme;
  sensitivity: number;
  smoothing: number;
  
  // Animation parameters
  sizeScale: number;
  particleCount: number;
  rotationSpeed: number;
  
  // Effects
  glowIntensity: number;
  backgroundOpacity: number;
  pulseBeatSync: boolean;
  flashOnset: boolean;
}
```

---

## Backend Architecture (Supabase)

### **Database Schema**

```sql
-- User profiles (extends auth.users)
profiles {
  id: UUID (FK to auth.users)
  username: TEXT
  full_name: TEXT
  avatar_url: TEXT
  bio: TEXT
  created_at: TIMESTAMP
}

-- Visualizations
visualizations {
  id: UUID
  user_id: UUID (FK to profiles)
  title: TEXT
  description: TEXT
  settings: JSONB           -- Serialized VisualizationSettings
  audio_file_name: TEXT
  is_public: BOOLEAN
  is_draft: BOOLEAN
  likes_count: INTEGER
  saves_count: INTEGER
  created_at: TIMESTAMP
}

-- Social interactions
likes { user_id, visualization_id }
saves { user_id, visualization_id }
comments { user_id, visualization_id, content }
follows { follower_id, following_id }
```

### **Row Level Security (RLS)**

```sql
-- Users can manage their own data
CREATE POLICY "Users manage own profile" ON profiles
  FOR ALL USING (auth.uid() = id);

-- Public visualizations viewable by all
CREATE POLICY "Public visualizations viewable" ON visualizations
  FOR SELECT USING (is_public = true OR user_id = auth.uid());

-- Users can manage their own visualizations
CREATE POLICY "Users manage own visualizations" ON visualizations
  FOR ALL USING (user_id = auth.uid());
```

### **API Layer Structure**

```typescript
// Authentication API
auth/
├── signUp(email, password, metadata)
├── signIn(email, password)
├── signOut()
└── updateProfile(updates)

// Visualization API  
visualizations/
├── createVisualization(data)
├── updateVisualization(id, updates)
├── getUserVisualizations(userId)
├── getPublicVisualizations(pagination)
└── toggleLike/Save(visualizationId)
```

---

## State Management Architecture

### **Authentication State (AuthContext)**

```typescript
interface AuthContextType {
  user: User | null;              // Supabase user object
  profile: Profile | null;        // Custom profile data
  loading: boolean;               // Loading state
  signIn: (email, password) => Promise<{error}>;
  signUp: (email, password, metadata) => Promise<{error}>;
  signOut: () => Promise<{error}>;
  updateProfile: (updates) => Promise<{error}>;
}
```

### **Audio State (AudioManager)**

```typescript
interface AudioManagerState {
  isPlaying: boolean;
  currentSource: AudioSourceType;
  analysisData: AudioAnalysisData;
  volume: number;
  error: string | null;
}

interface AudioAnalysisData {
  frequencyData: Uint8Array;
  timeData: Uint8Array;
  rms: number;
  peak: number;
  beatDetected: boolean;
  onsetDetected: boolean;
}
```

### **Visualization State (useVisualization)**

```typescript
interface VisualizationState {
  settings: VisualizationSettings;
  presets: VisualizationPreset[];
  activePreset: string | null;
  // Update functions for all settings
  setVisualizationType: (type) => void;
  setColorTheme: (theme) => void;
  // ... other setters
}
```

---

## Security Architecture

### **Authentication Security**
- **Email/Password Auth** via Supabase Auth with secure session handling
- **Password Requirements** - 8+ characters, mixed case, numbers, symbols
- **Rate Limiting** - Built into Supabase Auth to prevent brute force
- **Email Verification** - Required for account activation

### **Data Security**
- **Row Level Security** - Users can only access their own private data
- **Input Validation** - Client and server-side validation for all inputs
- **CORS Configuration** - Properly configured for development and production
- **API Key Management** - Anon key for client, service key for admin operations

### **Privacy Considerations**
- **Microphone Access** - Explicit permission required, local processing only
- **Audio Data** - No server-side audio storage, client-side processing only
- **User Data** - Minimal collection, GDPR-compliant design

---

## Performance Architecture

### **Frontend Performance**
- **Canvas Optimization** - Direct Canvas manipulation, bypassing React rendering
- **Audio Processing** - Web Audio API runs on separate thread
- **Memory Management** - Object pooling for particles, reused TypedArrays
- **Bundle Splitting** - Lazy loading for visualization engines (future)

### **Real-time Constraints**
- **Audio Analysis** - 60fps target (16.67ms per frame)
- **Visualization Rendering** - 60fps target with 120fps fallback capability
- **UI Updates** - Throttled to 30fps to prevent excessive re-renders
- **Network Operations** - Async with proper loading states

### **Scalability Considerations**
- **Database Indexing** - Proper indexes on user_id, created_at, is_public
- **CDN Strategy** - Static assets served from CDN (future)
- **Caching** - Profile and visualization metadata caching (future)
- **Rate Limiting** - API rate limiting to prevent abuse

---

## Development Architecture

### **Build System**
- **Vite** - Fast development server and optimized production builds
- **TypeScript** - Type safety for complex audio processing and React components
- **ESLint + Prettier** - Code quality and formatting consistency
- **pnpm** - Fast, efficient package management

### **Testing Strategy**
- **Manual Testing** - Primary testing method for real-time audio features
- **Unit Testing** - Audio analysis functions and utility functions (future)
- **Integration Testing** - Authentication flows and database operations (future)
- **E2E Testing** - Complete user workflows (future)

### **Debugging Tools**
- **Authentication Debugging** - `/test-auth` route with multiple test components
- **Audio Debugging** - Real-time audio analysis logging and visualization
- **Database Debugging** - Raw HTTP tests and connection diagnostics
- **Performance Debugging** - Canvas rendering performance metrics (future)

---

## Deployment Architecture (Future)

### **Frontend Deployment**
- **Static Hosting** - Vercel/Netlify for optimized React app deployment
- **CDN** - Global content delivery for static assets
- **Environment Variables** - Secure configuration management

### **Backend Services**
- **Supabase Hosted** - Managed PostgreSQL, Auth, and Storage
- **Edge Functions** - Serverless functions for complex operations (future)
- **File Storage** - Supabase Storage for user avatars and exports (future)

### **Monitoring & Analytics**
- **Error Tracking** - Sentry for frontend error monitoring (future)
- **Performance Monitoring** - Web Vitals tracking (future)
- **Usage Analytics** - Privacy-respecting user analytics (future)

---

## Technology Stack Summary

### **Frontend Stack**
- **Framework:** React 18 + TypeScript + Vite
- **UI Library:** Subframe components + Tailwind CSS v3
- **Audio:** Web Audio API + MediaDevices API
- **Graphics:** Canvas API (WebGL for future 3D visualizations)
- **Routing:** React Router with file-based routing

### **Backend Stack**
- **Platform:** Supabase (PostgreSQL + Auth + Storage + Real-time)
- **Database:** PostgreSQL with Row Level Security
- **Authentication:** Supabase Auth with email/password
- **API:** Auto-generated REST API + Real-time subscriptions

### **Development Tools**
- **Package Manager:** pnpm
- **Build Tool:** Vite
- **Code Quality:** ESLint + Prettier + TypeScript
- **Version Control:** Git with conventional commits

---

**Last Updated:** Current session  
**Next Review:** After Phase 1 completion