/**
 * Game utility functions for ID generation and game state management
 */

/**
 * Generate a simple game ID: 3 letters + 3 numbers (e.g., ABC123)
 */
export function generateGameId(): string {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const numbers = "0123456789";

  let result = "";

  // Generate 3 random letters
  for (let i = 0; i < 3; i++) {
    result += letters.charAt(Math.floor(Math.random() * letters.length));
  }

  // Generate 3 random numbers
  for (let i = 0; i < 3; i++) {
    result += numbers.charAt(Math.floor(Math.random() * numbers.length));
  }

  return result;
}

/**
 * Generate a simple player ID: random alphanumeric string
 */
export function generatePlayerId(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 12; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Calculate points based on answer time and correctness
 */
export function calculatePoints(isCorrect: boolean, timeElapsed: number, roundDuration: number): number {
  if (!isCorrect) return 0;

  const basePoints = 100;
  const falloffStart = 1000;

  if (timeElapsed <= falloffStart) return basePoints;

  // Calculate the fraction of time after falloffStart
  const effectiveDuration = roundDuration - falloffStart;
  const timeAfterFalloff = Math.max(0, timeElapsed - falloffStart);

  // Linear falloff: points decrease from 100 to 0 as timeAfterFalloff goes from 0 to effectiveDuration
  const fraction = Math.min(1, timeAfterFalloff / effectiveDuration);
  const points = Math.round(basePoints * (1 - fraction));

  return points;
}

/**
 * Validate game configuration
 */
export function validateGameConfig(config: any): boolean {
  return (
    config &&
    typeof config.totalRounds === "number" &&
    config.totalRounds > 0 &&
    config.totalRounds <= 50 &&
    typeof config.roundDurationSeconds === "number" &&
    config.roundDurationSeconds >= 10 &&
    config.roundDurationSeconds <= 60 &&
    typeof config.musicCategory === "string"
  );
}
