export type MatchResult = "win" | "draw" | "loss";
export type Morale = "excellent" | "good" | "poor" | "crisis";

export function calculateResult(focusScore: number, goalHit: boolean): MatchResult {
  if (focusScore >= 4 && goalHit) return "win";
  if (focusScore >= 4 && !goalHit) return "draw";
  if (focusScore === 3 && goalHit) return "draw";
  if (focusScore === 3 && !goalHit) return "loss";
  if (focusScore <= 2 && goalHit) return "draw";
  return "loss";
}

export function calculateOvrChange(result: MatchResult): number {
  if (result === "win") return 1;
  if (result === "draw") return 0;
  return -1;
}

export function calculateXpEarned(result: MatchResult, focusScore: number): number {
  const base = result === "win" ? 100 : result === "draw" ? 50 : 20;
  return base + focusScore * 10;
}

export function calculateBudgetEarned(result: MatchResult): number {
  if (result === "win") return 150;
  if (result === "draw") return 50;
  return 0;
}

export function updateForm(currentForm: string, result: MatchResult): string {
  const form: string[] = JSON.parse(currentForm);
  const updated = [...form, result.charAt(0).toUpperCase()].slice(-5);
  return JSON.stringify(updated);
}

export function calculateMorale(form: string): Morale {
  const results: string[] = JSON.parse(form);
  if (results.length === 0) return "good";
  const wins = results.filter((r) => r === "W").length;
  const losses = results.filter((r) => r === "L").length;
  const ratio = wins / results.length;
  if (ratio >= 0.8) return "excellent";
  if (ratio >= 0.5) return "good";
  if (losses >= 3) return "crisis";
  return "poor";
}

export function clampOvr(ovr: number): number {
  return Math.max(40, Math.min(99, ovr));
}

export const DIVISION_NAMES: Record<number, string> = {
  1: "Premier League",
  2: "Championship",
  3: "League One",
  4: "League Two",
  5: "Sunday League",
};

export const MORALE_COLORS: Record<Morale, string> = {
  excellent: "text-green-400",
  good: "text-blue-400",
  poor: "text-yellow-400",
  crisis: "text-red-400",
};

export const RESULT_COLORS: Record<MatchResult, string> = {
  win: "text-green-400",
  draw: "text-yellow-400",
  loss: "text-red-400",
};
