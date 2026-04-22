import { useState, useEffect } from 'react';
import {
  handleGoogleAuth,
  isAuthenticated,
  uploadToGoogleDrive,
  downloadFromGoogleDrive,
  restoreFromGoogleDrive,
  logout,
} from '../lib/googleDrive';
import { gameDb } from '../db/games';

export function BackupSettings() {
  const [authenticated, setAuthenticated] = useState(false);
  const [status, setStatus] = useState('');
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    setAuthenticated(isAuthenticated());
  }, []);

  const handleAuth = async () => {
    await handleGoogleAuth();
  };

  const handleLogout = () => {
    logout();
    setAuthenticated(false);
    setStatus('Logged out');
  };

  const handleUpload = async () => {
    if (!authenticated) {
      setStatus('Please connect Google Drive first');
      return;
    }
    setSyncing(true);
    setStatus('Uploading backup...');
    const result = await uploadToGoogleDrive();
    setStatus(result.message);
    setSyncing(false);
  };

  const handleRestore = async () => {
    if (!authenticated) {
      setStatus('Please connect Google Drive first');
      return;
    }
    setSyncing(true);
    setStatus('Downloading and restoring...');
    const result = await restoreFromGoogleDrive();
    setStatus(result.message);
    setSyncing(false);
  };

  const handleExportLocal = () => {
    const panagram = gameDb.panagram.findAll();
    const target = gameDb.target.findAll();
    const data = {
      panagramGames: panagram,
      targetGames: target,
      exportedAt: new Date().toISOString(),
      version: '1.0',
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wordgames-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setStatus('Local backup downloaded');
  };

  const handleImportLocal = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const text = await file.text();
      try {
        const data = JSON.parse(text);
        for (const game of data.panagramGames || []) {
          const existing = gameDb.panagram.findById(game.id);
          if (existing) {
            gameDb.panagram.update(game.id, game);
          } else {
            gameDb.panagram.create(game);
          }
        }
        for (const game of data.targetGames || []) {
          const existing = gameDb.target.findById(game.id);
          if (existing) {
            gameDb.target.update(game.id, game);
          } else {
            gameDb.target.create(game);
          }
        }
        setStatus('Local backup restored successfully');
        window.location.reload();
      } catch {
        setStatus('Failed to parse backup file');
      }
    };
    input.click();
  };

  return (
    <div className="rounded-lg border p-4">
      <h2 className="mb-4 text-xl font-bold">Backup & Sync</h2>

      <div className="mb-4 flex flex-col gap-2">
        {authenticated ? (
          <>
            <span className="text-sm text-green-600">
              Connected to Google Drive
            </span>
            <div className="flex gap-2">
              <button
                onClick={handleUpload}
                disabled={syncing}
                className="rounded-md bg-blue-100 px-4 py-2 text-sm font-bold hover:bg-blue-200 disabled:opacity-50"
              >
                Upload Backup
              </button>
              <button
                onClick={handleRestore}
                disabled={syncing}
                className="rounded-md bg-green-100 px-4 py-2 text-sm font-bold hover:bg-green-200 disabled:opacity-50"
              >
                Restore from Drive
              </button>
              <button
                onClick={handleLogout}
                className="rounded-md bg-gray-100 px-4 py-2 text-sm font-bold hover:bg-gray-200"
              >
                Disconnect
              </button>
            </div>
          </>
        ) : (
          <button
            onClick={handleAuth}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700"
          >
            Connect Google Drive
          </button>
        )}
      </div>

      <div className="border-t pt-4">
        <span className="mb-2 block text-sm font-medium">Local Backup</span>
        <div className="flex gap-2">
          <button
            onClick={handleExportLocal}
            className="rounded-md bg-gray-100 px-4 py-2 text-sm font-bold hover:bg-gray-200"
          >
            Export
          </button>
          <button
            onClick={handleImportLocal}
            className="rounded-md bg-gray-100 px-4 py-2 text-sm font-bold hover:bg-gray-200"
          >
            Import
          </button>
        </div>
      </div>

      {status && (
        <div className="mt-4 rounded-md bg-blue-50 p-2 text-sm text-blue-700">
          {status}
        </div>
      )}
    </div>
  );
}
