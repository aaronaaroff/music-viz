# Music Visualizer Project

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Quick Start for New Sessions

**Before starting any work, read these files in order:**

1. **`guide-rails/pair_programming.md`** - Our workflow process for story-driven development
2. **`guide-rails/project_plan_1.md`** - Current progress and next story to work on  
3. **`guide-rails/technical_considerations.md`** - Lessons learned and implementation decisions
4. **`guide-rails/music-visualizer-architecture.md`** - Overall architecture and design decisions

**Key workflow reminders:**
- Always use the TodoWrite tool to track story progress
- Follow the exact human verification format from pair_programming.md
- Update technical_considerations.md with lessons learned after each story

## Project Overview
A modern, tactical music visualizer application that creates real-time audio visualizations from uploaded MP3 files. The platform includes social features for sharing, exploring, and collaborating on visualizations. Styling is based on Subframe UI components and layouts (music-viz/src/ui/).

## Development Commands

### Frontend Development
- `pnpm dev` - Start development server (runs Vite dev server)
- `pnpm build` - Build the React frontend for production
- `pnpm preview` - Preview production build

### Package Management
- Uses `pnpm` as the package manager (not npm or yarn)
- Lock file: `pnpm-lock.yaml`

## Architecture Overview

### Technology Stack
- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS v3
- **UI Framework**: Subframe components with custom Tailwind styling
- **Audio Processing**: Web Audio API, MediaDevices API for real-time analysis
- **Visualization**: Canvas API for real-time rendering
- **Backend**: Supabase (PostgreSQL + Auth + Storage + Real-time)
- **Authentication**: Supabase Auth with Row Level Security

### Current Implementation Status
- ✅ **Authentication System**: Complete with sign up/in, password validation, profile management
- ✅ **Visualization Engine**: Three visualization types (Circle, Bars, Wave) with full customization
- ✅ **Multi-Input Audio**: File upload, microphone input, and keyboard synthesis
- ✅ **Real-time Analysis**: Beat detection, onset analysis, frequency analysis
- ✅ **UI Components**: Subframe-based components with consistent styling
- ✅ **Database Setup**: Tables created, auth working, custom table access fixed
- ✅ **Persistence**: Save/load functionality working with session persistence

## Project Structure Overview

See `guide-rails/music-visualizer-architecture.md` for detailed component organization. Key locations:
- `src/routes/` - File-based routing with React Router
- `src/components/` - Reusable UI components including audio input components
- `src/visualizers/` - Visualization engines and Canvas rendering
- `src/audio/` - Audio processing, analysis, and input source management
- `src/ui/` - Subframe UI components and layouts
- `supabase/` - Database migrations and type definitions

## Authentication Integration Notes

**IMPORTANT**: The app uses Supabase authentication with Row Level Security.

### Key Points for Auth-Aware Components:
- Use `useAuth()` hook: `const { user, profile, loading } = useAuth()`
- Check `user` for authentication state, `profile` for user data
- All database operations require authentication
- Profile is auto-created on user registration

### Current Auth Status:
- ✅ Sign up/in working with email verification
- ✅ Password validation with strength indicators
- ✅ Profile management and user context
- ✅ Sign out functionality working properly
- ✅ Database table access fixed with robust operations
- ✅ Multi-tab auth synchronization
- ✅ Session persistence across page refreshes

## Development Workflow

### Current Priority Stories:
1. **Story 1.9: Profile Page**: User profile with visualization management and settings
2. **Story 1.10: Explore Page**: Public visualization discovery and interaction
3. **Story 1.11: Export & Sharing**: Basic sharing functionality and export options

### Testing Tools Available:
- `/test-auth` route with multiple debugging components
- Raw HTTP tests to bypass Supabase JS client
- Quick table access tests with timing information

---

This document will be updated as the project evolves. Use it as a reference for architectural decisions and development workflow.