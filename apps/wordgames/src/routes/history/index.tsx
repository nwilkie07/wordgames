import { createFileRoute } from '@tanstack/react-router';
import React, { useState, useEffect } from 'react';
import { gameDb, type PanagramGame } from '../../db/games';

export const Route = createFileRoute('/history/')({
  component: History,
});

export default function History() {
  const [games, setGames] = useState<PanagramGame[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setGames(gameDb.panagram.findAll());
    setLoading(false);
  }, []);

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    } catch {
      return dateStr;
    }
  };

  const handlePlayGame = (gameId: string) => {
    window.location.href = `/panagram/seven-letter?gameId=${gameId}`;
  };

  const handleDeleteGame = (e: React.MouseEvent, gameId: string) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this game?')) {
      gameDb.panagram.remove(gameId);
      setGames(gameDb.panagram.findAll());
    }
  };

  if (loading) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center">
        <span className="text-lg">Loading...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col p-4">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Panagram Game History</h1>
        <a
          href="/"
          className="rounded-md bg-gray-100 px-4 py-2 text-sm font-bold hover:bg-gray-200"
        >
          Back to Home
        </a>
      </div>

      {(!games || games.length === 0) && (
        <div className="flex flex-1 flex-col items-center justify-center text-gray-500">
          <span className="text-lg">No games played yet.</span>
          <a
            href="/panagram/seven-letter"
            className="mt-4 rounded-md bg-orange-100 px-4 py-2 font-bold hover:bg-orange-200"
          >
            Play a New Game
          </a>
        </div>
      )}

      <div className="flex flex-col gap-4">
        {games.map((game) => {
          const foundWords = JSON.parse(game.foundWordsJson || '[]');
          return (
            <div
              key={game.id}
              onClick={() => handlePlayGame(game.id)}
              className="block cursor-pointer rounded-lg border p-4 hover:border-orange-300 hover:bg-gray-50"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold">
                      {game.letters.toUpperCase()}
                    </span>
                    <span className="rounded-full bg-yellow-400 px-2 py-0.5 text-sm font-bold">
                      {game.centerLetter.toUpperCase()}
                    </span>
                  </div>
                  <div className="mt-1 text-sm text-gray-500">
                    {formatDate(game.updatedAt)}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-xl font-bold">{game.score}</div>
                    <div className="text-sm text-gray-500">points</div>
                  </div>
                  <button
                    onClick={(e) => handleDeleteGame(e, game.id)}
                    className="rounded-md bg-red-100 px-3 py-1 text-sm font-bold text-red-600 hover:bg-red-200"
                  >
                    Delete
                  </button>
                </div>
              </div>
              <div className="mt-2 text-sm text-gray-500">
                {foundWords.length} words found
              </div>
              {game.completed && (
                <div className="mt-2 text-sm font-bold text-green-600">
                  Completed!
                </div>
              )}
              {game.isEnded && (
                <div className="mt-2 text-sm font-bold text-red-600">Ended</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
