# Spotify Integration Setup Guide

## Quick Start

1. **Get Spotify Credentials**:

   - Visit: https://developer.spotify.com/dashboard/applications
   - Create a new app
   - Copy your Client ID and Client Secret

2. **Update Environment Variables**:

   ```bash
   # Edit the .env file in your project root
   SPOTIFY_CLIENT_ID=your_actual_client_id_here
   SPOTIFY_CLIENT_SECRET=your_actual_client_secret_here
   ```

3. **Start the App**:
   ```bash
   npm run dev
   ```

## Testing the Integration

### With Valid Spotify Credentials:

- ✅ Real songs from Spotify (2015-2024)
- ✅ 30-second preview clips
- ✅ Automatic audio playback
- ✅ "🎵 30-second Spotify preview playing" message

### With Invalid/Missing Credentials:

- ✅ Fallback to mock data
- ✅ "🎧 Mock audio - Add Spotify credentials for real music" message
- ✅ Game still works perfectly

## Browser Autoplay Policy

Modern browsers block autoplay. If autoplay is blocked:

- ⚠️ Warning message appears: "Click Play button to hear the song!"
- 🟡 Play button will pulse to draw attention
- 🎵 Click the play button to start audio manually

## Troubleshooting

1. **No audio plays**: Check browser autoplay settings
2. **Mock data still used**: Verify .env file has correct Spotify credentials
3. **WebSocket errors**: Ensure port 8080 is available

The integration is complete and ready to use! 🎵
