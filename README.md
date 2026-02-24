# MPDLog Vue Application

A Vue 3 application that replaces the bash CGI-bin script for MPD (Music Player Daemon) monitoring and control, connecting to the Go WebSocket backend (mpdgolinger).

## Features

- Real-time MPD status updates via WebSocket
- Currently playing track information with live progress bar
- Album art display
- MPD controls (play/pause, next, random, etc.)
- Volume controls
- Linger functionality support
- Song history log
- Responsive design (desktop & mobile)

## Prerequisites

- Node.js 18+ and npm
- nginx (for serving the built app)
- mpdgolinger Go backend running on ws://192.168.1.2:8008/ws

## Development Setup

1. Install dependencies:
```bash
npm install
```

2. Start development server:
```bash
npm run dev
```

The app will be available at http://localhost:3000

## Production Build

1. Build the application:
```bash
npm run build
```

This creates a `dist/` directory with the production-ready files.

2. Deploy the `dist/` directory to your web server.

## nginx Configuration

### Option 1: Simple static hosting

```nginx
server {
    listen 80;
    server_name 192.168.1.2;

    root /path/to/mpdlog-vue/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy WebSocket connections to mpdgolinger
    location /ws {
        proxy_pass http://127.0.0.1:8008/ws;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # Optional: Album art API endpoint (if you implement server-side album art serving)
    location /api/album-art {
        # Your album art serving logic here
        proxy_pass http://127.0.0.1:8009;
    }

    # Serve music files for audio playback
    location /music/ {
        alias /library/music/;
        autoindex off;
    }
}
```

### Option 2: Alongside existing CGI setup

If you want to run both the old CGI and new Vue app during transition:

```nginx
server {
    listen 80;
    server_name 192.168.1.2;

    # New Vue app at /vue
    location /vue {
        alias /path/to/mpdlog-vue/dist;
        try_files $uri $uri/ /vue/index.html;
    }

    # Old CGI at root (existing setup)
    location / {
        # Your existing fcgiwrap configuration
    }

    # WebSocket proxy
    location /ws {
        proxy_pass http://127.0.0.1:8008/ws;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

## WebSocket Backend Commands

The app expects the mpdgolinger backend to support these commands:

- `json-status` - Returns current MPD status (sent automatically on connect)
- `json-log` - Returns song history log (sent automatically on connect)

The backend should send updates when:
- Track changes
- Player state changes (play/pause)
- Progress updates

### Expected JSON Format

**json-status response:**
```json
{
  "player": {
    "state": "play" | "pause",
    "volume": 100,
    "elapsed": 592.198,
    "duration": 703.273,
    "percent": 84.2,
    "random": false,
    "consume": true,
    "song_position": 692,
    "song_length": 3404
  },
  "current": {
    "title": "Bird Song",
    "artist": "Grateful Dead",
    "album": "...",
    "year": "2025-05-30",
    "duration": "703.273",
    "time": "703",
    "disc": "14",
    "track": "1",
    "file": "path/to/file.flac",
    "musicbrainz_albumid": "...",
    "musicbrainz_releasetrackid": "...",
    "musicbrainz_artistid": "..."
  },
  "next": { /* same structure as current */ },
  "linger": {
    "count": 1,
    "limit": 4,
    "paused": false
  }
}
```

**json-log response:**
```json
[
  {
    "timestamps": {
      "epoch": 1770817521,
      "log": "2026-02-11T13:45:21",
      "display": "Feb 11 1:45 pm"
    },
    "action": "played",
    "notes": "Found via relative path lookup.",
    "file": "path/to/file.flac",
    "url": "url-encoded-path",
    "audio": {
      "title": "Casey Jones",
      "artist": "Grateful Dead",
      /* ... same fields as current */
    }
  }
]
```

## TODO / Future Enhancements

1. **Album Art**: Implement proper album art loading (currently placeholder)
   - Option A: Add API endpoint in Go backend
   - Option B: Serve directly from nginx with mpc readpicture

2. **WebSocket Commands**: Map remaining actions to WebSocket commands
   - Volume controls integration with pulsevol
   - Playlist management commands
   - Output toggle implementation

3. **View Modes**: Implement remaining view modes
   - Raw log view
   - Playing details view
   - Playlist album view
   - Playlist current view

4. **Linger XY**: Implement lingerXY status display when available in backend

5. **Error Handling**: Add user-friendly error messages for WebSocket disconnections

6. **Styling**: Ensure pixel-perfect match with original bash CGI output

## File Structure

```
mpdlog-vue/
├── index.html              # Main HTML template
├── package.json            # Dependencies
├── vite.config.js          # Vite configuration
├── src/
│   ├── main.js             # Vue app entry point
│   ├── App.vue             # Main app component
│   └── components/
│       ├── CurrentlyPlaying.vue  # Current track display & controls
│       ├── AlbumArt.vue          # Album artwork display
│       ├── NextTrack.vue         # Next track preview
│       ├── LogSection.vue        # Song history log
│       ├── NavButtons.vue        # Navigation/control buttons
│       └── IcecastIcon.vue       # Icecast SVG icon
└── dist/                   # Production build (generated)
```

## Development Notes

- The app uses Vue 3 Composition API for modern, maintainable code
- WebSocket connection auto-reconnects on disconnect
- Client-side timer keeps elapsed time in sync between updates
- All styling matches the original bash CGI for visual consistency
- Responsive design handles desktop and mobile layouts

## Transitioning from CGI

To switch from the bash CGI to this Vue app:

1. Build the production version
2. Update nginx to serve the Vue app instead of the CGI
3. Retire the gunicorn SSE server (no longer needed)
4. Keep mpdgolinger running for WebSocket backend

## Troubleshooting

**WebSocket won't connect:**
- Check that mpdgolinger is running on 192.168.1.2:8008
- Verify nginx WebSocket proxy configuration
- Check browser console for errors

**Album art not loading:**
- Implement the `/api/album-art` endpoint or direct file serving
- Check file permissions on `/library/music/`

**Audio files won't play:**
- Verify nginx `location /music/` alias is correct
- Check that music directory is readable by nginx user
