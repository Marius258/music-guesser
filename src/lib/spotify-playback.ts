/**
 * Spotify Web Playback SDK client-side service
 * Only used by the game host to play full tracks
 */

export interface SpotifyPlayer {
  addListener: (event: string, callback: (data: any) => void) => void;
  connect: () => Promise<boolean>;
  disconnect: () => void;
  getCurrentState: () => Promise<any>;
  getVolume: () => Promise<number>;
  nextTrack: () => Promise<void>;
  pause: () => Promise<void>;
  previousTrack: () => Promise<void>;
  resume: () => Promise<void>;
  seek: (position_ms: number) => Promise<void>;
  setName: (name: string) => Promise<void>;
  setVolume: (volume: number) => Promise<void>;
  togglePlay: () => Promise<void>;
}

declare global {
  interface Window {
    onSpotifyWebPlaybackSDKReady: () => void;
    Spotify: {
      Player: new (options: { name: string; getOAuthToken: (cb: (token: string) => void) => void; volume?: number }) => SpotifyPlayer;
    };
  }
}

export class SpotifyWebPlayback {
  private player: SpotifyPlayer | null = null;
  private deviceId: string | null = null;
  private accessToken: string | null = null;
  private isReady = false;
  private isHost = false;
  private lastLogTime: number = 0;
  private isPlaying = false;
  private currentTimeout: NodeJS.Timeout | null = null;
  private lastPlayTime: number = 0;
  private fadeInterval: NodeJS.Timeout | null = null;
  private currentVolume: number = 0.8; // Track current volume for fading

  constructor(isHost: boolean = false) {
    this.isHost = isHost;
  }

  async initialize(accessToken: string): Promise<void> {
    if (!this.isHost) {
      console.log("Not host - Spotify playback disabled");
      return;
    }

    // Only run in browser environment
    if (typeof window === "undefined") {
      console.warn("Cannot initialize Spotify Web Playback SDK on server side");
      return;
    }

    this.accessToken = accessToken;

    // Load Spotify Web Playback SDK
    if (!window.Spotify) {
      await this.loadSpotifySDK();
    }

    // Initialize player
    this.player = new window.Spotify.Player({
      name: "Music Guesser Game",
      getOAuthToken: (cb) => {
        cb(this.accessToken!);
      },
      volume: this.currentVolume,
    });

    // Error handling
    this.player.addListener("initialization_error", ({ message }) => {
      console.error("Failed to initialize Spotify player:", message);
    });

    this.player.addListener("authentication_error", ({ message }) => {
      console.error("Failed to authenticate with Spotify:", message);
    });

    this.player.addListener("account_error", ({ message }) => {
      console.error("Failed to validate Spotify account:", message);
    });

    this.player.addListener("playback_error", ({ message }) => {
      console.error("Failed to perform playback:", message);
    });

    // Playback status updates
    this.player.addListener("player_state_changed", (state) => {
      if (!state) return;

      // Update internal playing state based on Spotify state
      this.isPlaying = !state.paused;

      // Only log significant state changes to reduce console spam
      const now = Date.now();
      if (!this.lastLogTime || now - this.lastLogTime > 5000) {
        // Log at most every 5 seconds
        console.log("Player state changed:", {
          paused: state.paused,
          position: Math.floor(state.position / 1000) + "s", // Show seconds instead of milliseconds
          duration: Math.floor(state.duration / 1000) + "s",
          track: state.track_window.current_track?.name,
        });
        this.lastLogTime = now;
      }
    });

    // Ready
    this.player.addListener("ready", ({ device_id }) => {
      console.log("Spotify Web Playback SDK is ready with device ID:", device_id);
      this.deviceId = device_id;
      this.isReady = true;
    });

    // Not ready
    this.player.addListener("not_ready", ({ device_id }) => {
      console.log("Spotify Web Playback SDK has gone offline with device ID:", device_id);
      this.isReady = false;
    });

    // Connect to the player
    const connected = await this.player.connect();
    if (!connected) {
      throw new Error("Failed to connect to Spotify Web Playback SDK");
    }
  }

  private loadSpotifySDK(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Check if we're in browser environment
      if (typeof window === "undefined") {
        reject(new Error("Cannot load Spotify SDK on server side"));
        return;
      }

      if (window.Spotify) {
        resolve();
        return;
      }

      window.onSpotifyWebPlaybackSDKReady = () => {
        resolve();
      };

      const script = document.createElement("script");
      script.src = "https://sdk.scdn.co/spotify-player.js";
      script.async = true;
      script.onerror = () => reject(new Error("Failed to load Spotify Web Playback SDK"));
      document.head.appendChild(script);
    });
  }

  private async fadeIn(durationMs: number = 1000): Promise<void> {
    if (!this.isHost || !this.player) return;

    const steps = 20; // Number of fade steps
    const stepDuration = durationMs / steps;
    const volumeStep = this.currentVolume / steps;

    // Clear any existing fade
    if (this.fadeInterval) {
      clearInterval(this.fadeInterval);
      this.fadeInterval = null;
    }

    // Start from 0 volume
    await this.player.setVolume(0);

    let currentStep = 0;
    return new Promise((resolve) => {
      this.fadeInterval = setInterval(async () => {
        currentStep++;
        const volume = volumeStep * currentStep;

        try {
          await this.player!.setVolume(Math.min(volume, this.currentVolume));
        } catch (error) {
          console.error("Error during fade in:", error);
        }

        if (currentStep >= steps) {
          if (this.fadeInterval) {
            clearInterval(this.fadeInterval);
            this.fadeInterval = null;
          }
          resolve();
        }
      }, stepDuration);
    });
  }

  async fadeOut(durationMs: number = 1500): Promise<void> {
    if (!this.isHost || !this.player) return;

    const steps = 20; // Number of fade steps
    const stepDuration = durationMs / steps;
    const volumeStep = this.currentVolume / steps;

    // Clear any existing fade
    if (this.fadeInterval) {
      clearInterval(this.fadeInterval);
      this.fadeInterval = null;
    }

    // Get current volume to fade from
    let startVolume = this.currentVolume;
    try {
      startVolume = await this.player.getVolume();
    } catch (error) {
      // Use stored volume if getVolume fails
      startVolume = this.currentVolume;
    }

    let currentStep = 0;
    return new Promise((resolve) => {
      this.fadeInterval = setInterval(async () => {
        currentStep++;
        const volume = startVolume - volumeStep * currentStep;

        try {
          await this.player!.setVolume(Math.max(volume, 0));
        } catch (error) {
          console.error("Error during fade out:", error);
        }

        if (currentStep >= steps || volume <= 0) {
          if (this.fadeInterval) {
            clearInterval(this.fadeInterval);
            this.fadeInterval = null;
          }
          resolve();
        }
      }, stepDuration);
    });
  }

  async playTrack(trackUri: string, startPosition: number = 0): Promise<void> {
    if (!this.isHost || !this.isReady || !this.deviceId || !this.accessToken) {
      console.log("Cannot play track - not host or not ready");
      return;
    }

    // Rate limiting: prevent calls more frequent than every 500ms
    const now = Date.now();
    if (now - this.lastPlayTime < 500) {
      console.log("Rate limiting: ignoring rapid play request");
      return;
    }
    this.lastPlayTime = now;

    if (this.isPlaying) {
      console.log("Already playing a track, stopping previous playback first");
      await this.pause();
      // Small delay to ensure the pause command is processed
      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    // Clear any existing timeout when starting a new track
    if (this.currentTimeout) {
      clearTimeout(this.currentTimeout);
      this.currentTimeout = null;
    }

    try {
      this.isPlaying = true;

      const response = await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${this.deviceId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.accessToken}`,
        },
        body: JSON.stringify({
          uris: [trackUri],
          position_ms: startPosition,
        }),
      });

      if (!response.ok) {
        this.isPlaying = false;
        throw new Error(`Failed to play track: ${response.status} ${response.statusText}`);
      }

      console.log(`Started playing track: ${trackUri} from position ${Math.floor(startPosition / 1000)}s`);

      // Fade in the track
      await this.fadeIn(800); // 800ms fade in
    } catch (error) {
      this.isPlaying = false;
      console.error("Error playing track:", error);
      throw error;
    }
  }

  async playTrackSegment(trackUri: string, startMs: number, durationMs: number = 30000): Promise<void> {
    if (!this.isHost) return;

    // Rate limiting: prevent calls more frequent than every 1000ms for segments
    const now = Date.now();
    if (now - this.lastPlayTime < 1000) {
      console.log("Rate limiting: ignoring rapid playTrackSegment request");
      return;
    }

    // Clear any existing timeout to prevent multiple overlapping timeouts
    if (this.currentTimeout) {
      clearTimeout(this.currentTimeout);
      this.currentTimeout = null;
      console.log("Cleared previous playback timeout");
    }

    // Start playing the track
    await this.playTrack(trackUri, startMs);

    // Set a new timeout to stop after the specified duration
    this.currentTimeout = setTimeout(async () => {
      console.log(`Stopping track after ${durationMs / 1000}s segment`);
      await this.fadeOutAndPause();
      this.currentTimeout = null;
    }, durationMs);
  }

  async playTrackContinuous(trackUri: string, startMs: number = 0): Promise<void> {
    if (!this.isHost) return;

    // Rate limiting: prevent calls more frequent than every 1000ms
    const now = Date.now();
    if (now - this.lastPlayTime < 1000) {
      console.log("Rate limiting: ignoring rapid playTrackContinuous request");
      return;
    }

    // Clear any existing timeout to prevent automatic stopping
    if (this.currentTimeout) {
      clearTimeout(this.currentTimeout);
      this.currentTimeout = null;
      console.log("Cleared previous playback timeout for continuous play");
    }

    // Start playing the track without setting a timeout
    await this.playTrack(trackUri, startMs);
    console.log("Playing track continuously (no auto-stop timeout)");
  }

  private async fadeOutAndPause(): Promise<void> {
    if (!this.isHost || !this.player) return;

    // Fade out then pause
    await this.fadeOut(1200); // 1.2 second fade out
    await this.pause();

    // Restore volume for next track
    try {
      await this.player.setVolume(this.currentVolume);
    } catch (error) {
      console.error("Error restoring volume:", error);
    }
  }

  async pause(): Promise<void> {
    if (!this.isHost || !this.player) return;

    // Clear any pending timeout when manually pausing
    if (this.currentTimeout) {
      clearTimeout(this.currentTimeout);
      this.currentTimeout = null;
    }

    try {
      await this.player.pause();
      this.isPlaying = false;
      console.log("Playback paused");
    } catch (error) {
      console.error("Error pausing playback:", error);
    }
  }

  async resume(): Promise<void> {
    if (!this.isHost || !this.player) return;

    try {
      await this.player.resume();
      this.isPlaying = true;
      console.log("Playback resumed");
    } catch (error) {
      console.error("Error resuming playback:", error);
    }
  }

  async setVolume(volume: number): Promise<void> {
    if (!this.isHost || !this.player) return;

    try {
      this.currentVolume = volume; // Track the desired volume
      await this.player.setVolume(volume);
      console.log(`Volume set to ${volume}`);
    } catch (error) {
      console.error("Error setting volume:", error);
    }
  }

  async stopTrack(): Promise<void> {
    if (!this.isHost) return;

    // Clear any pending timeout
    if (this.currentTimeout) {
      clearTimeout(this.currentTimeout);
      this.currentTimeout = null;
      console.log("Cleared pending timeout");
    }

    // Fade out and pause the track
    await this.fadeOutAndPause();
  }

  disconnect(): void {
    // Clear any pending timeout when disconnecting
    if (this.currentTimeout) {
      clearTimeout(this.currentTimeout);
      this.currentTimeout = null;
    }

    // Clear any fade intervals
    if (this.fadeInterval) {
      clearInterval(this.fadeInterval);
      this.fadeInterval = null;
    }

    if (this.player) {
      this.player.disconnect();
      this.player = null;
      this.isReady = false;
      this.deviceId = null;
      this.isPlaying = false;
    }
  }

  getDeviceId(): string | null {
    return this.deviceId;
  }

  isPlayerReady(): boolean {
    return this.isReady && this.isHost;
  }

  setHostStatus(isHost: boolean): void {
    this.isHost = isHost;
    console.log(`Spotify playback host status set to: ${isHost}`);
  }
}

export const spotifyWebPlayback = new SpotifyWebPlayback();
