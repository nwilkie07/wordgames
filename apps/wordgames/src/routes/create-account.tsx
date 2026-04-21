import { createFileRoute } from '@tanstack/react-router';
import React, { useState, FormEvent } from 'react';

export const Route = createFileRoute('/create-account')({
  component: CreateAccount,
});

export default function CreateAccount() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const { initializeApp } = await import('firebase/app');
      const { getAuth, createUserWithEmailAndPassword } =
        await import('firebase/auth');

      const firebaseConfig = {
        apiKey: 'demo-key',
        authDomain: 'demo.firebaseapp.com',
        projectId: 'demo-project',
        storageBucket: 'demo.appspot.com',
        messagingSenderId: '123456789',
        appId: '1:123456789:web:abc123',
      };

      const app = initializeApp(firebaseConfig);
      const auth = getAuth(app);

      await createUserWithEmailAndPassword(auth, email, password);
      window.location.href = '/login';
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : 'Registration failed';
      setError(errorMessage);
    }
  };

  return (
    <div className={'flex flex-1 flex-col justify-center h-lvh'}>
      <div className={'m-auto'}>
        <form onSubmit={onSubmit}>
          <div className={'grid grid-cols-2 gap-4 p-4 bg-gray-200 rounded-lg'}>
            <span>Email</span>
            <input
              className={'border-solid border-2'}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <span>Password</span>
            <input
              className={'border-solid border-2'}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
          <div className={'flex flex-1 gap-4 justify-end p-4'}>
            <button
              type="submit"
              className="bg-blue-500 text-white px-4 py-2 rounded"
            >
              Submit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
