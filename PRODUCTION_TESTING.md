# Production Testing Guide

## Testing Production Issues Locally

### 1. Build and Preview Production Bundle

```bash
# Run the production test script
./scripts/test-production.sh

# OR manually:
pnpm build
pnpm preview --host
```

This serves the production build at `http://localhost:4173`

### 2. Test SPA Routing (Bug 1a)

**Test Steps:**
1. Navigate to `http://localhost:4173/explore`
2. Hit refresh (Cmd+R)
3. Should NOT see 404 error
4. Try direct navigation to:
   - `http://localhost:4173/saved`
   - `http://localhost:4173/profile`
   - `http://localhost:4173/settings`

**Expected:** All routes should load correctly on refresh

### 3. Test Cross-Tab Session Sync

**Test Steps:**
1. Open app in Tab 1, sign in
2. Open new tab (Tab 2), navigate to app
3. Should be signed in automatically
4. Sign out in Tab 1
5. Tab 2 should sign out within 1-2 seconds

**Edge Cases:**
- Close Tab 1, Tab 2 should maintain session
- Network disconnect/reconnect
- Browser sleep/wake

### 4. Simulate Vercel Environment

```bash
# Install Vercel CLI if not already installed
npm i -g vercel

# Run local Vercel environment
vercel dev
```

This runs at `http://localhost:3000` with Vercel's exact configuration

### 5. Network Throttling Tests

**Chrome DevTools:**
1. Open DevTools (F12)
2. Network tab → Throttling → Slow 3G
3. Test:
   - Page loads
   - Audio file uploads
   - Visualization saves

### 6. Debug Production-Only Issues

**Add Debug Logging:**
```typescript
// Only in production
if (import.meta.env.PROD) {
  console.log('[PROD DEBUG]', data);
}
```

**Use Query Parameters for Debug Mode:**
```typescript
// Check for ?debug=true in URL
const urlParams = new URLSearchParams(window.location.search);
const debugMode = urlParams.get('debug') === 'true';

if (debugMode) {
  // Enhanced logging
}
```

### 7. Test with Production Database

**Local with Production Database:**
```bash
# Create .env.production.local
VITE_SUPABASE_URL=your-production-url
VITE_SUPABASE_ANON_KEY=your-production-key

# Run with production env
pnpm build
pnpm preview
```

**⚠️ CAUTION:** Be very careful with production database!

### 8. Browser-Specific Testing

**Test in Multiple Browsers:**
- Chrome (latest)
- Firefox (latest)
- Safari (macOS)
- Edge (Windows)
- Mobile Safari (iOS)
- Chrome Mobile (Android)

**Private/Incognito Mode:**
- Tests without cached data
- Tests without extensions
- Clean session state

### 9. Performance Profiling

**Lighthouse Audit:**
```bash
# Build production
pnpm build

# Run lighthouse
npx lighthouse http://localhost:4173 --view
```

**Bundle Analysis:**
```bash
# Analyze bundle size
pnpm build
npx vite-bundle-visualizer
```

### 10. Error Monitoring Setup

**Local Sentry Testing:**
```javascript
// Test error boundary
throw new Error('Test production error handling');

// Test async errors
Promise.reject('Test unhandled rejection');
```

## Common Production vs Development Differences

| Issue | Development | Production | Solution |
|-------|-------------|------------|----------|
| Routing | Works on refresh | 404 on refresh | vercel.json rewrites |
| API URLs | Proxy works | CORS issues | Proper env vars |
| Build size | Not optimized | Minified | Code splitting |
| Source maps | Available | Hidden | Enable for debugging |
| Console logs | Visible | Should be removed | Conditional logging |
| Hot reload | Available | Not available | N/A |
| Error boundaries | Show stack | Show fallback | Proper error UI |

## Debugging Checklist

- [ ] Check browser console for errors
- [ ] Check network tab for failed requests
- [ ] Verify environment variables are set
- [ ] Check Vercel function logs
- [ ] Verify Supabase connection
- [ ] Test with clean browser profile
- [ ] Check for service worker issues
- [ ] Verify CSP headers aren't blocking resources

## Deployment Verification

After deploying to Vercel:

1. **Immediate Tests:**
   - [ ] Homepage loads
   - [ ] Can sign in/up
   - [ ] Visualizations render
   - [ ] Audio uploads work

2. **Routing Tests:**
   - [ ] Refresh on /explore works
   - [ ] Direct navigation to all routes
   - [ ] Browser back/forward buttons

3. **Data Tests:**
   - [ ] Save visualization
   - [ ] Load saved visualization
   - [ ] Update profile
   - [ ] Upload images

4. **Performance:**
   - [ ] Page load < 3 seconds
   - [ ] Visualization runs at 60fps
   - [ ] No memory leaks after 5 minutes

## Monitoring Production

**Vercel Dashboard:**
- Check function logs
- Monitor error rate
- Watch performance metrics

**Supabase Dashboard:**
- Database performance
- Auth logs
- Storage usage

**Browser Testing Services:**
- BrowserStack
- Sauce Labs
- LambdaTest

## Emergency Rollback

```bash
# If critical issue found:
vercel rollback

# Or specify deployment:
vercel rollback [deployment-url]
```