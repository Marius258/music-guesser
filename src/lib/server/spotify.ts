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
  preview_url?: string; // Optional preview URL for better track selection
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
  private usedTrackIds: Set<string> = new Set(); // Track used songs to avoid repetition
  private lastCacheReset: number = Date.now();

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
      const allTracks: SpotifyTrack[] = [];

      // Create multiple varied search queries for better variety
      const searchQueries = this.generateVariedSearchQueries(categoryName);

      console.log(`Searching with ${searchQueries.length} varied queries for genre: "${categoryName}"`);

      // First, do a test query to determine how many results are available
      const testQuery = searchQueries[0];
      const testResponse = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(testQuery)}&type=track&market=US&limit=1&offset=0`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      let maxAvailableResults = 1000; // Default assumption
      if (testResponse.ok) {
        const testData = await testResponse.json();
        maxAvailableResults = testData.tracks?.total || 1000;
        console.log(`Total available results for "${categoryName}": ${maxAvailableResults}`);
      }

      // Use multiple search queries with adaptive offsets
      for (let i = 0; i < Math.min(searchQueries.length, 3); i++) {
        const query = searchQueries[i];

        // Calculate safe offset based on available results
        const maxSafeOffset = Math.max(0, Math.min(maxAvailableResults - 50, 950)); // Leave room for 50 results
        const timeBasedSeed = Math.floor(Date.now() / (1000 * 60 * 5)); // Changes every 5 minutes
        const randomSeed = Math.floor(Math.random() * 1000);
        const adaptiveOffset = Math.max(0, (timeBasedSeed + randomSeed + i * 50) % Math.max(1, maxSafeOffset));

        console.log(`Query ${i + 1}: "${query}" with adaptive offset: ${adaptiveOffset} (max safe: ${maxSafeOffset})`);

        try {
          const response = await fetch(
            `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&market=US&limit=50&offset=${adaptiveOffset}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          if (!response.ok) {
            console.log(`Search failed for query "${query}": ${response.status}`);
            continue;
          }

          const data = await response.json();
          const tracks = data.tracks?.items || [];

          // Use more flexible popularity filtering for variety
          const minPopularity = this.getVariedPopularityThreshold();
          console.log(`Using minimum popularity threshold: ${minPopularity}`);

          const validTracks = tracks
            .filter(
              (track: any) =>
                track.popularity >= minPopularity &&
                track.duration_ms > 20000 && // At least 20 seconds
                track.duration_ms < 600000 // Less than 10 minutes
            )
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
              preview_url: track.preview_url,
            }));

          allTracks.push(...validTracks);
          console.log(`Found ${validTracks.length} valid tracks from query: "${query}"`);

          // Add small delay between requests to be respectful to API
          if (i < searchQueries.length - 1) {
            await new Promise((resolve) => setTimeout(resolve, 100));
          }
        } catch (queryError) {
          console.log(`Error with query "${query}":`, queryError);
          continue;
        }
      }

      // If we didn't get any tracks from the initial searches, try with more relaxed criteria
      if (allTracks.length === 0) {
        console.log(`No tracks found with strict criteria, trying relaxed search for "${categoryName}"`);
        const relaxedTracks = await this.getRelaxedSearch(categoryName, token);
        allTracks.push(...relaxedTracks);
      }

      // Remove duplicates and shuffle for maximum variety
      const uniqueTracks = allTracks.filter((track, index, self) => index === self.findIndex((t) => t.id === track.id));

      // If we don't have enough tracks, try fallback strategies
      if (uniqueTracks.length < 10) {
        console.log(`Only found ${uniqueTracks.length} tracks, trying fallback strategies...`);
        const fallbackTracks = await this.getFallbackTracks(categoryName, token);
        uniqueTracks.push(...fallbackTracks.filter((track) => !uniqueTracks.some((existing) => existing.id === track.id)));
      }

      // Sort by a combination of popularity and randomness for balanced variety
      const shuffledTracks = uniqueTracks.sort(() => Math.random() - 0.5);

      console.log(`Total unique tracks found: ${uniqueTracks.length}`);
      return shuffledTracks;
    } catch (error) {
      console.error(`Error searching tracks by genre:`, error);
      return [];
    }
  }

  // Fallback strategies for genres with fewer results
  private async getFallbackTracks(categoryName: string, token: string): Promise<SpotifyTrack[]> {
    const fallbackTracks: SpotifyTrack[] = [];

    try {
      // Strategy 1: Try broader search without strict genre filter
      const broadQuery = categoryName.toLowerCase();
      console.log(`Trying broad search for: "${broadQuery}"`);

      const broadResponse = await fetch(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(broadQuery)}&type=track&market=US&limit=50&offset=0`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (broadResponse.ok) {
        const broadData = await broadResponse.json();
        const broadTracks = broadData.tracks?.items || [];

        const validBroadTracks = broadTracks
          .filter(
            (track: any) =>
              track.popularity >= 15 && // Lower threshold for fallback
              track.duration_ms > 20000 &&
              track.duration_ms < 600000
          )
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
            preview_url: track.preview_url,
          }));

        fallbackTracks.push(...validBroadTracks);
        console.log(`Broad search found ${validBroadTracks.length} additional tracks`);
      }

      // Strategy 2: Try related genre searches if still not enough
      if (fallbackTracks.length < 20) {
        const relatedGenres = this.getRelatedGenres(categoryName);

        for (const relatedGenre of relatedGenres.slice(0, 2)) {
          console.log(`Trying related genre: "${relatedGenre}"`);

          const relatedResponse = await fetch(`https://api.spotify.com/v1/search?q=genre:"${relatedGenre}"&type=track&market=US&limit=30&offset=0`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (relatedResponse.ok) {
            const relatedData = await relatedResponse.json();
            const relatedTracks = relatedData.tracks?.items || [];

            const validRelatedTracks = relatedTracks
              .filter((track: any) => track.popularity >= 20 && track.duration_ms > 20000 && track.duration_ms < 600000)
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
                preview_url: track.preview_url,
              }));

            fallbackTracks.push(...validRelatedTracks);
            console.log(`Related genre "${relatedGenre}" found ${validRelatedTracks.length} additional tracks`);
          }

          // Small delay between requests
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      }
    } catch (error) {
      console.log(`Fallback search failed:`, error);
    }

    return fallbackTracks;
  }

  // Ultra-relaxed search for genres with very few results
  private async getRelaxedSearch(categoryName: string, token: string): Promise<SpotifyTrack[]> {
    try {
      console.log(`Performing ultra-relaxed search for: "${categoryName}"`);

      // Try very simple search without genre filter, just keyword matching
      const response = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(categoryName)}&type=track&market=US&limit=50&offset=0`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        return [];
      }

      const data = await response.json();
      const tracks = data.tracks?.items || [];

      const relaxedTracks = tracks
        .filter(
          (track: any) =>
            track.popularity >= 10 && // Very low threshold
            track.duration_ms > 15000 && // Even shorter minimum
            track.duration_ms < 900000 // Longer maximum
        )
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
          preview_url: track.preview_url,
        }));

      console.log(`Ultra-relaxed search found ${relaxedTracks.length} tracks`);
      return relaxedTracks;
    } catch (error) {
      console.log(`Ultra-relaxed search failed:`, error);
      return [];
    }
  }

  // Get related genres for fallback searches
  private getRelatedGenres(genre: string): string[] {
    const genreMap: { [key: string]: string[] } = {
      rock: ["alternative rock", "classic rock", "indie rock", "pop rock", "hard rock"],
      pop: ["dance pop", "indie pop", "electropop", "synth-pop", "art pop"],
      electronic: ["house", "techno", "ambient", "synthwave", "electro"],
      "hip hop": ["rap", "trap", "conscious hip hop", "alternative hip hop", "old school hip hop"],
      "r&b": ["soul", "neo soul", "contemporary r&b", "funk", "motown"],
      jazz: ["smooth jazz", "contemporary jazz", "jazz fusion", "bebop", "swing"],
      country: ["country pop", "modern country", "country rock", "bluegrass", "americana"],
      latin: ["latin pop", "reggaeton", "salsa", "bachata", "latin rock"],
      metal: ["heavy metal", "death metal", "black metal", "thrash metal", "progressive metal"],
      folk: ["folk rock", "indie folk", "americana", "singer-songwriter", "acoustic"],
      blues: ["electric blues", "chicago blues", "delta blues", "blues rock", "contemporary blues"],
      classical: ["symphony", "chamber music", "opera", "baroque", "romantic"],
      world: ["world music", "ethnic", "traditional", "folk", "cultural"],
    };

    const normalized = genre.toLowerCase();
    return genreMap[normalized] || [genre];
  }

  // Generate varied search queries for a genre to increase track diversity

  // Generate varied search queries for a genre to increase track diversity
  private generateVariedSearchQueries(categoryName: string): string[] {
    const queries: string[] = [];

    // Base genre query
    queries.push(`genre:"${categoryName}"`);

    // Add year variations for temporal diversity
    const currentYear = new Date().getFullYear();
    const years = [
      currentYear - 1, // Last year
      currentYear - 2, // 2 years ago
      currentYear - Math.floor(Math.random() * 10) - 3, // 3-12 years ago
      currentYear - Math.floor(Math.random() * 20) - 10, // 10-30 years ago
    ];

    years.forEach((year) => {
      queries.push(`genre:"${categoryName}" year:${year}`);
    });

    // Add popularity-based variations
    queries.push(`genre:"${categoryName}" popularity:>40`);
    queries.push(`genre:"${categoryName}" popularity:20-60`); // Mid-range popularity for hidden gems

    // Add combined queries for specific sub-genres if available
    const subGenreMap: { [key: string]: string[] } = {
      pop: ["dance pop", "indie pop", "art pop", "electropop"],
      rock: ["classic rock", "indie rock", "alternative rock", "pop rock", "hard rock", "punk rock", "progressive rock", "rock and roll"],
      electronic: ["house", "techno", "ambient", "synthwave"],
      "hip hop": ["trap", "conscious hip hop", "old school hip hop", "alternative hip hop"],
      "r&b": ["contemporary r&b", "neo soul", "alternative r&b", "classic soul"],
      jazz: ["smooth jazz", "contemporary jazz", "jazz fusion", "bebop"],
      country: ["modern country", "classic country", "country pop", "country rock"],
      latin: ["latin pop", "reggaeton", "salsa", "bachata"],
      metal: ["heavy metal", "death metal", "black metal", "thrash metal", "progressive metal"],
      folk: ["folk rock", "indie folk", "americana", "singer-songwriter"],
      blues: ["electric blues", "chicago blues", "delta blues", "blues rock"],
    };

    const normalizedCategory = categoryName.toLowerCase();
    if (subGenreMap[normalizedCategory]) {
      const subGenres = subGenreMap[normalizedCategory];
      const randomSubGenre = subGenres[Math.floor(Math.random() * subGenres.length)];
      queries.push(`genre:"${randomSubGenre}"`);
    }

    // Shuffle the queries array for randomness
    return queries.sort(() => Math.random() - 0.5);
  }

  // Vary popularity threshold to include both hits and hidden gems
  private getVariedPopularityThreshold(): number {
    const thresholds = [20, 25, 30, 35, 40, 45];
    const weights = [15, 20, 30, 20, 10, 5]; // Favor mid-range popularity

    const random = Math.random() * 100;
    let accumulated = 0;

    for (let i = 0; i < thresholds.length; i++) {
      accumulated += weights[i];
      if (random <= accumulated) {
        return thresholds[i];
      }
    }

    return 30; // Default fallback
  }

  async getRandomTrackForRound(categoryName: string = "mixed"): Promise<{
    correct: SpotifyTrack;
    wrongOptions: SpotifyTrack[];
  }> {
    try {
      console.log(`Fetching tracks directly from Spotify for category "${categoryName}"`);

      // Reset used tracks cache periodically (every 30 minutes) to allow replay variety
      const now = Date.now();
      if (now - this.lastCacheReset > 30 * 60 * 1000) {
        this.usedTrackIds.clear();
        this.lastCacheReset = now;
        console.log("Reset used tracks cache for fresh variety");
      }

      // Fetch more tracks to have better selection variety
      const tracks = await this.getTracksByCategory(categoryName, 100);

      if (tracks.length < 4) {
        throw new Error(`Not enough tracks found for category "${categoryName}". Only found ${tracks.length} tracks, need at least 4.`);
      }

      // Filter out recently used tracks for variety (unless cache is too full)
      const unusedTracks = tracks.filter((track) => !this.usedTrackIds.has(track.id));
      const availableTracks = unusedTracks.length >= 10 ? unusedTracks : tracks;

      console.log(`Available tracks: ${availableTracks.length} (${tracks.length - availableTracks.length} recently used)`);

      // Implement intelligent track selection for better game variety
      const { correct, candidates } = this.selectDiverseTracksForRound(availableTracks);

      // Mark this track as used
      this.usedTrackIds.add(correct.id);

      console.log(
        `Selected correct track: "${correct.name}" by ${correct.artists[0]?.name} (popularity: ${correct.popularity}, category: ${categoryName})`
      );
      console.log(`Spotify URI: ${correct.uri}`);

      // Create wrong options with strategic diversity
      const wrongOptions = this.generateDiverseWrongOptions(correct, candidates);

      if (wrongOptions.length < 3) {
        throw new Error(`Not enough tracks to create wrong options for category "${categoryName}". Need 4 total, found ${wrongOptions.length + 1}.`);
      }

      // Mark wrong option tracks as used too (to avoid them as correct answers soon)
      wrongOptions.forEach((track) => this.usedTrackIds.add(track.id));

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

  // Intelligently select diverse tracks for better game experience
  private selectDiverseTracksForRound(tracks: SpotifyTrack[]): { correct: SpotifyTrack; candidates: SpotifyTrack[] } {
    // Shuffle all tracks first
    const shuffledTracks = [...tracks].sort(() => Math.random() - 0.5);

    // Group tracks by popularity tiers for balanced selection
    const popularTracks = shuffledTracks.filter((t) => t.popularity >= 60);
    const moderateTracks = shuffledTracks.filter((t) => t.popularity >= 35 && t.popularity < 60);
    const lesserKnownTracks = shuffledTracks.filter((t) => t.popularity < 35);

    // Select correct track with weighted randomness (favor moderate popularity for balance)
    let correctTrack: SpotifyTrack;
    const rand = Math.random();

    if (rand < 0.15 && popularTracks.length > 0) {
      // 15% chance for very popular tracks
      correctTrack = popularTracks[Math.floor(Math.random() * popularTracks.length)];
    } else if (rand < 0.75 && moderateTracks.length > 0) {
      // 60% chance for moderate tracks (sweet spot)
      correctTrack = moderateTracks[Math.floor(Math.random() * moderateTracks.length)];
    } else if (lesserKnownTracks.length > 0) {
      // 25% chance for lesser known tracks (discovery factor)
      correctTrack = lesserKnownTracks[Math.floor(Math.random() * lesserKnownTracks.length)];
    } else {
      // Fallback to any available track
      correctTrack = shuffledTracks[0];
    }

    // Return remaining tracks as candidates for wrong options
    const candidates = shuffledTracks.filter((t) => t.id !== correctTrack.id);

    return { correct: correctTrack, candidates };
  }

  // Generate wrong options with strategic diversity
  private generateDiverseWrongOptions(correct: SpotifyTrack, candidates: SpotifyTrack[]): SpotifyTrack[] {
    const wrongOptions: SpotifyTrack[] = [];
    const usedArtists = new Set([correct.artists[0]?.name.toLowerCase()]);
    const usedSongs = new Set([correct.name.toLowerCase()]);

    // Create pools of candidates by similarity to correct track
    const similarPopularity = candidates.filter((t) => Math.abs(t.popularity - correct.popularity) <= 20);
    const differentPopularity = candidates.filter((t) => Math.abs(t.popularity - correct.popularity) > 20);

    // Strategy: Mix similar and different tracks for balanced difficulty
    const candidatePools = [
      similarPopularity.slice(0, 20), // Similar popularity
      differentPopularity.slice(0, 20), // Different popularity
      candidates.slice(0, 30), // General pool
    ].filter((pool) => pool.length > 0);

    // Select wrong options from different pools for variety
    for (const pool of candidatePools) {
      if (wrongOptions.length >= 3) break;

      // Shuffle current pool
      const shuffledPool = [...pool].sort(() => Math.random() - 0.5);

      for (const track of shuffledPool) {
        if (wrongOptions.length >= 3) break;

        const artistName = track.artists[0]?.name.toLowerCase();
        const songName = track.name.toLowerCase();

        // Skip if already used this artist or song
        if (usedArtists.has(artistName) || usedSongs.has(songName)) continue;

        // Skip if already selected this track
        if (wrongOptions.some((wo) => wo.id === track.id)) continue;

        wrongOptions.push(track);
        usedArtists.add(artistName);
        usedSongs.add(songName);
      }
    }

    // If still need more options, relax constraints
    if (wrongOptions.length < 3) {
      console.log(`Only found ${wrongOptions.length} diverse wrong options, filling remaining slots...`);

      for (const track of candidates) {
        if (wrongOptions.length >= 3) break;

        // Skip tracks already selected
        if (wrongOptions.some((wo) => wo.id === track.id)) continue;

        wrongOptions.push(track);
      }
    }

    return wrongOptions;
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

  // Method to manually reset variety cache (useful for testing)
  resetVarietyCache(): void {
    this.usedTrackIds.clear();
    this.lastCacheReset = Date.now();
    console.log("Manually reset variety cache");
  }

  // Get stats about variety cache
  getVarietyStats(): { usedTracks: number; cacheAge: number } {
    return {
      usedTracks: this.usedTrackIds.size,
      cacheAge: Math.floor((Date.now() - this.lastCacheReset) / 1000 / 60), // in minutes
    };
  }
}

export const spotifyService = new SpotifyService();
