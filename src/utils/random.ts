export function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

export function randomSeed(): number {
  return Math.floor(Math.random() * 2 ** 15);
}

export function getNextZIndex(elements: { zIndex: number }[]): number {
  if (elements.length === 0) return 0;
  return Math.max(...elements.map(el => el.zIndex)) + 1;
}