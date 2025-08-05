/**
 * Shared utility functions used across components
 */

/**
 * Format time in seconds to display format
 */
export function formatTime(seconds: number | undefined): string {
  if (seconds === undefined) return "--";
  return `${seconds}s`;
}

/**
 * Format answer time for display
 */
export function formatAnswerTime(time: number): string {
  if (time < 1) {
    return `${Math.round(time * 10) / 10}s`;
  }
  return `${Math.round(time * 10) / 10}s`;
}

/**
 * Get medal emoji based on position
 */
export function getMedalEmoji(position: number): string {
  switch (position) {
    case 1:
      return "🥇";
    case 2:
      return "🥈";
    case 3:
      return "🥉";
    default:
      return "🏅";
  }
}

/**
 * Get player position in scores array
 */
export function getPlayerPosition(scores: Array<{ id: string; score: number }>, playerId: string): number {
  if (!scores) return -1;
  return scores.findIndex((score) => score.id === playerId) + 1;
}

/**
 * Get position class for podium animations
 */
export function getPositionClass(index: number): string {
  switch (index) {
    case 0:
      return "first";
    case 1:
      return "second";
    case 2:
      return "third";
    default:
      return "";
  }
}
