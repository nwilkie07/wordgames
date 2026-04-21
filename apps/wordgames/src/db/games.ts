// In-memory storage for game history
export type PanagramGame = {
  id: string;
  letters: string;
  centerLetter: string;
  foundWordsJson: string;
  score: number;
  completed: boolean;
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
  createdAt: string;
  updatedAt: string;
};

const panagramGames: PanagramGame[] = [];
const targetGames: TargetGame[] = [];

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
  },
};
