import {createLazyFileRoute} from '@tanstack/react-router';
import {NavigationHeader} from '../components/navigation-header.tsx';
import React, {useState} from 'react';
import {NavArrowDown, NavArrowUp} from 'iconoir-react';
import { trpc } from '../../../api/src/app/client';

export const Route = createLazyFileRoute('/')({
    component: Index
});

interface Props {
    label: string;
}

export const Button = (props: Props) => {
    return (
        <button className={'bg-gray-100 p-4 rounded-md border'}>
            {props.label}
        </button>
    );
};

function Index() {
    const [targetOpen, setTargetOpen] = useState(false);
    const [panagramsOpen, setPanagramsOpen] = useState(false);
    const createTable = trpc.createWordsTable.useMutation();
    return (
        <div>
            <button
                onClick={async () => {
                    await createTable.mutateAsync({});
                }}
            >
                Click to get words
            </button>
            <NavigationHeader />
            <div
                className={
                    'flex flex-1 bg-gray-100 border-gray-200 border-solid border-2 p-4 m-2 rounded-md'
                }
            >
                {targetOpen ? (
                    <NavArrowDown onClick={() => setTargetOpen(false)} />
                ) : (
                    <NavArrowUp onClick={() => setTargetOpen(true)} />
                )}
                <div className={'justify-center flex flex-1'}>
                    <span className={'font-medium text-xl'}>Target</span>
                </div>
            </div>
            {targetOpen && (
                <div className="grid grid-cols-3 gap-4 mx-4">
                    <Button label={'7 Letters'} />
                    <Button label={'8 Letters'} />
                    <Button label={'9 Letters'} />
                </div>
            )}
            <div
                className={
                    'flex flex-1 bg-gray-100 border-gray-200 border-solid border-2 p-4 m-2 rounded-md'
                }
            >
                {panagramsOpen ? (
                    <NavArrowDown onClick={() => setPanagramsOpen(false)} />
                ) : (
                    <NavArrowUp onClick={() => setPanagramsOpen(true)} />
                )}
                <div className={'justify-center flex flex-1'}>
                    <span className={'font-medium text-xl'}>Panagram</span>
                </div>
            </div>
            {panagramsOpen && (
                <div className="grid grid-cols-3 gap-4 mx-4">
                    <Button label={'5 Letters'} />
                    <Button label={'6 Letters'} />
                    <Button label={'7 Letters'} />
                </div>
            )}
        </div>
    );
}
