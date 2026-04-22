// In-memory storage for game history (synced with localStorage)
export type PanagramGame = {
  id: string;
  letters: string;
  centerLetter: string;
  foundWordsJson: string;
  score: number;
  completed: boolean;
  isEnded: boolean;
  createdAt: string;
  updatedAt: string;
};

export type TargetGame = {
  id: string;
  letters: string;
  centerLetter: string;
  letterCounts: string;
  foundWordsJson: string;
  completed: boolean;
  isEnded: boolean;
  createdAt: string;
  updatedAt: string;
};

const PANAGRAM_STORAGE_KEY = 'wordgames_panagram_games';
const TARGET_STORAGE_KEY = 'wordgames_target_games';

function loadFromStorage<T>(key: string): T[] {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveToStorage<T>(key: string, data: T[]) {
  localStorage.setItem(key, JSON.stringify(data));
}

let panagramGames: PanagramGame[] = loadFromStorage(PANAGRAM_STORAGE_KEY);
let targetGames: TargetGame[] = loadFromStorage(TARGET_STORAGE_KEY);

function generateId(): string {
  return crypto.randomUUID();
}

export const gameDb = {
  panagram: {
    create(
      data: Omit<PanagramGame, 'id' | 'createdAt' | 'updatedAt'>,
    ): PanagramGame {
      const now = new Date().toISOString();
      const game: PanagramGame = {
        id: generateId(),
        ...data,
        createdAt: now,
        updatedAt: now,
      };
      panagramGames.push(game);
      saveToStorage(PANAGRAM_STORAGE_KEY, panagramGames);
      return game;
    },
    update(id: string, data: Partial<PanagramGame>): PanagramGame | null {
      const idx = panagramGames.findIndex((g) => g.id === id);
      if (idx === -1) return null;
      panagramGames[idx] = {
        ...panagramGames[idx],
        ...data,
        updatedAt: new Date().toISOString(),
      };
      saveToStorage(PANAGRAM_STORAGE_KEY, panagramGames);
      return panagramGames[idx];
    },
    findById(id: string): PanagramGame | undefined {
      return panagramGames.find((g) => g.id === id);
    },
    findAll(): PanagramGame[] {
      return [...panagramGames].sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      );
    },
    remove(id: string): boolean {
      const idx = panagramGames.findIndex((g) => g.id === id);
      if (idx === -1) return false;
      panagramGames.splice(idx, 1);
      saveToStorage(PANAGRAM_STORAGE_KEY, panagramGames);
      return true;
    },
  },
  target: {
    create(
      data: Omit<TargetGame, 'id' | 'createdAt' | 'updatedAt'>,
    ): TargetGame {
      const now = new Date().toISOString();
      const game: TargetGame = {
        id: generateId(),
        ...data,
        createdAt: now,
        updatedAt: now,
      };
      targetGames.push(game);
      saveToStorage(TARGET_STORAGE_KEY, targetGames);
      return game;
    },
    update(id: string, data: Partial<TargetGame>): TargetGame | null {
      const idx = targetGames.findIndex((g) => g.id === id);
      if (idx === -1) return null;
      targetGames[idx] = {
        ...targetGames[idx],
        ...data,
        updatedAt: new Date().toISOString(),
      };
      saveToStorage(TARGET_STORAGE_KEY, targetGames);
      return targetGames[idx];
    },
    findById(id: string): TargetGame | undefined {
      return targetGames.find((g) => g.id === id);
    },
    findAll(): TargetGame[] {
      return [...targetGames].sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      );
    },
    remove(id: string): boolean {
      const idx = targetGames.findIndex((g) => g.id === id);
      if (idx === -1) return false;
      targetGames.splice(idx, 1);
      saveToStorage(TARGET_STORAGE_KEY, targetGames);
      return true;
    },
  },
};
