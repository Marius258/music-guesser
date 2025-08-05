/**
 * Centralized logging utility for the application
 */

type LogLevel = "debug" | "info" | "warn" | "error";

const isDevelopment = typeof window !== "undefined" && window.location.hostname === "localhost";

class Logger {
  private shouldLog(level: LogLevel): boolean {
    // Only log in development or for errors/warnings
    return isDevelopment || level === "error" || level === "warn";
  }

  debug(message: string, ...args: any[]): void {
    if (this.shouldLog("debug")) {
      console.log(`[DEBUG] ${message}`, ...args);
    }
  }

  info(message: string, ...args: any[]): void {
    if (this.shouldLog("info")) {
      console.log(`[INFO] ${message}`, ...args);
    }
  }

  warn(message: string, ...args: any[]): void {
    if (this.shouldLog("warn")) {
      console.warn(`[WARN] ${message}`, ...args);
    }
  }

  error(message: string, ...args: any[]): void {
    if (this.shouldLog("error")) {
      console.error(`[ERROR] ${message}`, ...args);
    }
  }

  /**
   * Log Spotify-specific messages with context
   */
  spotify(level: LogLevel, message: string, ...args: any[]): void {
    const spotifyMessage = `🎵 Spotify: ${message}`;
    switch (level) {
      case "debug":
        this.debug(spotifyMessage, ...args);
        break;
      case "info":
        this.info(spotifyMessage, ...args);
        break;
      case "warn":
        this.warn(spotifyMessage, ...args);
        break;
      case "error":
        this.error(spotifyMessage, ...args);
        break;
    }
  }
}

export const logger = new Logger();
