import { createFileRoute } from '@tanstack/react-router';
import { Tile } from '../../components/tile';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { loadWords, getWords } from '../../db/seed';
import { gameDb } from '../../db/games';

export const Route = createFileRoute('/target/nine-letter')({
  component: NineLetter,
});

const ACHIEVEMENT_THRESHOLDS = [
  { name: 'Beginner', words: 0 },
  { name: 'Good Start', words: 5 },
  { name: 'Moving Up', words: 10 },
  { name: 'Good', words: 15 },
  { name: 'Solid', words: 20 },
  { name: 'Nice', words: 25 },
  { name: 'Great', words: 30 },
  { name: 'Amazing', words: 35 },
  { name: 'Genius', words: 40 },
];

type ValidWord = {
  word: string;
  isTargetWord: boolean;
};

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
      });

      setCurrentGameId(newGame.id);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    loadOrCreateGame();
  }, [loadOrCreateGame]);

  const saveGame = useCallback(
    (words: Set<string>, completed = false) => {
      if (!currentGameId) return;
      gameDb.target.update(currentGameId, {
        foundWordsJson: JSON.stringify([...words]),
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
    return [
      ...withoutCenter.slice(0, 3),
      center,
      ...withoutCenter.slice(3, 5),
      ...withoutCenter.slice(5),
    ];
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

  const getCurrentAchievement = () => {
    let achievement = ACHIEVEMENT_THRESHOLDS[0];
    for (const threshold of ACHIEVEMENT_THRESHOLDS) {
      if (foundWords.size >= threshold.words) achievement = threshold;
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
      const isTarget = wordData.isTargetWord;
      setMessage(
        isTarget
          ? 'TARGET WORD!'
          : `+1 word${word.length === 9 ? ' (9 letters!)' : ''}`
      );
      const newFoundWords = new Set([...foundWords, word]);
      setFoundWords(newFoundWords);
      saveGame(newFoundWords, newFoundWords.size === validWords.size);
    }
    setCurrentInput('');
  };

  const handleBackToHome = () => {
    window.location.href = '/';
  };

  const achievement = getCurrentAchievement();
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
        {displayLetters.map((item, index) => {
          if (index === 5) {
            return (
              <Tile
                letter={puzzle.centerLetter}
                index={index}
                isCenter={true}
                onClick={() => handleTileClick(puzzle.centerLetter)}
              />
            );
          } else if (item !== puzzle.centerLetter) {
            return (
              <Tile
                letter={item}
                index={index}
                onClick={() => handleTileClick(item)}
              />
            );
          }
        })}
        <Tile
          letter={displayLetters[0]}
          index={0}
          onClick={() => handleTileClick(displayLetters[0])}
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
                  wordData?.isTargetWord
                    ? 'bg-yellow-400 font-bold text-black'
                    : word.length === 9
                    ? 'bg-orange-400 text-white'
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
