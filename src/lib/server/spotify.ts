import { SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET } from "$env/static/private";

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

export interface SpotifyGenre {
  id: string;
  name: string;
  description: string;
  icons?: { url: string; height: number; width: number }[];
}

export interface SpotifyCategoriesResponse {
  categories: {
    items: SpotifyGenre[];
    total: number;
    limit: number;
    offset: number;
  };
}

export interface SpotifySearchResponse {
  tracks: {
    items: SpotifyTrack[];
  };
}

class SpotifyService {
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;
  private cachedCategories: SpotifyGenre[] = [];
  private lastCategoriesUpdate: number = 0;
  private readonly CATEGORIES_CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours for categories only

  // Get available music categories - now using curated genres instead of Spotify categories
  async getMusicCategories(): Promise<SpotifyGenre[]> {
    // Return a curated list of popular music genres
    const genres: SpotifyGenre[] = [
      {
        id: "mixed",
        name: "🎵 Mixed (All Genres)",
        description: "A mix of popular songs from all genres",
      },
      {
        id: "pop",
        name: "🎤 Pop",
        description: "Popular mainstream music",
      },
      {
        id: "rock",
        name: "🎸 Rock",
        description: "Rock and alternative music",
      },
      {
        id: "hip-hop",
        name: "🎤 Hip-Hop",
        description: "Hip-hop and rap music",
      },
      {
        id: "electronic",
        name: "🎧 Electronic",
        description: "Electronic and dance music",
      },
      {
        id: "indie",
        name: "🎵 Indie",
        description: "Independent and alternative music",
      },
      {
        id: "r&b",
        name: "🎶 R&B",
        description: "R&B and soul music",
      },
      {
        id: "country",
        name: "🤠 Country",
        description: "Country and folk music",
      },
      {
        id: "jazz",
        name: "🎺 Jazz",
        description: "Jazz and blues music",
      },
      {
        id: "classical",
        name: "🎼 Classical",
        description: "Classical and orchestral music",
      },
      {
        id: "reggae",
        name: "🏝️ Reggae",
        description: "Reggae and Caribbean music",
      },
      {
        id: "metal",
        name: "🤘 Metal",
        description: "Heavy metal and hard rock",
      },
      {
        id: "funk",
        name: "🕺 Funk",
        description: "Funk and disco music",
      },
      {
        id: "latin",
        name: "🌶️ Latin",
        description: "Latin and Spanish music",
      },
      {
        id: "ambient",
        name: "🌙 Ambient",
        description: "Ambient and chill music",
      },
    ];

    console.log(`Using curated genres: ${genres.length} genres available`);
    return genres;
  }

  // Add appropriate emojis to category names
  private addEmojiToCategory(name: string, id: string): string {
    const emojiMap: Record<string, string> = {
      pop: "🎤",
      rock: "🎸",
      hiphop: "🎤",
      "hip-hop": "🎤",
      rap: "🎤",
      electronic: "🎧",
      dance: "�",
      edm: "🎧",
      indie: "🎵",
      alternative: "🎵",
      country: "🤠",
      folk: "🌾",
      rnb: "🎶",
      "r&b": "🎶",
      soul: "🎶",
      jazz: "🎺",
      blues: "🎺",
      classical: "🎼",
      orchestra: "🎼",
      reggae: "🏝️",
      caribbean: "🏝️",
      metal: "🤘",
      punk: "🤘",
      funk: "🕺",
      disco: "🕺",
      latin: "🌶️",
      spanish: "🌶️",
      world: "🌍",
      ambient: "🌙",
      chill: "😌",
      workout: "💪",
      party: "🎉",
      focus: "🧠",
      sleep: "😴",
      mood: "💭",
      decades: "�",
      throwback: "⏰",
      covers: "🎭",
      acoustic: "🎻",
      instrumental: "🎹",
    };

    const lowerName = name.toLowerCase();
    const lowerCatId = id.toLowerCase();

    // Try to find emoji by category name or id
    for (const [key, emoji] of Object.entries(emojiMap)) {
      if (lowerName.includes(key) || lowerCatId.includes(key)) {
        return `${emoji} ${name}`;
      }
    }

    // Default emoji for unmatched categories
    return `🎵 ${name}`;
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

  async searchTracks(query: string, limit: number = 50): Promise<SpotifyTrack[]> {
    const token = await this.getAccessToken();

    // Add random offset to get different results each time (max 1000 as per Spotify API limits)
    const randomOffset = Math.floor(Math.random() * Math.min(200, 1000));

    const response = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=${limit}&offset=${randomOffset}&market=US`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Spotify search failed: ${response.status}`);
    }

    const data: SpotifySearchResponse = await response.json();
    return data.tracks.items;
  }

  async getAlternativePopularTracks(): Promise<SpotifyTrack[]> {
    try {
      // Use alternative search queries for variety
      const alternativeQueries = ["genre:pop", "genre:rock", "genre:hip-hop", "year:2020", "year:2019", "year:2018", "top hits", "popular songs"];

      const randomQuery = alternativeQueries[Math.floor(Math.random() * alternativeQueries.length)];
      console.log(`Using alternative search strategy: "${randomQuery}"`);

      const tracks = await this.searchTracks(randomQuery, 50);
      const goodTracks = tracks.filter((track) => track.popularity > 30);

      console.log(`Got ${goodTracks.length} tracks from alternative search`);
      return goodTracks;
    } catch (error) {
      console.error("Error fetching alternative popular tracks:", error);
      throw new Error(`Failed to fetch alternative popular tracks: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  async getRandomPopularTracks(count: number = 50): Promise<SpotifyTrack[]> {
    // Use specific queries for well-established tracks and popular artists
    const queries = [
      "year:2010-2020", // Well-established tracks
      "year:2005-2015",
      "year:2000-2010",
      "genre:pop year:2010-2020",
      "genre:rock year:2010-2020",
      "genre:hip-hop year:2010-2020",
      "genre:indie year:2010-2020",
      "genre:electronic year:2010-2020",
      "artist:taylor swift",
      "artist:ed sheeran",
      "artist:drake",
      "artist:ariana grande",
      "artist:post malone",
      "artist:billie eilish",
      "artist:the weeknd",
      "artist:dua lipa",
      "artist:bruno mars",
      "artist:adele",
      "track:shape of you",
      "track:blinding lights",
      "track:someone like you",
      "track:rolling in the deep",
      "track:uptown funk",
      "track:bad guy",
      "track:stay",
      "track:levitating",
      "album:25 adele",
      "album:divide ed sheeran",
      "album:scorpion drake",
    ];

    const randomQuery = queries[Math.floor(Math.random() * queries.length)];
    console.log(`Searching Spotify with query: "${randomQuery}"`);

    const tracks = await this.searchTracks(randomQuery, count);
    console.log(`Found ${tracks.length} tracks from Spotify`);

    // Filter tracks with good popularity scores for Web Playback SDK
    const goodTracks = tracks.filter(
      (track) => track.popularity > 30 // Good popularity for well-known tracks
    );
    console.log(`Tracks with popularity > 30: ${goodTracks.length}`);

    // Shuffle the results
    return goodTracks.sort(() => Math.random() - 0.5);
  }

  async getTracksByCategory(categoryId: string, count: number = 50): Promise<SpotifyTrack[]> {
    // Handle the special "mixed" category
    if (categoryId === "mixed") {
      return this.getRandomPopularTracks(count);
    }

    try {
      console.log(`Fetching tracks for category: ${categoryId}`);

      // Find the category in our cached categories to get the clean name
      let categoryName = categoryId;
      const category = this.cachedCategories.find((cat) => cat.id === categoryId);
      if (category) {
        // Remove emoji and clean up the name for better searching
        categoryName = category.name.replace(/^[^\w\s]+\s*/, "").trim(); // Remove leading emoji
        console.log(`Using category name "${categoryName}" for searches`);
      }

      // Create search queries based on the clean category name
      const searchQueries = [`genre:"${categoryName.toLowerCase()}"`, categoryName.toLowerCase()];

      // If category name contains specific keywords, add more targeted searches
      const keywords = categoryName.toLowerCase().split(/[\s\-&]+/);
      for (const keyword of keywords) {
        if (keyword.length > 3) {
          // Only use meaningful keywords
          searchQueries.push(`genre:"${keyword}"`);
        }
      }

      const tracks: SpotifyTrack[] = [];
      const maxQueries = Math.min(3, searchQueries.length);

      for (let i = 0; i < maxQueries; i++) {
        const query = searchQueries[i];
        console.log(`Searching with query: "${query}"`);

        const searchTracks = await this.searchTracks(query, Math.ceil(count / maxQueries));
        const goodTracks = searchTracks.filter((track) => track.popularity > 30);

        tracks.push(...goodTracks);
        console.log(`Found ${goodTracks.length} tracks from search query "${query}"`);

        // Small delay between requests to avoid rate limiting
        if (i < maxQueries - 1) {
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      }

      if (tracks.length === 0) {
        throw new Error(`No tracks found for category "${categoryId}" ("${categoryName}")`);
      }

      // Remove duplicates and shuffle
      const uniqueTracks = tracks.filter((track, index, self) => index === self.findIndex((t) => t.id === track.id));

      console.log(`Category "${categoryId}" returned ${uniqueTracks.length} unique tracks from search`);
      return uniqueTracks.sort(() => Math.random() - 0.5);
    } catch (error) {
      console.error(`Error fetching tracks for category ${categoryId}:`, error);
      throw new Error(
        `Failed to fetch tracks for category "${categoryId}" from Spotify: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  async getRandomTrackForRound(categoryId: string = "mixed"): Promise<{
    correct: SpotifyTrack;
    wrongOptions: SpotifyTrack[];
  }> {
    try {
      console.log(`Fetching tracks directly from Spotify for category "${categoryId}"`);

      // Fetch tracks directly from Spotify
      const tracks = await this.getTracksByCategory(categoryId, 50);

      if (tracks.length < 4) {
        throw new Error(`Not enough tracks found for category "${categoryId}". Only found ${tracks.length} tracks, need at least 4.`);
      }

      // Shuffle all tracks to ensure randomness
      const shuffledTracks = [...tracks].sort(() => Math.random() - 0.5);

      // Select tracks with good popularity but still allow variety
      const goodTracks = shuffledTracks.filter((track) => track.popularity > 30);
      const availableTracks = goodTracks.length >= 10 ? goodTracks : shuffledTracks;

      // Select the correct track randomly
      const correct = availableTracks[Math.floor(Math.random() * Math.min(availableTracks.length, 50))];
      console.log(
        `Selected correct track: "${correct.name}" by ${correct.artists[0]?.name} (popularity: ${correct.popularity}, category: ${categoryId})`
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
        throw new Error(`Not enough tracks to create wrong options for category "${categoryId}". Need 4 total, found ${wrongOptions.length + 1}.`);
      }

      console.log(
        `Selected wrong options: ${wrongOptions.map((t) => `"${t.name}" by ${t.artists[0]?.name} (popularity: ${t.popularity})`).join(", ")}`
      );

      return {
        correct,
        wrongOptions: wrongOptions.slice(0, 3),
      };
    } catch (error) {
      console.error(`Error fetching Spotify tracks for category "${categoryId}":`, error);
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
