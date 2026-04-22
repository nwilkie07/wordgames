import { createLazyFileRoute } from '@tanstack/react-router';
import { NavigationHeader } from '../components/navigation-header';
import { BackupSettings } from '../components/BackupSettings';
import React, { useState } from 'react';
import { NavArrowDown, NavArrowUp } from 'iconoir-react';

export const Route = createLazyFileRoute('/')({
  component: Index,
});

interface Props {
  label: string;
  onClick?: () => void;
}

export const Button = (props: Props) => {
  return (
    <button
      onClick={props.onClick}
      className={'bg-gray-100 p-4 rounded-md border hover:bg-gray-200'}
    >
      {props.label}
    </button>
  );
};

function Index() {
  const [targetOpen, setTargetOpen] = useState(false);
  const [panagramsOpen, setPanagramsOpen] = useState(false);

  return (
    <div>
      <NavigationHeader />

      <div className="flex gap-2 mx-2 mt-2">
        <a
          href="/history/"
          className="flex-1 block p-3 bg-blue-50 border border-blue-200 rounded-md text-blue-600 hover:bg-blue-100 text-center"
        >
          Panagram History
        </a>
        <a
          href="/target/history/"
          className="flex-1 block p-3 bg-orange-50 border border-orange-200 rounded-md text-orange-600 hover:bg-orange-100 text-center"
        >
          Target History
        </a>
      </div>

      <div className="mx-2 mt-4">
        <BackupSettings />
      </div>
      <div
        className={
          'flex flex-1 bg-gray-100 border-gray-200 border-solid border-2 p-4 m-2 rounded-md justify-around'
        }
      >
        <Button
          label={'7 Letters'}
          onClick={() => {
            window.location.href = '/panagram/seven-letter';
          }}
        />
        <Button
          label={'Target'}
          onClick={() => {
            window.location.href = '/target/nine-letter';
          }}
        />
      </div>
    </div>
  );
}
