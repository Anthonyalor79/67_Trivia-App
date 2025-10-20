export function scoreAnswer(isCorrect: boolean, responseTimeMs: number) {
  const base = isCorrect ? 100 : 0;
  const speedBonus = isCorrect ? Math.max(0, 50 - Math.floor(responseTimeMs / 200)) : 0;
  return base + speedBonus;
}
