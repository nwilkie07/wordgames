import {createFileRoute} from '@tanstack/react-router';
import {Tile} from '../../components/tile.tsx';
import React, {useState} from 'react';

export const Route = createFileRoute('/target/nine-letter')({
    component: NineLetter
});

export default function NineLetter() {
    const strArray = Array.of('A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I');
    const [value, setValue] = useState('');
    const [wordList, setWordList] = useState<string[]>(['Head, Hide, Bead']);
    return (
        <div className={'flex flex-1 flex-col items-center'}>
            <div className={'flex flex-1 flex-col border-orange-100'}>
                {wordList.map((word, i) => (
                    <span key={i}>{word}</span>
                ))}
            </div>
            <span
                className={
                    'm-2 border-gray-100 border-2 px-4 py-2 min-w-40 min-h-12 text-center'
                }
            >
                {value}
            </span>
            <div className={'grid grid-cols-3 grid-rows-3'}>
                {strArray.map((letter, i) => (
                    <Tile
                        letter={letter}
                        index={i}
                        onClick={() => setValue(value + letter)}
                    />
                ))}
            </div>
            <button
                className={
                    'm-2 h-12 w-36 rounded-md bg-orange-100 drop-shadow-md active:drop-shadow-none'
                }
                onClick={() => setValue('')}
            >
                Submit
            </button>
        </div>
    );
}
