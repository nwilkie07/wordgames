import React from 'react';

interface Props {
    label: string;
}
const Button = (props: Props) => {
    const {label} = props;
    return (
        <button
            className={
                'border-3xl p-4 text-xl hover:bg-orange-400 hover:text-white'
            }
        >
            {label}
        </button>
    );
};

export const NavigationHeader = () => {
    return (
        <div
            className={
                'bg-blue-200 grid grid-cols-3 h-fit border-8 border-white rounded-2xl'
            }
        >
            <span className={'self-center font-bold pl-4'}>Word Games</span>
            <div />
            <div className={'flex flex-1 justify-between'}>
                <Button label={'Games'} />
                <Button label={'Settings'} />
                <Button label={'Profile'} />
            </div>
        </div>
    );
};
