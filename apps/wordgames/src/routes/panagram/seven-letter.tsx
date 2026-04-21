import { createFileRoute } from '@tanstack/react-router';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { loadWords, getWords } from '../../db/seed';
import { gameDb } from '../../db/games';
import { Hexagon } from '../../components/hexagon';

export const Route = createFileRoute('/panagram/seven-letter')({
  component: SevenLetterPanagram,
});

const ACHIEVEMENT_THRESHOLDS = [
  { name: 'Beginner', points: 0 },
  { name: 'Good Start', points: 50 },
  { name: 'Moving Up', points: 100 },
  { name: 'Good', points: 150 },
  { name: 'Solid', points: 200 },
  { name: 'Nice', points: 250 },
  { name: 'Great', points: 300 },
  { name: 'Amazing', points: 350 },
  { name: 'Genius', points: 400 },
];

type ValidWord = {
  word: string;
  isPangram: boolean;
  points: number;
};

function getGameIdFromUrl(): string | null {
  const params = new URLSearchParams(window.location.search);
  return params.get('gameId');
}

function generatePuzzle(allWords: { word: string; length: number }[]) {
  const sevenLetterWords = allWords.filter((w) => w.length === 7);
  if (sevenLetterWords.length === 0) return null;

  const uniqueSets = [
    ...new Set(
      sevenLetterWords.map((w) =>
        [...new Set(w.word.split(''))].sort().join('')
      )
    ),
  ].filter((s) => s.length === 7);
  if (uniqueSets.length === 0) return null;

  const randomSet = uniqueSets[Math.floor(Math.random() * uniqueSets.length)];
  const lettersSet = new Set(randomSet.split(''));
  const letters = randomSet.split('');
  const centerLetter = letters[Math.floor(Math.random() * letters.length)];

  const validWords: ValidWord[] = [];
  for (const w of allWords) {
    if (w.length < 4) continue;
    const wordLetters = new Set(w.word.split(''));
    if ([...wordLetters].some((l) => !lettersSet.has(l))) continue;
    if (!w.word.includes(centerLetter)) continue;

    const isPangram = wordLetters.size === 7;
    const points = w.length === 4 ? 1 : w.length + (isPangram ? 7 : 0);
    validWords.push({ word: w.word, isPangram, points });
  }

  if (validWords.length < 15) return null;

  return { letters: randomSet, centerLetter, validWords };
}

export default function SevenLetterPanagram() {
  const [puzzle, setPuzzle] = useState<{
    letters: string;
    centerLetter: string;
    validWords: ValidWord[];
  } | null>(null);
  const [validWords, setValidWords] = useState<Map<string, ValidWord>>(
    new Map()
  );
  const [foundWords, setFoundWords] = useState<Set<string>>(new Set());
  const [currentInput, setCurrentInput] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentGameId, setCurrentGameId] = useState<string | null>(null);

  const loadOrCreateGame = useCallback(async () => {
    await loadWords();
    const allWords = getWords();

    const urlGameId = getGameIdFromUrl();

    if (urlGameId) {
      const savedGame = gameDb.panagram.findById(urlGameId);

      if (savedGame) {
        const foundWordsParsed = JSON.parse(savedGame.foundWordsJson || '[]');
        setFoundWords(new Set(foundWordsParsed));

        const lettersSet = new Set(savedGame.letters.split(''));
        const validWordsList: ValidWord[] = [];
        for (const w of allWords) {
          if (w.length < 4) continue;
          const wordLetters = new Set(w.word.split(''));
          if ([...wordLetters].some((l) => !lettersSet.has(l))) continue;
          if (!w.word.includes(savedGame.centerLetter)) continue;

          const isPangram = wordLetters.size === 7;
          const points = w.length === 4 ? 1 : w.length + (isPangram ? 7 : 0);
          validWordsList.push({ word: w.word, isPangram, points });
        }

        setPuzzle({
          letters: savedGame.letters,
          centerLetter: savedGame.centerLetter,
          validWords: validWordsList,
        });
        const wordMap = new Map<string, ValidWord>();
        for (const w of validWordsList) wordMap.set(w.word.toLowerCase(), w);
        setValidWords(wordMap);
        setCurrentGameId(urlGameId);
        setLoading(false);
        return;
      }
    }

    const newPuzzle = generatePuzzle(allWords);
    if (newPuzzle) {
      setPuzzle(newPuzzle);
      const wordMap = new Map<string, ValidWord>();
      for (const w of newPuzzle.validWords)
        wordMap.set(w.word.toLowerCase(), w);
      setValidWords(wordMap);

      const newGame = gameDb.panagram.create({
        letters: newPuzzle.letters,
        centerLetter: newPuzzle.centerLetter,
        foundWordsJson: '[]',
        score: 0,
        completed: false,
      });

      setCurrentGameId(newGame.id);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    loadOrCreateGame();
  }, [loadOrCreateGame]);

  const saveGame = useCallback(
    (words: Set<string>, score: number, completed = false) => {
      if (!currentGameId) return;
      gameDb.panagram.update(currentGameId, {
        foundWordsJson: JSON.stringify([...words]),
        score,
        completed,
      });
    },
    [currentGameId]
  );

  const displayLetters = useMemo(() => {
    if (!puzzle) return [];
    const letters = puzzle.letters.split('');
    const center = puzzle.centerLetter;
    const withoutCenter = letters.filter((l) => l !== center);
    return [...withoutCenter.slice(0, 3), center, ...withoutCenter.slice(3)];
  }, [puzzle]);

  const handleTileClick = (letter: string) => {
    setCurrentInput((prev) => prev + letter);
    setMessage('');
  };

  const handleDelete = () => {
    setCurrentInput((prev) => prev.slice(0, -1));
    setMessage('');
  };

  const handleShuffle = () => {
    if (!puzzle) return;
    const letters = displayLetters.filter((l) => l !== puzzle.centerLetter);
    for (let i = letters.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [letters[i], letters[j]] = [letters[j], letters[i]];
    }
    setPuzzle((prev) =>
      prev ? { ...prev, letters: prev.centerLetter + letters.join('') } : null
    );
  };

  const calculateScore = useCallback(() => {
    let score = 0;
    for (const word of foundWords) {
      const wordData = validWords.get(word);
      if (wordData) score += wordData.points;
    }
    return score;
  }, [foundWords, validWords]);

  const getCurrentAchievement = () => {
    const score = calculateScore();
    let achievement = ACHIEVEMENT_THRESHOLDS[0];
    for (const threshold of ACHIEVEMENT_THRESHOLDS) {
      if (score >= threshold.points) achievement = threshold;
    }
    return achievement;
  };

  const handleSubmit = () => {
    const word = currentInput.toLowerCase().trim();
    if (word.length < 4) setMessage('Too short');
    else if (!word.includes(puzzle?.centerLetter.toLowerCase() || ''))
      setMessage('Missing center letter');
    else if (!validWords.has(word)) setMessage('Not in word list');
    else if (foundWords.has(word)) setMessage('Already found');
    else {
      const wordData = validWords.get(word);
      if (!wordData) return;
      setMessage(
        `+${wordData.points} point${wordData.points > 1 ? 's' : ''}${
          wordData.isPangram ? ' PANGRAM!' : ''
        }`
      );
      const newFoundWords = new Set([...foundWords, word]);
      setFoundWords(newFoundWords);
      saveGame(newFoundWords, calculateScore() + wordData.points);
    }
    setCurrentInput('');
  };

  const handleBackToHome = () => {
    window.location.href = '/';
  };

  const score = calculateScore();
  const achievement = getCurrentAchievement();
  const achievementIndex = ACHIEVEMENT_THRESHOLDS.indexOf(achievement);

  const maxScore = useMemo(() => {
    let total = 0;
    for (const w of validWords.values()) total += w.points;
    return total;
  }, [validWords]);

  if (loading)
    return (
      <div className="flex flex-1 flex-col items-center justify-center">
        <span className="text-lg">Loading...</span>
      </div>
    );
  if (!puzzle)
    return (
      <div className="flex flex-1 flex-col items-center justify-center">
        <span className="text-lg">No puzzle available</span>
      </div>
    );

  return (
    <div className="flex flex-1 flex-col items-center p-4">
      <div className="mb-4 text-center">
        <span className="text-sm text-gray-500">
          {foundWords.size}/{validWords.size} words
        </span>
        <h2 className="text-2xl font-bold">Score: {score}</h2>
        <span className="text-sm text-gray-500">Max: {maxScore}</span>
      </div>

      <div className="mb-4">
        <div className="flex items-center gap-1 text-sm">
          {ACHIEVEMENT_THRESHOLDS.map((threshold, i) => (
            <div
              key={threshold.name}
              className={`h-2 w-4 rounded ${
                i <= achievementIndex ? 'bg-yellow-400' : 'bg-gray-200'
              }`}
              title={`${threshold.name}: ${threshold.points}+`}
            />
          ))}
        </div>
        <span className="text-sm font-medium">{achievement.name}</span>
      </div>

      <div
        className={`mb-4 min-h-12 min-w-48 border-2 px-4 py-2 text-center text-lg font-medium ${
          message.includes('+')
            ? 'border-green-400 bg-green-50'
            : 'border-gray-300'
        }`}
      >
        {message || currentInput.toUpperCase()}
      </div>

      <div className="grid grid-cols-2">
        <Hexagon
          letter={displayLetters[0]}
          index={0}
          onClick={() => handleTileClick(displayLetters[0])}
        />
        <Hexagon
          letter={displayLetters[1]}
          index={1}
          onClick={() => handleTileClick(displayLetters[1])}
        />
      </div>
      <div className="grid grid-cols-3">
        <Hexagon
          letter={displayLetters[2]}
          index={2}
          onClick={() => handleTileClick(displayLetters[2])}
        />
        <Hexagon
          letter={puzzle.centerLetter}
          index={3}
          isCenter
          onClick={() => handleTileClick(puzzle.centerLetter)}
        />
        <Hexagon
          letter={displayLetters[3]}
          index={4}
          onClick={() => handleTileClick(displayLetters[3])}
        />
      </div>
      <div className="grid grid-cols-2">
        <Hexagon
          letter={displayLetters[5]}
          index={5}
          onClick={() => handleTileClick(displayLetters[5])}
        />
        <Hexagon
          letter={displayLetters[6]}
          index={6}
          onClick={() => handleTileClick(displayLetters[6])}
        />
      </div>
      <div className="mb-4 flex gap-2 mt-6">
        <button
          onClick={handleShuffle}
          className="rounded-md bg-blue-100 px-4 py-2 text-sm font-bold active:bg-blue-200"
        >
          SHUFFLE
        </button>
        <div className="flex items-center justify-center">
          <button
            onClick={handleDelete}
            className="rounded-md bg-blue-100 px-4 py-2 text-sm font-bold active:bg-blue-200"
          >
            DEL
          </button>
        </div>
        <button
          onClick={handleSubmit}
          className="rounded-md bg-orange-100 px-4 py-2 text-sm font-bold active:bg-orange-200"
        >
          SUBMIT
        </button>
        <button
          onClick={handleBackToHome}
          className="rounded-md bg-gray-100 px-4 py-2 text-sm font-bold active:bg-gray-200"
        >
          HOME
        </button>
      </div>

      <div
        className="w-full max-w-md overflow-y-auto"
        style={{ maxHeight: '200px' }}
      >
        <div className="flex flex-wrap justify-center gap-2">
          {[...foundWords].map((word) => {
            const wordData = validWords.get(word);
            return (
              <span
                key={word}
                className={`rounded-full px-2 py-1 text-xs ${
                  wordData?.isPangram
                    ? 'bg-yellow-400 font-bold text-black'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                {word.toUpperCase()}
              </span>
            );
          })}
        </div>
      </div>

      {currentGameId && (
        <div className="mt-4 text-xs text-gray-400">
          Game ID: {currentGameId.slice(0, 8)}...
        </div>
      )}
    </div>
  );
}
