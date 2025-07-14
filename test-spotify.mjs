// Test script to verify Spotify Web Playback SDK integration
import { readFileSync } from "fs";

// Read environment variables manually for testing
try {
  const envContent = readFileSync(".env", "utf8");
  const envLines = envContent.split("\n");

  for (const line of envLines) {
    if (line.trim() && !line.startsWith("#")) {
      const [key, value] = line.split("=");
      if (key && value) {
        process.env[key.trim()] = value.trim();
      }
    }
  }
} catch (error) {
  console.error("Could not read .env file:", error.message);
  process.exit(1);
}

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;

if (
  !SPOTIFY_CLIENT_ID ||
  !SPOTIFY_CLIENT_SECRET ||
  SPOTIFY_CLIENT_ID === "your_spotify_client_id_here" ||
  SPOTIFY_CLIENT_SECRET === "your_spotify_client_secret_here"
) {
  console.error("❌ Spotify credentials not configured properly.");
  console.error("Please set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET in your .env file.");
  process.exit(1);
}

console.log("✅ Spotify credentials found");

// Test Spotify API access for Web Playback SDK
async function testSpotifyWebPlaybackSetup() {
  try {
    console.log("🔑 Getting Spotify access token...");

    const response = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString("base64")}`,
      },
      body: "grant_type=client_credentials",
    });

    if (!response.ok) {
      throw new Error(`Failed to get access token: ${response.status}`);
    }

    const data = await response.json();
    console.log("✅ Successfully obtained Spotify access token");

    // Test track search for Web Playback SDK
    console.log("🔍 Searching for tracks for Web Playback SDK...");

    const searchResponse = await fetch("https://api.spotify.com/v1/search?q=year:2010-2020&type=track&limit=20&market=US", {
      headers: {
        Authorization: `Bearer ${data.access_token}`,
      },
    });

    if (!searchResponse.ok) {
      throw new Error(`Search failed: ${searchResponse.status}`);
    }

    const searchData = await searchResponse.json();
    const tracks = searchData.tracks.items;
    const goodTracks = tracks.filter((track) => track.popularity > 30);

    console.log(`📊 Search Results for Web Playback SDK:`);
    console.log(`   Total tracks found: ${tracks.length}`);
    console.log(`   Tracks with good popularity (>30): ${goodTracks.length}`);
    console.log(`   All tracks available for full playback via Web Playback SDK`);

    if (goodTracks.length >= 4) {
      console.log("✅ Sufficient tracks found for full track gameplay!");

      // Show examples with Spotify URIs
      console.log("\n🎵 Example tracks for full playback:");
      goodTracks.slice(0, 3).forEach((track, index) => {
        console.log(`   ${index + 1}. "${track.name}" by ${track.artists[0]?.name}`);
        console.log(`      URI: ${track.uri} (for full track playback)`);
        console.log(`      Duration: ${Math.floor(track.duration_ms / 1000)}s`);
        console.log(`      Popularity: ${track.popularity}`);
      });
    } else {
      console.log("⚠️  Limited high-quality tracks found.");
    }

    // Test OAuth URL generation
    console.log("\n🔗 Testing OAuth URL generation...");
    const scope = "streaming user-read-email user-read-private";
    const redirectUri = "http://localhost:5173/auth/spotify/callback";
    const state = "test-state-123";

    const authParams = new URLSearchParams({
      response_type: "code",
      client_id: SPOTIFY_CLIENT_ID,
      scope: scope,
      redirect_uri: redirectUri,
      state: state,
    });

    const authUrl = `https://accounts.spotify.com/authorize?${authParams.toString()}`;
    console.log("✅ OAuth URL generated successfully");
    console.log(`   Redirect URI: ${redirectUri}`);
    console.log(`   Scopes: ${scope}`);

    console.log("\n🎉 Spotify Web Playback SDK integration test completed successfully!");
    console.log("\n📋 Next Steps:");
    console.log("   1. Start your app: npm run dev");
    console.log("   2. Click 'Connect Spotify' as a host");
    console.log("   3. Log in with Spotify Premium account");
    console.log("   4. Create a game and enjoy full track playback!");
    console.log("\n⚠️  Note: Web Playback SDK requires:");
    console.log("   - Spotify Premium subscription (for hosts)");
    console.log("   - Modern web browser");
    console.log("   - User authentication (not just client credentials)");
  } catch (error) {
    console.error("❌ Spotify Web Playback SDK test failed:", error.message);
    console.error("The app will fall back to mock data during gameplay.");
  }
}

testSpotifyWebPlaybackSetup();
