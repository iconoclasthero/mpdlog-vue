# Development and Testing Guide

## Quick Start

### 1. Install and Run Locally

```bash
# On your development machine (latitude @ 192.168.1.3)
cd /path/to/mpdlog-vue
npm install
npm run dev
```

The app will be available at `http://localhost:3000` and will try to connect to the WebSocket at `ws://192.168.1.2:8008/ws`.

### 2. Testing WebSocket Connection

You can test the WebSocket backend manually:

```bash
# Test json-status
websocat ws://192.168.1.2:8008/ws <<< "json-status" 2>/dev/null

# Test json-log
websocat ws://192.168.1.2:8008/ws <<< "json-log" 2>/dev/null
```

### 3. Development Workflow

1. **Edit components** in `src/components/`
2. **Hot reload** will update the browser automatically
3. **Check console** for WebSocket messages and errors
4. **Test on mobile** by accessing `http://192.168.1.3:3000` from your phone

## Component Structure

Each component is self-contained and follows Vue 3 Composition API patterns:

```
App.vue                    - Main app, WebSocket logic
├── CurrentlyPlaying.vue   - Song info, controls, progress bar
├── AlbumArt.vue          - Album artwork display
├── NextTrack.vue         - Next song preview
├── LogSection.vue        - Song history
├── NavButtons.vue        - Control buttons
└── IcecastIcon.vue       - SVG icon
```

## Adding New Features

### Example: Add a new control button

1. **Add button to NavButtons.vue:**
```vue
<button type="button" 
        @click="$emit('action', 'my_new_action')" 
        class="btn btn-primary">
  My Button
</button>
```

2. **Handle action in App.vue:**
```javascript
const commandMap = {
  // ... existing commands
  'my_new_action': 'my-backend-command'
}
```

3. **Ensure backend supports the command**

### Example: Add new data to status display

1. **Verify backend sends the data** in json-status response

2. **Update CurrentlyPlaying.vue** to display it:
```vue
<template>
  <span>{{ status.player.my_new_field }}</span>
</template>
```

## Testing Different States

### Test Play/Pause States

```bash
# On gigabyte
mpc play
# Check UI shows "playing" with pause button

mpc pause  
# Check UI shows "paused" with play button
```

### Test Progress Bar

The progress bar should:
- Update every second when playing
- Stop when paused
- Reset when track changes
- Show correct percentage

### Test Responsive Design

1. **Desktop:** Full width browser window
2. **Mobile:** 
   - Resize browser to < 768px width
   - Or use browser dev tools device emulation
   - Check that mobile-specific elements show

Expected differences:
- ⏯ icon replaces ▮▮/▶ pause icon
- ⏭ icon replaces ▶▮ skip icon
- Smaller emoji
- Condensed layout

## Common Issues

### WebSocket Won't Connect

**Symptom:** Console shows "WebSocket disconnected" constantly

**Check:**
```bash
# Is mpdgolinger running?
sudo systemctl status mpdgolinger

# Can you reach it?
websocat ws://192.168.1.2:8008/ws <<< "json-status"

# Firewall blocking?
sudo ss -tlnp | grep 8008
```

**Fix:**
- Start mpdgolinger: `sudo systemctl start mpdgolinger`
- Check firewall rules
- Verify correct IP/port in App.vue

### No Album Art

**Expected:** This is TODO - album art loading not implemented yet

**To implement:**
1. Add API endpoint in Go backend to serve album art
2. Or create nginx location to proxy `mpc readpicture` 
3. Update AlbumArt.vue's `loadAlbumArt()` function

### Timer Drifts

**Symptom:** Progress bar doesn't match actual song position

**Cause:** Client-side timer + network latency

**Fix:** Backend should send periodic elapsed time updates

### Linger Status Wrong

**Check backend response:**
```bash
websocat ws://192.168.1.2:8008/ws <<< "json-status" 2>/dev/null | jq .linger
```

Ensure it includes:
```json
{
  "count": 1,
  "limit": 4,
  "paused": false
}
```

## Building for Production

### Build Process

```bash
npm run build
```

This:
1. Compiles Vue components
2. Bundles JavaScript
3. Processes CSS
4. Optimizes for production
5. Outputs to `dist/`

### Verify Build

```bash
# Serve locally to test
npm run preview

# Or use a simple HTTP server
cd dist
python3 -m http.server 8080
```

Visit `http://localhost:8080` and verify everything works.

## Deployment Checklist

Before deploying:

- [ ] All components load without errors
- [ ] WebSocket connects successfully
- [ ] Play/pause works
- [ ] Progress bar updates correctly
- [ ] Volume controls work
- [ ] Log displays properly
- [ ] Mobile layout works
- [ ] Album art shows (or placeholder)
- [ ] All links work
- [ ] No console errors

## Debugging

### Enable Verbose Logging

In App.vue, add more console logs:

```javascript
ws.value.onmessage = (event) => {
  console.log('RAW WebSocket message:', event.data)
  try {
    const data = JSON.parse(event.data)
    console.log('PARSED:', data)
    handleWebSocketMessage(data)
  } catch (error) {
    console.error('Parse error:', error)
  }
}
```

### Check Network Tab

Browser DevTools → Network tab:
- Filter: WS (WebSocket)
- See all messages sent/received
- Check for errors

### Vue DevTools

Install Vue DevTools browser extension to:
- Inspect component state
- View props/data
- Track events

## Next Steps After Initial Deployment

1. **Implement remaining view modes:**
   - Raw log view
   - Playing details
   - Playlist views

2. **Add album art loading**

3. **Implement all MPD commands** currently in the bash script

4. **Add error handling UI** for disconnections

5. **Optimize WebSocket updates** (only send changes, not full state)

6. **Add tests** (Vitest for unit tests)

7. **Progressive Web App** features (offline support, install prompt)
