# Music Guesser 🎵

A multiplayer music guessing ### How It Works

- **Host-Only Playback**: Only the game host hears the music (via Spotify Web Playback SDK)
- **Full Track Access**: Plays 30-second segments from anywhere in the song
- **Premium Required**: Host needs Spotify Premium for full track playback
- **No Preview Clips**: App exclusively uses full Spotify tracks - no more preview limitations!uilt with SvelteKit 5 and WebSockets.

## Features

- **Multiplayer Support**: One player hosts, others join with a game ID
- **Real-time Gameplay**: WebSocket-based real-time communication
- **10 Rounds**: Each game consists of 10 music guessing rounds
- **Scoring System**: Points awarded based on correctness and speed
- **Two Question Types**: Guess the artist or song name
- **Beautiful UI**: Modern glass-morphism design with animations

## How to Play

1. **Host a Game**: Click "Create Game" and share the Game ID with friends
2. **Join a Game**: Enter a Game ID to join an existing game
3. **Listen & Guess**: When the game starts, listen to music clips and choose from 4 options
4. **Score Points**: Faster correct answers earn more points
5. **See Results**: After 10 rounds, view the final leaderboard

## Technology Stack

- **Frontend**: SvelteKit 5 with TypeScript
- **Backend**: Node.js WebSocket server
- **Real-time Communication**: WebSockets (ws library)
- **Styling**: Modern CSS with glass-morphism effects

## Setup Instructions

1. **Install Dependencies**:

   ```bash
   npm install
   ```

2. **Run the Development Server**:

   ```bash
   npm run dev
   ```

3. **Open the App**:
   Navigate to `http://localhost:5173` in your browser

## Spotify Integration 🎵

The app now supports **full Spotify music playback** for hosts with Spotify Premium! This provides a much better experience than preview clips.

### How It Works

- **Host-Only Playback**: Only the game host hears the music (via Spotify Web Playback SDK)
- **Full Track Access**: Plays 30-second segments from anywhere in the song
- **Premium Required**: Host needs Spotify Premium for full track playback
- **Smart Fallback**: Falls back to preview clips or mock data if needed

### 1. Get Spotify API Credentials

1. Go to [Spotify for Developers](https://developer.spotify.com/dashboard/applications)
2. Log in with your Spotify account
3. Click "Create App"
4. Fill in the app details:
   - **App Name**: Music Guesser
   - **App Description**: Multiplayer music guessing game
   - **Redirect URI**: `http://localhost:5173/auth/spotify/callback`
5. Copy your **Client ID** and **Client Secret**

### 2. Configure Environment Variables

1. Open the `.env` file in your project root
2. Replace the placeholder values with your actual Spotify credentials:

   ```bash
   SPOTIFY_CLIENT_ID=your_actual_client_id_here
   SPOTIFY_CLIENT_SECRET=your_actual_client_secret_here
   ```

### 3. Run the App & Authenticate

```bash
npm run dev
```

**For Hosts (Optional Enhanced Experience):**

1. Click "Connect Spotify" on the welcome screen
2. Log in with your Spotify Premium account
3. Create a game as host
4. Enjoy full track playback during rounds!

**For Players:**

- Just join games normally - no Spotify needed
- Only hosts hear the music and control playback

**That's it!** The game will now:

- ✅ Play full Spotify tracks for hosts with Premium (required)
- ✅ Use 30-second segments from random parts of songs
- ✅ Provide high-quality audio experience with full songs
- ✅ Dynamic music categories from Spotify's Browse API
- ✅ Use mock data if Spotify fails
- ✅ Work perfectly for all players regardless of Spotify status

### Features with Spotify Web Playback SDK

- **Full Track Access**: Hosts play complete songs, not just 30-second previews
- **Random Segments**: Plays from random parts of tracks (not always the beginning)
- **Host-Only Audio**: Only the game host hears music - others rely on host's guidance
- **Premium Experience**: Requires Spotify Premium for host, free for all players
- **Smart Fallback**: Automatically falls back to preview clips or mock data
- **Easy Authentication**: One-click Spotify login via OAuth
- **Seamless Integration**: Works within the existing game flow

## Game Rules

- **Round Duration**: 30 seconds per round
- **Scoring**: 100 base points + speed bonus (up to 60 extra points)
- **Question Types**: 50/50 split between artist and song name questions
- **Minimum Players**: 1 player (host can play alone for testing)

## Project Structure

```
src/
├── lib/
│   ├── components/          # Svelte components
│   │   ├── WelcomeScreen.svelte
│   │   ├── Lobby.svelte
│   │   ├── GamePlay.svelte
│   │   ├── GameResults.svelte
│   │   └── ConnectionStatus.svelte
│   ├── server/
│   │   └── websocket.ts     # WebSocket server logic
│   └── game-client.ts       # Client-side game state management
├── routes/
│   └── +page.svelte         # Main app page
└── hooks.server.ts          # Server hooks for WebSocket initialization
```

## Development Notes

- Uses Svelte 5's new runes (`$state`, `$derived`, `$effect`) for reactivity
- WebSocket server runs on port 8080
- Responsive design works on mobile and desktop
- Game state is managed client-side with server synchronization

## Future Enhancements

- [x] **Spotify API integration for real music** ✅ Complete!
- [ ] User accounts and persistent statistics
- [ ] Custom playlists for themed games
- [ ] Album art display during questions
- [ ] Tournament mode with brackets
- [ ] Voice chat integration
- [ ] Mobile app version
- [ ] Social sharing of results
- [ ] Difficulty levels (mainstream vs. deep cuts)
- [ ] Genre-specific games

## Contributing

Feel free to contribute by:

- Adding Spotify integration
- Improving the UI/UX
- Adding new game modes
- Fixing bugs or performance issues

Enjoy the game! 🎵🎮
