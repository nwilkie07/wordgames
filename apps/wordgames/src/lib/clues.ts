let cluesCache: Record<string, string[]> | null = null;
let loading = false;
let loadPromise: Promise<void> | null = null;

export async function loadClues(): Promise<void> {
  if (cluesCache) return;
  if (loading && loadPromise) return loadPromise;

  loading = true;
  loadPromise = (async () => {
    console.log('[clues] Loading clues...');
    const response = await fetch('/clues.json');
    if (!response.ok) {
      throw new Error(`Failed to load clues: ${response.status}`);
    }
    cluesCache = await response.json();
    const cached = cluesCache as Record<string, string[]>;
    const count = Object.keys(cached).length;
    console.log(`[clues] Loaded ${count} words with clues`);
    loading = false;
  })();

  return loadPromise;
}

export function getClues(word: string): string[] | null {
  if (!cluesCache) return null;
  const clues = cluesCache[word.toLowerCase()];
  if (!clues || clues.length === 0) return null;
  return clues;
}

export function getRandomClue(word: string): string | null {
  const clues = getClues(word);
  if (!clues || clues.length === 0) return null;
  return clues[Math.floor(Math.random() * clues.length)];
}

export function hasClue(word: string): boolean {
  if (!cluesCache) return false;
  const clues = cluesCache[word.toLowerCase()];
  return Array.isArray(clues) && clues.length > 0;
}

export function isLoaded(): boolean {
  return cluesCache !== null;
}
