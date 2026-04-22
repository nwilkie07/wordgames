import { createFileRoute } from '@tanstack/react-router';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { loadWords, getWords } from '../../db/seed';
import { gameDb } from '../../db/games';
import { Hexagon } from '../../components/hexagon';
import { WordDistributionTable } from '../../components/WordDistributionTable';
import { TwoLetterPrefixTable } from '../../components/TwoLetterPrefixTable';
import { trpc } from '../../../../api/src/app/client';
import { loadClues, getClues } from '../../lib/clues';
import {
  loadDefinitions,
  getDefinition,
  getDefinitionWithFallback,
} from '../../lib/definitions';

export const Route = createFileRoute('/panagram/seven-letter')({
  component: SevenLetterPanagram,
});

type ValidWord = {
  word: string;
  isPangram: boolean;
  points: number;
};

function generateAchievementThresholds(maxScore: number) {
  const percentages = [0, 0.05, 0.15, 0.25, 0.4, 0.55, 0.7, 0.85, 1.0];
  const names = [
    'Beginner',
    'Moving Up',
    'Good',
    'Solid',
    'Nice',
    'Great',
    'Amazing',
    'Genius',
    'Perfect',
  ];

  return names.map((name, i) => ({
    name,
    points: Math.round(percentages[i] * maxScore),
  }));
}

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
        [...new Set(w.word.split(''))].sort().join(''),
      ),
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
    new Map(),
  );
  const [foundWords, setFoundWords] = useState<Set<string>>(new Set());
  const [currentInput, setCurrentInput] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentGameId, setCurrentGameId] = useState<string | null>(null);
  const [hints, setHints] = useState<string[]>([]);
  const [showHints, setShowHints] = useState(false);
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [selectedDefinition, setSelectedDefinition] = useState<string | null>(
    null,
  );
  const [isEnded, setIsEnded] = useState(false);

  useEffect(() => {
    if (selectedWord) {
      getDefinitionWithFallback(selectedWord).then((def) => {
        setSelectedDefinition(def);
      });
    } else {
      setSelectedDefinition(null);
    }
  }, [selectedWord]);

  const hintMutation = trpc.generateHints.useMutation();

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
        setIsEnded(savedGame.isEnded || false);
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
        isEnded: false,
      });

      setCurrentGameId(newGame.id);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    loadOrCreateGame();
    loadDefinitions();
    loadClues();
  }, [loadOrCreateGame]);

  const saveGame = useCallback(
    (
      words: Set<string>,
      score: number,
      completed = false,
      isEndedFlag = false,
    ) => {
      if (!currentGameId) return;
      gameDb.panagram.update(currentGameId, {
        foundWordsJson: JSON.stringify([...words]),
        score,
        completed,
        isEnded: isEndedFlag,
      });
    },
    [currentGameId],
  );

  const displayLetters = useMemo(() => {
    if (!puzzle) return [];
    const letters = puzzle.letters.split('');
    const center = puzzle.centerLetter;
    const withoutCenter = letters.filter((l) => l !== center);
    return [...withoutCenter.slice(0, 3), center, ...withoutCenter.slice(3)];
  }, [puzzle]);

  const handleTileClick = (letter: string) => {
    if (isEnded) return;
    setCurrentInput((prev) => prev + letter);
    setMessage('');
  };

  const handleDelete = () => {
    if (isEnded) return;
    setCurrentInput((prev) => prev.slice(0, -1));
    setMessage('');
  };

  const handleShuffle = () => {
    if (isEnded) return;
    if (!puzzle) return;
    const letters = puzzle.letters
      .split('')
      .filter((l: string) => l !== puzzle.centerLetter);
    for (let i = letters.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [letters[i], letters[j]] = [letters[j], letters[i]];
    }
    setPuzzle((prev) =>
      prev ? { ...prev, letters: letters.join('') + prev.centerLetter } : null,
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

  const handleSubmit = () => {
    if (isEnded) return;
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
        }`,
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

  const handleGetHints = useCallback(async () => {
    if (!puzzle) return;
    const validWordsList = Array.from(validWords.keys());
    const result = await hintMutation.mutateAsync({
      letters: puzzle.letters,
      centerLetter: puzzle.centerLetter,
      foundWords: Array.from(foundWords),
      validWords: validWordsList,
    });
    setHints(result.hints);
    setShowHints(true);
  }, [puzzle, foundWords, validWords, hintMutation]);

  const score = calculateScore();
  const maxScore = useMemo(() => {
    let total = 0;
    for (const w of validWords.values()) total += w.points;
    return total;
  }, [validWords]);
  const ACHIEVEMENT_THRESHOLDS = useMemo(
    () => generateAchievementThresholds(maxScore),
    [maxScore],
  );
  const achievement = useMemo(() => {
    let result = ACHIEVEMENT_THRESHOLDS[0];
    for (const threshold of ACHIEVEMENT_THRESHOLDS) {
      if (score >= threshold.points) result = threshold;
    }
    return result;
  }, [score, ACHIEVEMENT_THRESHOLDS]);
  const achievementIndex = ACHIEVEMENT_THRESHOLDS.indexOf(achievement);

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
          letter={displayLetters[3]}
          index={3}
          isCenter
          onClick={() => handleTileClick(displayLetters[3])}
        />
        <Hexagon
          letter={displayLetters[4]}
          index={4}
          onClick={() => handleTileClick(displayLetters[4])}
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
        <button
          onClick={() => setShowHints(true)}
          disabled={isEnded}
          className="rounded-md bg-purple-100 px-4 py-2 text-sm font-bold active:bg-purple-200 disabled:opacity-50"
        >
          {hintMutation.isPending ? '...' : 'HINT'}
        </button>
        {!isEnded && (
          <button
            onClick={() => {
              setIsEnded(true);
              saveGame(
                foundWords,
                calculateScore(),
                foundWords.size === validWords.size,
                true,
              );
            }}
            className="rounded-md bg-red-100 px-4 py-2 text-sm font-bold active:bg-red-200"
          >
            END GAME
          </button>
        )}
      </div>

      <div>
        {puzzle && validWords.size > 0 && !isEnded && (
          <button
            onClick={() => {
              const unfoundWords = Array.from(validWords.keys()).filter(
                (w) => !foundWords.has(w),
              );
              if (unfoundWords.length === 0) return;
              const word =
                unfoundWords[Math.floor(Math.random() * unfoundWords.length)];
              const clues = getClues(word);
              if (clues && clues.length > 0) {
                const clue = clues[Math.floor(Math.random() * clues.length)];
                setMessage(
                  `${word.slice(0, 2).toUpperCase()}: ${clue} (${word.length} Letters)`,
                );
              } else {
                setMessage(`No clue found, try the button again!`);
              }
            }}
            className="mt-4 rounded-md bg-green-100 px-4 py-2 text-sm font-bold hover:bg-green-200"
          >
            Show Clue for Random Unfound Word
          </button>
        )}
      </div>

      <div
        className="w-full max-w-md overflow-y-auto pt-8"
        style={{ maxHeight: '200px' }}
      >
        <div className="flex flex-wrap justify-center gap-2">
          {[...foundWords].sort().map((word) => {
            const wordData = validWords.get(word);
            return (
              <button
                key={word}
                onClick={() =>
                  setSelectedWord(word === selectedWord ? null : word)
                }
                className={`rounded-full px-2 py-1 text-xs ${
                  wordData?.isPangram
                    ? 'bg-yellow-400 font-bold text-black'
                    : 'bg-gray-100 text-gray-700'
                } hover:ring-2 hover:ring-blue-400 ${
                  selectedWord === word ? 'ring-2 ring-blue-500' : ''
                }`}
              >
                {word.toUpperCase()}
              </button>
            );
          })}
        </div>
      </div>

      {isEnded && puzzle && validWords.size > 0 && (
        <div className="mt-4 w-full max-w-md">
          <h3 className="mb-2 text-center text-sm font-bold text-red-600">
            Words You Missed ({validWords.size - foundWords.size})
          </h3>
          <div className="flex flex-wrap justify-center gap-2">
            {Array.from(validWords.keys())
              .filter((w) => !foundWords.has(w))
              .map((word) => {
                const wordData = validWords.get(word);
                return (
                  <button
                    key={word}
                    onClick={() =>
                      setSelectedWord(word === selectedWord ? null : word)
                    }
                    className={`rounded-full px-2 py-1 text-xs ${
                      wordData?.isPangram
                        ? 'bg-red-200 font-bold text-red-800'
                        : 'bg-gray-200 text-gray-700'
                    } hover:ring-2 hover:ring-blue-400 ${
                      selectedWord === word ? 'ring-2 ring-blue-500' : ''
                    }`}
                  >
                    {word.toUpperCase()}
                  </button>
                );
              })}
          </div>
        </div>
      )}

      {selectedWord && (
        <div className="mt-2 rounded-lg bg-blue-50 p-3 text-sm text-blue-800">
          <div className="font-bold">{selectedWord.toUpperCase()}</div>
          <div>{selectedDefinition || 'No definition available'}</div>
        </div>
      )}

      {currentGameId && (
        <div className="mt-4 text-xs text-gray-400">
          Game ID: {currentGameId.slice(0, 8)}...
        </div>
      )}

      {showHints && (
        <div className="mt-4 w-full max-w-md rounded-lg bg-purple-50 p-4">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="font-bold">Hints</h3>
            <button
              onClick={() => setShowHints(!showHints)}
              className="text-sm text-purple-600 hover:text-purple-800"
            >
              Close
            </button>
          </div>
          <div>
            {puzzle && validWords.size > 0 && (
              <WordDistributionTable
                letters={puzzle.letters}
                centerLetter={puzzle.centerLetter}
                validWords={Array.from(validWords.values())}
              />
            )}

            {puzzle && validWords.size > 0 && (
              <TwoLetterPrefixTable
                validWords={Array.from(validWords.values())}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
