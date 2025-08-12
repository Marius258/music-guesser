import { SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET } from "$env/static/private";
import genres from "../../../static/spotify-genres.json";

export interface SpotifyTrack {
  id: string;
  name: string;
  artists: { name: string }[];
  uri: string; // Spotify URI for Web Playback SDK
  album: {
    name: string;
    images: { url: string; height: number; width: number }[];
  };
  popularity: number;
  duration_ms: number; // Track duration for gameplay segments
}

export interface SpotifyCategory {
  id: string;
  name: string;
  icons?: { url: string; height: number; width: number }[];
  description?: string;
}

export interface SpotifySearchResponse {
  tracks: {
    items: SpotifyTrack[];
  };
}

class SpotifyService {
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;
  private cachedCategories: SpotifyCategory[] = [];
  private categoryCacheExpiry: number = 0;

  async getMusicCategories(): Promise<SpotifyCategory[]> {
    // Return cached categories if still valid (cache for 1 hour)
    if (this.cachedCategories.length > 0 && Date.now() < this.categoryCacheExpiry) {
      return this.cachedCategories;
    }

    try {
      // Use local genres from spotify-genres.json
      const mainGenres = genres.genres.map((genre) => ({
        id: genre.toLowerCase().replace(/[^a-z0-9]/g, "-"),
        name: genre,
        description: `Songs from the ${genre} genre`,
      }));

      this.cachedCategories = mainGenres;
      this.categoryCacheExpiry = Date.now() + 3600000; // Cache for 1 hour

      console.log(`Loaded ${mainGenres.length} music genres from local file`);
      return mainGenres;
    } catch (error) {
      console.error("Error loading music genres:", error);
      throw new Error("Failed to load music genres. Please check the configuration and try again.");
    }
  }

  // Generate authorization URL for user login
  generateAuthUrl(redirectUri: string, state: string): string {
    const scope = "streaming user-read-email user-read-private";
    const params = new URLSearchParams({
      response_type: "code",
      client_id: SPOTIFY_CLIENT_ID,
      scope: scope,
      redirect_uri: redirectUri,
      state: state,
    });

    return `https://accounts.spotify.com/authorize?${params.toString()}`;
  }

  // Exchange authorization code for user access token
  async exchangeCodeForToken(
    code: string,
    redirectUri: string
  ): Promise<{
    access_token: string;
    refresh_token: string;
    expires_in: number;
  }> {
    const response = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString("base64")}`,
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code: code,
        redirect_uri: redirectUri,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to exchange code for token: ${response.status}`);
    }

    return await response.json();
  }

  async getAccessToken(): Promise<string> {
    // Check if credentials are configured
    if (
      !SPOTIFY_CLIENT_ID ||
      !SPOTIFY_CLIENT_SECRET ||
      SPOTIFY_CLIENT_ID === "your_spotify_client_id_here" ||
      SPOTIFY_CLIENT_SECRET === "your_spotify_client_secret_here"
    ) {
      throw new Error("Spotify credentials not configured. Please set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET in your .env file.");
    }

    // Check if token is still valid (with 5 minute buffer)
    if (this.accessToken && Date.now() < this.tokenExpiry - 300000) {
      return this.accessToken;
    }

    const response = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString("base64")}`,
      },
      body: "grant_type=client_credentials",
    });

    if (!response.ok) {
      throw new Error(`Failed to get Spotify access token: ${response.status}`);
    }

    const data = await response.json();
    this.accessToken = data.access_token;
    this.tokenExpiry = Date.now() + data.expires_in * 1000;

    if (!this.accessToken) {
      throw new Error("Failed to obtain access token from Spotify");
    }

    return this.accessToken;
  }

  async getTracksByCategory(categoryName: string, count: number = 50): Promise<SpotifyTrack[]> {
    try {
      console.log(`Fetching tracks for category: ${categoryName}`);

      // Use search with genre filter for better accuracy
      const tracks = await this.getTracksFromGenreSearch(categoryName, count);

      if (tracks.length >= 4) {
        console.log(`Successfully got ${tracks.length} tracks for category "${categoryName}"`);
        return tracks;
      }

      throw new Error(`Insufficient tracks found for category "${categoryName}". Found: ${tracks.length}, need at least 4`);
    } catch (error) {
      console.error(`Error fetching tracks for category ${categoryName}:`, error);
      throw new Error(`Failed to fetch tracks for category "${categoryName}"`);
    }
  }

  private async getTracksFromGenreSearch(categoryName: string, count: number): Promise<SpotifyTrack[]> {
    try {
      console.log(`Searching for tracks in Spotify category: "${categoryName}"`);

      // Use search with genre filter instead of deprecated category playlists
      const tracks = await this.searchTracksByGenre(categoryName, count);

      if (tracks.length === 0) {
        console.log(`No tracks found for category "${categoryName}"`);
        return [];
      }

      console.log(`Category "${categoryName}" yielded ${tracks.length} tracks from search`);
      return tracks.sort(() => Math.random() - 0.5).slice(0, count);
    } catch (error) {
      console.log(`Search approach failed for "${categoryName}":`, error);
      return [];
    }
  }

  private async searchTracksByGenre(categoryName: string, count: number): Promise<SpotifyTrack[]> {
    try {
      const token = await this.getAccessToken();

      // Create genre-specific search queries
      const searchQuery = `genre:"${categoryName}"`;
      const allTracks: SpotifyTrack[] = [];

      console.log(`Searching with query: "${searchQuery}"`);

      // Add random offset to get different results each time (max 300 as per Spotify API limits)
      const randomOffset = Math.floor(Math.random() * Math.min(200, 300));
      //&offset=${randomOffset}
      console.log(`Using random offset: ${randomOffset}`);
      const response = await fetch(`https://api.spotify.com/v1/search?q=${searchQuery}&type=track&market=US`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        console.log(`Search failed for query "${searchQuery}": ${response.status}`);
      }

      const data = await response.json();
      const tracks = data.tracks?.items || [];

      // Filter and map tracks
      const validTracks = tracks
        .filter((track: any) => track.popularity > 30)
        .map((track: any) => ({
          id: track.id,
          name: track.name,
          artists: track.artists || [{ name: "Unknown Artist" }],
          uri: track.uri,
          album: {
            name: track.album?.name || "Unknown Album",
            images: track.album?.images || [],
          },
          popularity: track.popularity || 0,
          duration_ms: track.duration_ms || 30000,
        }));

      allTracks.push(...validTracks);
      console.log(`Found ${validTracks.length} valid tracks from search: "${searchQuery}"`);

      // Remove duplicates
      const uniqueTracks = allTracks.filter((track, index, self) => index === self.findIndex((t) => t.id === track.id));

      return uniqueTracks;
    } catch (error) {
      console.error(`Error searching tracks by genre:`, error);
      return [];
    }
  }

  async getRandomTrackForRound(categoryName: string = "mixed"): Promise<{
    correct: SpotifyTrack;
    wrongOptions: SpotifyTrack[];
  }> {
    try {
      console.log(`Fetching tracks directly from Spotify for category "${categoryName}"`);

      // Fetch tracks directly from Spotify
      const tracks = await this.getTracksByCategory(categoryName, 50);

      if (tracks.length < 4) {
        throw new Error(`Not enough tracks found for category "${categoryName}". Only found ${tracks.length} tracks, need at least 4.`);
      }

      // Shuffle all tracks to ensure randomness
      const shuffledTracks = [...tracks].sort(() => Math.random() - 0.5);

      // Select tracks with good popularity but still allow variety
      const goodTracks = shuffledTracks.filter((track) => track.popularity > 30);
      const availableTracks = goodTracks.length >= 10 ? goodTracks : shuffledTracks;

      // Select the correct track randomly
      const correct = availableTracks[Math.floor(Math.random() * Math.min(availableTracks.length, 50))];
      console.log(
        `Selected correct track: "${correct.name}" by ${correct.artists[0]?.name} (popularity: ${correct.popularity}, category: ${categoryName})`
      );
      console.log(`Spotify URI: ${correct.uri}`);

      // Create a pool of remaining tracks for wrong options (excluding the correct one)
      const remainingTracks = shuffledTracks.filter((track) => track.id !== correct.id);

      // Select 3 wrong options ensuring diversity
      const wrongOptions: SpotifyTrack[] = [];
      const usedArtists = new Set([correct.artists[0]?.name.toLowerCase()]);
      const usedSongs = new Set([correct.name.toLowerCase()]);

      // Try to get diverse options (different artists and songs)
      for (const track of remainingTracks) {
        if (wrongOptions.length >= 3) break;

        const artistName = track.artists[0]?.name.toLowerCase();
        const songName = track.name.toLowerCase();

        // Ensure we don't use the same artist or song name
        if (!usedArtists.has(artistName) && !usedSongs.has(songName)) {
          wrongOptions.push(track);
          usedArtists.add(artistName);
          usedSongs.add(songName);
        }
      }

      // If we still need more options, relax the constraints
      if (wrongOptions.length < 3) {
        console.log(`Only found ${wrongOptions.length} diverse wrong options, filling remaining slots...`);
        for (const track of remainingTracks) {
          if (wrongOptions.length >= 3) break;

          // Skip tracks already selected
          if (wrongOptions.some((wo) => wo.id === track.id)) continue;

          wrongOptions.push(track);
        }
      }

      if (wrongOptions.length < 3) {
        throw new Error(`Not enough tracks to create wrong options for category "${categoryName}". Need 4 total, found ${wrongOptions.length + 1}.`);
      }

      console.log(
        `Selected wrong options: ${wrongOptions.map((t) => `"${t.name}" by ${t.artists[0]?.name} (popularity: ${t.popularity})`).join(", ")}`
      );

      return {
        correct,
        wrongOptions: wrongOptions.slice(0, 3),
      };
    } catch (error) {
      console.error(`Error fetching Spotify tracks for category "${categoryName}":`, error);
      throw new Error(`Failed to fetch tracks for round from Spotify: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  // Helper method to get clean artist names (first artist only)
  getMainArtist(track: SpotifyTrack): string {
    return track.artists[0]?.name || "Unknown Artist";
  }

  // Helper method to clean up song names (remove features, remixes, etc.)
  getCleanSongName(track: SpotifyTrack): string {
    let name = track.name;

    // Remove common suffixes that might make questions too easy
    name = name.replace(/\s*\(.*?\)\s*/g, ""); // Remove content in parentheses
    name = name.replace(/\s*\[.*?\]\s*/g, ""); // Remove content in brackets
    name = name.replace(/\s*-\s*(feat|ft|featuring)\.?.*$/i, ""); // Remove features
    name = name.replace(/\s*-\s*(remix|remaster|remastered).*$/i, ""); // Remove remix/remaster info

    return name.trim();
  }
}

export const spotifyService = new SpotifyService();
