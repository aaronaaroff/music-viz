# Music Visualizer - Project Plan Phase 2

## Current Phase: Phase 2 - Advanced Visualization & Bug Fixes

### Phase Status: **IN PROGRESS** 🚧
- Phase 1 Foundation Complete ✅
- Critical bug fixes from production identified
- Advanced visualization features planned
- Layer-based and Cthugha mode systems specified

---

## 🐛 Critical Bug Fixes (Priority 0)

### **Bug 1a: Page Session Persistence** 🔴 **CRITICAL**
**Issue:** Page sessions not sustaining when switching tabs. Production 404 errors on refresh for non-root pages.
**Symptoms:**
- GET https://vuzik-ron-mans-projects.vercel.app/explore returns 404 on refresh
- Sessions lost when switching between browser tabs
- Auth state not persisting correctly across navigation

**Root Cause Analysis:**
- Vercel needs proper SPA configuration for client-side routing
- Missing fallback route configuration
- Session storage not syncing across tabs

**Fix Implementation:**
- [ ] Add vercel.json with proper rewrite rules for SPA
- [ ] Implement broadcast channel for cross-tab session sync
- [ ] Add service worker for offline session persistence
- [ ] Ensure all routes handle direct URL access

---

### **Bug 1b: Folder Badge Positioning** 🟡 **HIGH**
**Issue:** Folder badges (line 440 in /saved/route.tsx) rendering in top-left corner instead of on cards
**Fix:**
- [ ] Update CSS positioning from absolute to relative within card context
- [ ] Ensure proper z-index stacking
- [ ] Test responsive behavior across screen sizes

---

### **Bug 1c: Audio Source Database Loading** 🔴 **CRITICAL**
**Issue:** Audio files loading incorrectly from database - wrong files playing for saved projects
**Symptoms:**
- Correct filename displays but wrong audio plays
- Audio from different projects playing
- Inconsistent audio source loading

**Root Cause Analysis:**
- Possible storage bucket path confusion
- Audio blob caching issues
- File reference mismatch in database

**Fix Implementation:**
- [ ] Audit audio storage and retrieval logic
- [ ] Implement unique file identifiers (UUIDs)
- [ ] Add checksum validation for audio files
- [ ] Clear audio cache on project load
- [ ] Test with multiple concurrent projects

---

### **Bug 2: Follower Count Updates** 🟡 **MEDIUM**
**Issue:** Follower numbers not updating correctly in UI
**Fix:**
- [ ] Implement real-time subscription to follower count changes
- [ ] Add optimistic UI updates for follow/unfollow actions
- [ ] Ensure database triggers update counts correctly
- [ ] Add follower count refresh on profile load

---

### **Bug 3: Saved Page Item Removal** 🟢 **LOW**
**Issue:** Cannot remove items from saved page within the page itself
**Fix:**
- [ ] Add delete button to saved visualization cards
- [ ] Implement confirmation dialog for deletion
- [ ] Add optimistic UI removal with rollback on error
- [ ] Update folder counts after removal

---

### **Bug 4: Folder Selection Popover UI** 🟢 **LOW**
**Issue:** Popover includes unnecessary description text and clips under neighboring divs
**Fix:**
- [ ] Remove instructional text from popover
- [ ] Adjust z-index to proper stacking order (z-50 or higher)
- [ ] Ensure popover stays within viewport bounds
- [ ] Add proper overflow handling

---

## 📋 Phase 2 Stories

### **Story 2.1: Style Editor - Color Scheme Customization** 
**Priority:** HIGH
**Acceptance Criteria:**
- [ ] Add "Themes" tab in settings or main editor
- [ ] Create color palette selector with preset themes
- [ ] Allow custom color picking for:
  - Primary visualization colors
  - Background colors
  - Accent colors
  - UI element colors
- [ ] Real-time preview of color changes
- [ ] Save custom themes to user profile
- [ ] Share themes between projects
- [ ] Export/import theme configurations

**Technical Implementation:**
- Use CSS custom properties for dynamic theming
- Store theme configs in user_preferences table
- Create ThemeContext for app-wide theme management
- Implement color picker component (react-color or similar)

---

### **Story 2.2: Layer-Based Visualization System**
**Priority:** CRITICAL
**Description:** Main visualization mode with drag-and-drop layer management

**Core Features:**
- [ ] Layer panel showing all active layers
- [ ] Drag-and-drop to reorder layers
- [ ] Layer visibility toggles (eye icon)
- [ ] Layer opacity controls (0-100%)
- [ ] Layer blend modes (multiply, screen, overlay, etc.)
- [ ] Group selection (shift-click or drag selection)
- [ ] Copy/paste layers between projects

**Visual Elements Library:**
- [ ] **Geometric Elements:**
  - Grids (square, hexagonal, triangular)
  - Planes (2D/3D perspective)
  - Tessellations and patterns
- [ ] **Effects Elements:**
  - Lightning/electricity effects
  - Particle systems
  - Wave distortions
  - Fractals
- [ ] **User Content:**
  - Image upload for stencils/masks
  - Custom SVG shapes
  - Text overlays with audio reactivity
- [ ] **Audio-Reactive Elements:**
  - Frequency bars
  - Waveforms
  - Beat pulses
  - Spectrum analyzers

**Layer Effects (per-layer controls):**
- [ ] **Color Effects:**
  - Hue shift
  - Saturation
  - Brightness/contrast
  - Color palette mapping
- [ ] **Distortion Effects:**
  - Blur/sharpen
  - Pixelation ("acidify")
  - Kaleidoscope
  - Ripple/wave
- [ ] **Motion Effects:**
  - Position (X, Y, Z)
  - Rotation (angle, speed)
  - Scale (size pulsing)
  - Path animation
- [ ] **Audio Mapping:**
  - Frequency range selection
  - Sensitivity/threshold
  - Smoothing/attack/decay
  - Beat detection mapping

**UI Implementation:**
- [ ] Photoshop-style layers panel on right side
- [ ] Properties panel for selected layer(s)
- [ ] Toolbar with element library
- [ ] Context menus for quick actions
- [ ] Keyboard shortcuts (Cmd+C/V, Delete, etc.)

**Technical Architecture:**
```typescript
interface Layer {
  id: string;
  type: 'element' | 'effect' | 'group';
  element?: VisualElement;
  effects: LayerEffect[];
  position: { x: number; y: number; z: number };
  opacity: number;
  blendMode: string;
  audioMapping?: AudioMapping;
  visible: boolean;
  locked: boolean;
  parent?: string; // for grouped layers
}
```

---

### **Story 2.3: Cthugha Mode Integration**
**Priority:** HIGH
**Description:** Live performance mode based on classic Cthugha visualizer

**Core Features:**
- [ ] Import and adapt refs/cthugha-js-main TypeScript code
- [ ] Full keyboard control system (matching original Cthugha)
- [ ] Live audio input (file or microphone)
- [ ] Real-time effect switching via keyboard
- [ ] Classic Cthugha visual presets

**Keyboard Controls (from Cthugha):**
- Number keys: Switch between visualization presets
- Letter keys: Apply effects and modifiers
- Space: Pause/resume
- Arrow keys: Navigation/parameter adjustment
- Function keys: Advanced settings

**Visual Modes:**
- [ ] Classic oscilloscope
- [ ] Flame/fire effects
- [ ] Plasma fields
- [ ] Star fields
- [ ] Fractal patterns
- [ ] Wave interference patterns

**UI in Editor Mode (not fullscreen):**
- [ ] Translate keyboard controls to tactile UI controls
- [ ] Show current effect/preset name
- [ ] Visual keyboard map showing active keys
- [ ] Parameter sliders for fine control
- [ ] Preset selector dropdown

**Customization Options:**
- [ ] "Deacidify" toggle for smoother graphics
- [ ] Color theme override
- [ ] Sensitivity adjustment
- [ ] Frame rate control

**Technical Implementation:**
- [ ] Port refs/cthugha-js-main to React component
- [ ] Create CthughaRenderer class
- [ ] Implement keyboard event system
- [ ] Add WebGL shaders for effects
- [ ] Optimize for 60fps performance

---

### **Story 2.4: Mode Switching & Persistence**
**Priority:** CRITICAL
**Description:** Seamless switching between Layer and Cthugha modes

**Mode Toggle:**
- [ ] Add mode toggle button between fullscreen and save buttons
- [ ] Smooth transition animation between modes
- [ ] Preserve settings when switching (session-based)
- [ ] Clear mode indication in UI

**Fullscreen Behavior:**
- [ ] **Layer Mode Fullscreen:**
  - Hide all editing controls
  - Show only visualization
  - Minimal playback controls (play/pause)
  - ESC key to exit
- [ ] **Cthugha Mode Fullscreen:**
  - Full keyboard control active
  - No UI elements visible
  - ESC key to exit
  - Optional overlay for key hints

**Persistence Logic:**
- [ ] Save current mode with project
- [ ] Save all layer configurations
- [ ] Save Cthugha preset and settings
- [ ] Load correct mode on project open
- [ ] Maintain mode through save/update operations

**Session Management:**
- [ ] Store mode settings in session (24hr persistence)
- [ ] Separate settings storage for each mode
- [ ] New project resets to user's default mode
- [ ] Remember last used mode per user

**Database Schema Updates:**
```sql
ALTER TABLE visualizations ADD COLUMN mode VARCHAR(20) DEFAULT 'layer';
ALTER TABLE visualizations ADD COLUMN layer_config JSONB;
ALTER TABLE visualizations ADD COLUMN cthugha_config JSONB;
ALTER TABLE user_preferences ADD COLUMN default_mode VARCHAR(20) DEFAULT 'layer';
```

---

## 🚀 Implementation Roadmap

### **Sprint 1: Critical Bug Fixes (Week 1)**
1. Fix production routing (Bug 1a) - Day 1-2
2. Fix audio loading issues (Bug 1c) - Day 2-3
3. Fix folder badges (Bug 1b) - Day 4
4. Fix follower counts (Bug 2) - Day 4
5. Add remove functionality (Bug 3) - Day 5
6. Fix popover UI (Bug 4) - Day 5

### **Sprint 2: Style Editor (Week 2)**
1. Design theme system architecture - Day 1
2. Implement color picker UI - Day 2
3. Create theme presets - Day 3
4. Add persistence and sharing - Day 4
5. Testing and polish - Day 5

### **Sprint 3: Layer System Foundation (Week 3-4)**
1. Create layer data model - Day 1-2
2. Build layer panel UI - Day 3-4
3. Implement drag-and-drop - Day 5-6
4. Add basic visual elements - Day 7-8
5. Implement effects system - Day 9-10

### **Sprint 4: Cthugha Integration (Week 5)**
1. Port refs/cthugha-js-main code - Day 1-2
2. Create keyboard control system - Day 3
3. Implement visual modes - Day 4
4. Add UI controls for non-fullscreen - Day 5

### **Sprint 5: Mode Integration (Week 6)**
1. Implement mode switching - Day 1
2. Add persistence logic - Day 2
3. Update save/load system - Day 3
4. Fullscreen implementations - Day 4
5. Testing and optimization - Day 5

---

## 📊 Success Metrics

### **Bug Fix Validation:**
- [ ] Zero 404 errors on page refresh in production
- [ ] Audio files load correctly 100% of the time
- [ ] Folder badges display in correct position
- [ ] Follower counts update in real-time
- [ ] All CRUD operations work from saved page

### **Feature Success Criteria:**
- [ ] Users can create multi-layer visualizations
- [ ] Layer system performs at 60fps with 10+ layers
- [ ] Cthugha mode matches original functionality
- [ ] Mode switching preserves all settings
- [ ] Projects load in correct mode every time

### **Performance Targets:**
- Page load time < 2 seconds
- Mode switch time < 500ms
- Layer operations < 16ms (60fps)
- Save operation < 1 second
- Memory usage < 500MB with complex projects

---

## 🔧 Technical Considerations

### **Architecture Updates:**
- Implement WebGL for layer compositing
- Use Web Workers for audio analysis
- Add IndexedDB for local project caching
- Implement virtual scrolling for layer lists
- Use React.memo for performance optimization

### **Database Optimizations:**
- Add indexes for follower queries
- Implement connection pooling
- Cache frequently accessed data
- Use database triggers for counts

### **Testing Requirements:**
- Unit tests for layer operations
- Integration tests for mode switching
- Performance tests for complex visualizations
- E2E tests for critical user flows
- Cross-browser compatibility tests

---

## 📝 Notes from Phase 1

### **What Worked Well:**
- Subframe UI components provide consistency
- Web Audio API implementation is solid
- Authentication flow is smooth
- Real-time features with Supabase

### **Lessons Learned:**
- Vercel requires explicit SPA configuration
- Audio file storage needs unique identifiers
- Complex UI needs proper z-index management
- Session persistence requires multiple strategies

### **Technical Debt to Address:**
- Remove unused imports and variables
- Optimize bundle size with code splitting
- Implement proper error boundaries
- Add comprehensive logging system

---

**Phase 2 Start Date:** Current
**Estimated Completion:** 6 weeks
**Next Review:** After Sprint 1 completion

---

## Appendix: Cthugha Reference

The `refs/cthugha-js-main` directory contains a TypeScript port of the classic Cthugha music visualizer. Key features to preserve:

1. **Keyboard-driven interface** - All effects controlled via keyboard
2. **Real-time audio reactivity** - Immediate response to audio input
3. **Classic visual effects** - Fire, plasma, waves, fractals
4. **Performance** - Smooth 60fps even with complex visuals
5. **Customization** - User can modify sensitivity and colors

Integration approach:
- Preserve core rendering engine
- Adapt UI to match Vüzik design language
- Add modern features (save/load, sharing)
- Maintain backwards compatibility with original presets