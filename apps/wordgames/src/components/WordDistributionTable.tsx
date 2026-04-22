import { useMemo } from 'react';

interface WordDistributionTableProps {
  letters: string;
  centerLetter: string;
  validWords: Array<{ word: string; points?: number }>;
}

export function WordDistributionTable({
  letters,
  centerLetter,
  validWords,
}: WordDistributionTableProps) {
  const distribution = useMemo(() => {
    const letterSet = new Set(letters.split(''));
    const allLengths = [4, 5, 6, 7, 8, 9];
    const wordLengths = allLengths.filter((len) =>
      validWords.some((w) => w.word.length === len),
    );

    const data: Record<string, Record<number, number>> = {};
    for (const letter of letters.split('')) {
      data[letter] = {};
      for (const len of wordLengths) {
        data[letter][len] = 0;
      }
    }

    const columnTotals: Record<number, number> = {};
    for (const len of wordLengths) {
      columnTotals[len] = 0;
    }

    for (const { word } of validWords) {
      const firstLetter = word[0];
      if (
        letterSet.has(firstLetter) &&
        data[firstLetter] &&
        data[firstLetter][word.length] !== undefined
      ) {
        data[firstLetter][word.length]++;
        columnTotals[word.length]++;
      }
    }

    const rowTotals: Record<string, number> = {};
    for (const letter of letters.split('')) {
      rowTotals[letter] = Object.values(data[letter]).reduce(
        (a, b) => a + b,
        0,
      );
    }

    const grandTotal = validWords.length;

    return { data, wordLengths, columnTotals, rowTotals, grandTotal };
  }, [letters, validWords]);

  const { data, wordLengths, columnTotals, rowTotals, grandTotal } =
    distribution;

  const sortedLetters = letters.split('').sort();

  return (
    <div className="mt-4 overflow-x-auto">
      <div className="mb-1 text-sm text-gray-600">
        Count of words starting with each letter, grouped by word length
      </div>
      <table className="border-collapse text-sm w-full">
        <thead>
          <tr>
            <th className="border border-gray-300 bg-gray-100 p-2"></th>
            {wordLengths.map((len) => (
              <th
                key={len}
                className="border border-gray-300 bg-gray-100 p-2 font-bold"
              >
                {len}
              </th>
            ))}
            <th className="border border-gray-300 bg-gray-100 p-2 font-bold">
              ∑
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedLetters.map((letter) => (
            <tr key={letter}>
              <td
                className={`border border-gray-300 p-2 font-bold ${
                  letter === centerLetter ? 'bg-yellow-100' : 'bg-gray-50'
                }`}
              >
                {letter.toUpperCase()}
              </td>
              {wordLengths.map((len) => (
                <td
                  key={len}
                  className="border border-gray-300 p-2 text-center"
                >
                  {data[letter]?.[len] > 0 ? data[letter][len] : '-'}
                </td>
              ))}
              <td className="border border-gray-300 bg-gray-100 p-2 text-center font-bold">
                {rowTotals[letter] ?? 0}
              </td>
            </tr>
          ))}
          <tr>
            <td className="border border-gray-300 bg-gray-100 p-2 font-bold">
              ∑
            </td>
            {wordLengths.map((len) => (
              <td
                key={len}
                className="border border-gray-300 bg-gray-100 p-2 text-center font-bold"
              >
                {columnTotals[len] ?? 0}
              </td>
            ))}
            <td className="border border-gray-300 bg-gray-100 p-2 text-center font-bold">
              {grandTotal}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
