import { createFileRoute } from '@tanstack/react-router';
import { Tile } from '../../components/tile';
import { WordDistributionTable } from '../../components/WordDistributionTable';
import { TwoLetterPrefixTable } from '../../components/TwoLetterPrefixTable';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { loadWords, getWords } from '../../db/seed';
import { gameDb } from '../../db/games';
import { trpc } from '../../../../api/src/app/client';
import {
  loadDefinitions,
  getDefinition,
  getDefinitionWithFallback,
} from '../../lib/definitions';
import { loadClues, getClues } from '../../lib/clues';

export const Route = createFileRoute('/target/nine-letter')({
  component: NineLetter,
});

type ValidWord = {
  word: string;
  isTargetWord: boolean;
};

function generateAchievementThresholds(maxWords: number) {
  const percentages = [0, 0.05, 0.15, 0.25, 0.4, 0.55, 0.7, 0.85, 1.0];
  const names = [
    'Beginner',
    'Good Start',
    'Moving Up',
    'Good',
    'Solid',
    'Nice',
    'Great',
    'Amazing',
    'Genius',
  ];

  return names.map((name, i) => ({
    name,
    words: Math.round(percentages[i] * maxWords),
  }));
}

function getGameIdFromUrl(): string | null {
  const params = new URLSearchParams(window.location.search);
  return params.get('gameId');
}

function generateTargetPuzzle(allWords: { word: string; length: number }[]) {
  const nineLetterWords = allWords.filter((w) => w.length === 9);
  if (nineLetterWords.length === 0) return null;

  const uniqueSets: {
    letters: string;
    letterCounts: Record<string, number>;
  }[] = [];
  const seen = new Set<string>();

  for (const w of nineLetterWords) {
    const unique = [...new Set(w.word.split(''))].sort().join('');
    if (unique.length !== 9 || seen.has(unique)) continue;
    seen.add(unique);

    const counts: Record<string, number> = {};
    for (const c of w.word.split('')) counts[c] = (counts[c] || 0) + 1;
    uniqueSets.push({ letters: unique, letterCounts: counts });
  }

  if (uniqueSets.length === 0) return null;

  const selected = uniqueSets[Math.floor(Math.random() * uniqueSets.length)];
  const lettersSet = new Set(selected.letters.split(''));
  const letters = selected.letters.split('');
  const centerLetter = letters[Math.floor(Math.random() * letters.length)];

  const validWords: ValidWord[] = [];
  let targetWord: string | null = null;

  for (const w of allWords) {
    if (w.length < 4) continue;
    const wordLetters = new Set(w.word.split(''));
    if ([...wordLetters].some((l) => !lettersSet.has(l))) continue;
    if (!w.word.includes(centerLetter)) continue;

    const wordCounts: Record<string, number> = {};
    for (const c of w.word.split('')) wordCounts[c] = (wordCounts[c] || 0) + 1;
    let canForm = true;
    for (const [c, cnt] of Object.entries(wordCounts)) {
      if (!selected.letterCounts[c] || selected.letterCounts[c] < cnt) {
        canForm = false;
        break;
      }
    }
    if (!canForm) continue;

    const isTargetWord = w.length === 9 && wordLetters.size === 9;
    if (isTargetWord) targetWord = w.word;
    validWords.push({ word: w.word, isTargetWord });
  }

  if (validWords.length < 20 || !targetWord) return null;

  return {
    letters: selected.letters,
    centerLetter,
    letterCounts: selected.letterCounts,
    validWords,
    targetWord,
  };
}

export default function NineLetter() {
  const [puzzle, setPuzzle] = useState<{
    letters: string;
    centerLetter: string;
    letterCounts: Record<string, number>;
    validWords: ValidWord[];
    targetWord: string;
  } | null>(null);
  const [validWords, setValidWords] = useState<Map<string, ValidWord>>(
    new Map(),
  );
  const [foundWords, setFoundWords] = useState<Set<string>>(new Set());
  const [currentInput, setCurrentInput] = useState('');
  const [inputIndices, setInputIndices] = useState<number[]>([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentGameId, setCurrentGameId] = useState<string | null>(null);
  const [hints, setHints] = useState<string[]>([]);
  const [showHints, setShowHints] = useState(false);
  const [usedIndices, setUsedIndices] = useState<Set<number>>(new Set());
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
      const savedGame = gameDb.target.findById(urlGameId);

      if (savedGame) {
        const foundWordsParsed = JSON.parse(savedGame.foundWordsJson || '[]');
        setFoundWords(new Set(foundWordsParsed));

        const lettersSet = new Set(savedGame.letters.split(''));
        const letterCounts = JSON.parse(savedGame.letterCounts);
        const validWordsList: ValidWord[] = [];

        for (const w of allWords) {
          if (w.length < 4) continue;
          const wordLetters = new Set(w.word.split(''));
          if ([...wordLetters].some((l) => !lettersSet.has(l))) continue;
          if (!w.word.includes(savedGame.centerLetter)) continue;

          const wordCounts: Record<string, number> = {};
          for (const c of w.word.split(''))
            wordCounts[c] = (wordCounts[c] || 0) + 1;
          let canForm = true;
          for (const [c, cnt] of Object.entries(wordCounts)) {
            if (!letterCounts[c] || letterCounts[c] < cnt) {
              canForm = false;
              break;
            }
          }
          if (!canForm) continue;

          validWordsList.push({
            word: w.word,
            isTargetWord: w.length === 9 && wordLetters.size === 9,
          });
        }

        setPuzzle({
          letters: savedGame.letters,
          centerLetter: savedGame.centerLetter,
          letterCounts,
          validWords: validWordsList,
          targetWord: validWordsList.find((w) => w.isTargetWord)?.word || '',
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

    const newPuzzle = generateTargetPuzzle(allWords);
    if (newPuzzle) {
      setPuzzle(newPuzzle);
      const wordMap = new Map<string, ValidWord>();
      for (const w of newPuzzle.validWords)
        wordMap.set(w.word.toLowerCase(), w);
      setValidWords(wordMap);

      const newGame = gameDb.target.create({
        letters: newPuzzle.letters,
        centerLetter: newPuzzle.centerLetter,
        letterCounts: JSON.stringify(newPuzzle.letterCounts),
        foundWordsJson: '[]',
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
    (words: Set<string>, completed = false, isEndedFlag = false) => {
      if (!currentGameId) return;
      gameDb.target.update(currentGameId, {
        foundWordsJson: JSON.stringify([...words]),
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
    console.log(...withoutCenter.slice(0, 4));
    return [...withoutCenter.slice(0, 4), center, ...withoutCenter.slice(4, 9)];
  }, [puzzle]);

  const handleTileClick = (letter: string, index: number) => {
    if (isEnded) return;
    setCurrentInput((prev) => prev + letter);
    setUsedIndices((prev) => new Set(prev).add(index));
    setInputIndices((prev) => [...prev, index]);
    setMessage('');
  };

  const handleDelete = () => {
    if (isEnded) return;
    setCurrentInput((prev) => prev.slice(0, -1));
    setInputIndices((prev) => {
      const newIndices = prev.slice(0, -1);
      const lastIndex = prev[prev.length - 1];
      if (lastIndex !== undefined) {
        setUsedIndices((prevUsed) => {
          const newUsed = new Set(prevUsed);
          newUsed.delete(lastIndex);
          return newUsed;
        });
      }
      return newIndices;
    });
    setMessage('');
  };

  const handleShuffle = () => {
    if (isEnded) return;
    if (!puzzle) return;
    const letters = displayLetters.filter((l) => l !== puzzle.centerLetter);
    for (let i = letters.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [letters[i], letters[j]] = [letters[j], letters[i]];
    }
    console.log(puzzle.centerLetter);
    setPuzzle((prev) =>
      prev
        ? {
            ...prev,
            letters:
              letters.slice(0, 3).join('') +
              prev.centerLetter +
              letters.slice(3, 8).join(''),
          }
        : null,
    );
  };

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
      const isTarget = wordData.isTargetWord;
      setMessage(
        isTarget
          ? 'TARGET WORD!'
          : `+1 word${word.length === 9 ? ' (9 letters!)' : ''}`,
      );
      const newFoundWords = new Set([...foundWords, word]);
      setFoundWords(newFoundWords);
      saveGame(newFoundWords, newFoundWords.size === validWords.size);
    }
    setCurrentInput('');
    setUsedIndices(new Set());
    setInputIndices([]);
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

  const ACHIEVEMENT_THRESHOLDS = useMemo(
    () => generateAchievementThresholds(validWords.size),
    [validWords.size],
  );
  const achievement = useMemo(() => {
    let result = ACHIEVEMENT_THRESHOLDS[0];
    for (const threshold of ACHIEVEMENT_THRESHOLDS) {
      if (foundWords.size >= threshold.words) result = threshold;
    }
    return result;
  }, [foundWords.size, ACHIEVEMENT_THRESHOLDS]);
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
        <h2 className="text-2xl font-bold">Find the Target Word</h2>
      </div>

      <div className="mb-4">
        <div className="flex items-center gap-1 text-sm">
          {ACHIEVEMENT_THRESHOLDS.map((threshold, i) => (
            <div
              key={threshold.name}
              className={`h-2 w-4 rounded ${
                i <= achievementIndex ? 'bg-orange-400' : 'bg-gray-200'
              }`}
              title={`${threshold.name}: ${threshold.words}+ words`}
            />
          ))}
        </div>
        <span className="text-sm font-medium">{achievement.name}</span>
      </div>

      <div
        className="mb-4 w-full max-w-md overflow-y-auto"
        style={{ maxHeight: '150px' }}
      >
        <div className="flex flex-wrap justify-center gap-2">
          {[...foundWords].sort().map((word) => (
            <button
              key={word}
              onClick={() =>
                setSelectedWord(word === selectedWord ? null : word)
              }
              className={`rounded-full px-2 py-1 text-xs bg-gray-100 text-gray-700 hover:ring-2 hover:ring-blue-400 ${
                selectedWord === word ? 'ring-2 ring-blue-500' : ''
              }`}
            >
              {word.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {selectedWord && (
        <div className="mb-4 rounded-lg bg-blue-50 p-3 text-sm text-blue-800">
          <div className="font-bold">{selectedWord.toUpperCase()}</div>
          <div>{selectedDefinition || 'No definition available'}</div>
        </div>
      )}

      <div
        className={`mb-4 min-h-12 min-w-48 border-2 px-4 py-2 text-center text-lg font-medium ${
          message.includes('TARGET')
            ? 'border-yellow-400 bg-yellow-50'
            : message.includes('+')
              ? 'border-green-400 bg-green-50'
              : 'border-gray-300'
        }`}
      >
        {message || currentInput.toUpperCase()}
      </div>

      <div className="mb-6 grid grid-cols-3 gap-1">
        <Tile
          letter={displayLetters[0]}
          index={0}
          onClick={() => handleTileClick(displayLetters[0], 0)}
          disabled={usedIndices.has(0)}
        />
        <Tile
          letter={displayLetters[1]}
          index={1}
          onClick={() => handleTileClick(displayLetters[1], 1)}
          disabled={usedIndices.has(1)}
        />
        <Tile
          letter={displayLetters[2]}
          index={2}
          onClick={() => handleTileClick(displayLetters[2], 2)}
          disabled={usedIndices.has(2)}
        />
        <Tile
          letter={displayLetters[3]}
          index={3}
          onClick={() => handleTileClick(displayLetters[3], 3)}
          disabled={usedIndices.has(3)}
        />
        <Tile
          letter={displayLetters[4]}
          index={4}
          isCenter
          onClick={() => handleTileClick(displayLetters[4], 4)}
          disabled={usedIndices.has(4)}
        />
        <Tile
          letter={displayLetters[5]}
          index={5}
          onClick={() => handleTileClick(displayLetters[5], 5)}
          disabled={usedIndices.has(5)}
        />
        <Tile
          letter={displayLetters[6]}
          index={6}
          onClick={() => handleTileClick(displayLetters[6], 6)}
          disabled={usedIndices.has(6)}
        />
        <Tile
          letter={displayLetters[7]}
          index={7}
          onClick={() => handleTileClick(displayLetters[7], 7)}
          disabled={usedIndices.has(7)}
        />
        <Tile
          letter={displayLetters[8]}
          index={8}
          onClick={() => handleTileClick(displayLetters[8], 8)}
          disabled={usedIndices.has(8)}
        />
      </div>

      <div className="mb-4 flex gap-2">
        <button
          onClick={handleShuffle}
          className="rounded-md bg-blue-100 px-4 py-2 text-sm font-bold active:bg-blue-200"
        >
          SHUFFLE
        </button>
        <button
          onClick={handleDelete}
          className="rounded-md bg-gray-200 px-4 py-2 text-sm font-bold active:bg-gray-300"
        >
          DELETE
        </button>
        <button
          onClick={handleSubmit}
          className="rounded-md bg-orange-100 px-4 py-2 text-sm font-bold active:bg-orange-200"
        >
          SUBMIT
        </button>
      </div>

      <button
        onClick={handleBackToHome}
        className="mb-4 rounded-md bg-gray-100 px-4 py-2 text-sm font-bold active:bg-gray-200"
      >
        HOME
      </button>
      <button
        onClick={handleGetHints}
        disabled={hintMutation.isPending || isEnded}
        className="mb-4 rounded-md bg-purple-100 px-4 py-2 text-sm font-bold active:bg-purple-200 disabled:opacity-50"
      >
        {hintMutation.isPending ? '...' : 'HINT'}
      </button>
      {!isEnded && (
        <button
          onClick={() => {
            setIsEnded(true);
            saveGame(foundWords, foundWords.size === validWords.size, true);
          }}
          className="mb-4 rounded-md bg-red-100 px-4 py-2 text-sm font-bold active:bg-red-200"
        >
          END GAME
        </button>
      )}

      {currentGameId && (
        <div className="mt-4 text-xs text-gray-400">
          Game ID: {currentGameId.slice(0, 8)}...
        </div>
      )}

      {showHints && hints.length > 0 && (
        <div className="mt-4 w-full max-w-md rounded-lg bg-purple-50 p-4">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="font-bold">Hints</h3>
            <button
              onClick={() => setShowHints(false)}
              className="text-sm text-purple-600 hover:text-purple-800"
            >
              Close
            </button>
          </div>
          <ul className="list-inside space-y-1 text-sm">
            {hints.map((hint, i) => (
              <li key={i}>{hint}</li>
            ))}
          </ul>
        </div>
      )}

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
              setMessage(clue);
            } else {
              setMessage(`No clue found`);
            }
          }}
          className="mt-4 rounded-md bg-green-100 px-4 py-2 text-sm font-bold hover:bg-green-200"
        >
          Show Clue for Random Unfound Word
        </button>
      )}

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
                      wordData?.isTargetWord
                        ? 'bg-orange-200 font-bold text-orange-800'
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

      {puzzle && validWords.size > 0 && (
        <WordDistributionTable
          letters={puzzle.letters}
          centerLetter={puzzle.centerLetter}
          validWords={Array.from(validWords.values())}
        />
      )}

      {puzzle && validWords.size > 0 && (
        <TwoLetterPrefixTable validWords={Array.from(validWords.values())} />
      )}
    </div>
  );
}
