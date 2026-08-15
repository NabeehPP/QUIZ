export const TEAM_COLORS = [
  { name: "Blue", hex: "#3B5CFF" },
  { name: "Purple", hex: "#8B2FE8" },
  { name: "Yellow", hex: "#FFC93C" },
  { name: "Orange", hex: "#FF7A29" },
  { name: "Pink", hex: "#FF3EA5" },
  { name: "Green", hex: "#22D67E" },
  { name: "Red", hex: "#FF4747" },
] as const;

export function colorForIndex(i: number) {
  return TEAM_COLORS[i % TEAM_COLORS.length].hex;
}

// The four answer-option colors shown on both host and team screens.
// Kept fixed per position (A/B/C/D) so the game is easy to follow at a glance.
export const OPTION_COLORS = ["#bbc6ff", "#bbc6ff", "#bbc6ff", "#bbc6ff"] as const;
export const OPTION_LETTERS = ["A", "B", "C", "D"];
