import { useMemo } from 'react';

interface TwoLetterPrefixTableProps {
  validWords: Array<{ word: string; points?: number }>;
}

export function TwoLetterPrefixTable({
  validWords,
}: TwoLetterPrefixTableProps) {
  const distribution = useMemo(() => {
    const prefixCounts: Record<string, number> = {};

    for (const { word } of validWords) {
      if (word.length >= 2) {
        const prefix = word.substring(0, 2);
        prefixCounts[prefix] = (prefixCounts[prefix] || 0) + 1;
      }
    }

    const sortedPrefixes = Object.keys(prefixCounts).sort();

    return { prefixCounts, sortedPrefixes, totalWords: validWords.length };
  }, [validWords]);

  const { prefixCounts, sortedPrefixes, totalWords } = distribution;

  return (
    <div className="mt-4 overflow-x-auto">
      <div className="mb-2 text-sm font-bold">
        Two-Letter Prefixes ({totalWords} words)
      </div>
      <div className="flex flex-wrap gap-1">
        {sortedPrefixes.map((prefix) => (
          <div
            key={prefix}
            className="flex items-center gap-1 rounded bg-gray-100 px-2 py-1 text-sm"
          >
            <span className="font-bold">{prefix.toUpperCase()}</span>
            <span className="text-gray-500">({prefixCounts[prefix]})</span>
          </div>
        ))}
      </div>
    </div>
  );
}
