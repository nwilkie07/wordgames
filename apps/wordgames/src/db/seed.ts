// In-memory words cache
let wordsCache: { word: string; length: number }[] = [];
let loaded = false;

export async function loadWords(): Promise<{ word: string; length: number }[]> {
  if (loaded) return wordsCache;

  console.log('[db] Loading words into memory...');
  const response = await fetch('/3of6game.txt');
  if (!response.ok) {
    throw new Error(
      `Failed to load words: ${response.status} ${response.statusText}`,
    );
  }
  const text = await response.text();
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .map((l) => l.replace(/[+$^&%@#*!?~=<>|\\/-]$/, ''))
    .filter((l) => l.length > 0);

  wordsCache = lines.map((word) => ({ word, length: word.length }));
  loaded = true;
  console.log(`[db] Loaded ${wordsCache.length} words into memory`);
  return wordsCache;
}

export function getWords(): { word: string; length: number }[] {
  return wordsCache;
}

export function isLoaded(): boolean {
  return loaded;
}

// Create tables in memory database
export async function initDb(): Promise<void> {
  const { pgClient } = await import('./db');

  await pgClient.exec(`
        CREATE TABLE IF NOT EXISTS panagram_games (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            letters TEXT NOT NULL,
            center_letter TEXT NOT NULL,
            found_words_json TEXT NOT NULL DEFAULT '[]',
            score INTEGER NOT NULL DEFAULT 0,
            completed BOOLEAN NOT NULL DEFAULT false,
            created_at TEXT NOT NULL DEFAULT '',
            updated_at TEXT NOT NULL DEFAULT ''
        );

        CREATE TABLE IF NOT EXISTS target_games (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            letters TEXT NOT NULL,
            center_letter TEXT NOT NULL,
            letter_counts TEXT NOT NULL,
            found_words_json TEXT NOT NULL DEFAULT '[]',
            completed BOOLEAN NOT NULL DEFAULT false,
            created_at TEXT NOT NULL DEFAULT '',
            updated_at TEXT NOT NULL DEFAULT ''
        );
    `);

  console.log('[db] Game tables ready');
}
