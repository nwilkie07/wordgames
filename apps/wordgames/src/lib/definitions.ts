let definitionsCache: Record<string, string> | null = null;
let loading = false;
let loadPromise: Promise<void> | null = null;
const apiCache: Record<string, string> = {};

export async function loadDefinitions(): Promise<void> {
  if (definitionsCache) return;
  if (loading && loadPromise) return loadPromise;

  loading = true;
  loadPromise = (async () => {
    console.log('[dict] Loading definitions...');
    const response = await fetch('/definitions.json');
    if (!response.ok) {
      throw new Error(`Failed to load definitions: ${response.status}`);
    }
    definitionsCache = await response.json();
    const defs = definitionsCache as Record<string, string>;
    const count = Object.keys(defs).length;
    console.log(`[dict] Loaded ${count} definitions`);
    loading = false;
  })();

  return loadPromise;
}

export function getDefinition(word: string): string | null {
  if (!definitionsCache) return null;
  const defs = definitionsCache as Record<string, string>;
  return defs[word.toLowerCase()] || null;
}

export function hasDefinition(word: string): boolean {
  if (!definitionsCache) return false;
  const defs = definitionsCache as Record<string, string>;
  return word.toLowerCase() in defs;
}

export function isLoaded(): boolean {
  return definitionsCache !== null;
}

async function fetchFromFreeDictionary(word: string): Promise<string | null> {
  const w = word.toLowerCase();

  try {
    const response = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${w}`,
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    if (Array.isArray(data) && data.length > 0) {
      const entry = data[0];
      if (entry.meanings && entry.meanings.length > 0) {
        const meaning = entry.meanings[0];
        if (meaning.definitions && meaning.definitions.length > 0) {
          return meaning.definitions[0].definition;
        }
      }
    }

    return null;
  } catch (error) {
    console.error(`[dict] Failed to fetch definition for ${w}:`, error);
    return null;
  }
}

export async function getDefinitionWithFallback(
  word: string,
): Promise<string | null> {
  const w = word.toLowerCase();

  if (hasDefinition(w)) {
    return getDefinition(w);
  }

  if (apiCache[w]) {
    return apiCache[w];
  }

  const fallback = await fetchFromFreeDictionary(w);
  if (fallback) {
    apiCache[w] = fallback;
  }

  return fallback;
}
