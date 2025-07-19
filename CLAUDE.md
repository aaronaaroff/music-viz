# Music Visualizer Project

## Project Overview
A modern, tactical music visualizer application that creates real-time audio visualizations from uploaded MP3 files. The platform includes social features for sharing, exploring, and collaborating on visualizations.

## Core Features

### 1. Audio Visualization Engine
- **Real-time Processing**: Generate dynamic visualizations based on audio frequency, amplitude, and rhythm
- **MP3 Upload Support**: Allow users to upload their own music files
- **Visualization Presets**: Multiple visualization styles and patterns
- **Custom Parameters**: User-adjustable settings for colors, shapes, sensitivity, and effects

### 2. Editor Interface
- **Intuitive Controls**: Clean, modern UI with smooth animations
- **Live Preview**: Real-time visualization updates as parameters change
- **Timeline Editor**: Sync visualization changes to specific moments in the track
- **Layering System**: Combine multiple visualization elements

### 3. Social Platform
- **Explore Page**: Discover visualizations created by other users
- **User Profiles**: Showcase personal visualization galleries
- **Comments & Feedback**: Community interaction on shared visualizations
- **Like/Save System**: Bookmark favorite visualizations
- **Collaboration**: Fork and remix other users' visualizations

### 4. Export & Sharing
- **Video Export**: Download visualizations as video files
- **Share Links**: Direct URLs to view visualizations
- **Embed Support**: Embed visualizations on external websites
- **Project Files**: Save/load visualization configurations

## Technical Stack

### Frontend
- **Framework**: React with TypeScript
- **Routing**: React Router with fs-routes file configuration
- **UI Components**: Tailwind CSS for styling
- **Animations**: Framer Motion for smooth transitions
- **Audio Processing**: Web Audio API
- **Visualization**: Canvas API / WebGL (Three.js for 3D)

### Backend
- **Platform**: Supabase
  - Authentication & user management
  - PostgreSQL database for metadata
  - Storage for MP3 files and exported videos
  - Real-time subscriptions for social features
- **CDN**: For serving media files

### Development Tools
- **UI Design**: Subframe for component templates
- **Build System**: Vite for fast development
- **Testing**: Vitest + React Testing Library
- **Linting**: ESLint + Prettier

## Project Structure
```
visualizer/
├── src/
│   ├── routes/          # fs-routes pages
│   ├── components/      # Reusable UI components
│   ├── visualizers/     # Visualization algorithms
│   ├── audio/          # Audio processing utilities
│   ├── hooks/          # Custom React hooks
│   ├── lib/            # Supabase client & utilities
│   └── styles/         # Global styles & themes
├── public/             # Static assets
└── supabase/          # Database migrations & types
```

## Development Phases

### Phase 1: Foundation (Current)
- [ ] Set up project structure with React + TypeScript
- [ ] Configure fs-routes routing system
- [ ] Initialize Supabase integration
- [ ] Create base UI components with Tailwind + Framer Motion
- [ ] Implement basic audio upload and playback

### Phase 2: Core Visualization
- [ ] Develop audio analysis engine using Web Audio API
- [ ] Create first set of visualization algorithms
- [ ] Build visualization parameter controls
- [ ] Implement real-time preview system

### Phase 3: Editor Features
- [ ] Design and implement editor UI
- [ ] Add timeline synchronization
- [ ] Create preset management system
- [ ] Enable save/load functionality

### Phase 4: Social Platform
- [ ] User authentication with Supabase Auth
- [ ] Profile pages and visualization galleries
- [ ] Explore page with filtering/sorting
- [ ] Comments and interaction system

### Phase 5: Export & Polish
- [ ] Video export functionality
- [ ] Sharing and embed features
- [ ] Performance optimization
- [ ] Mobile responsiveness

## Design Principles
1. **Intuitive UX**: Easy for beginners, powerful for advanced users
2. **Smooth Animations**: Every interaction should feel fluid and responsive
3. **Modern Aesthetic**: Clean, tactical design with attention to detail
4. **Performance First**: Optimized for real-time visualization rendering
5. **Community Focused**: Social features that encourage creativity and sharing

## Next Steps
1. Finalize Subframe UI template/style guide
2. Set up development environment with chosen tech stack
3. Create initial project structure
4. Begin Phase 1 implementation

---

This document will be updated as the project evolves. Use it as a reference for architectural decisions and feature planning.