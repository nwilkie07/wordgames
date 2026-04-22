import { gameDb, type PanagramGame, type TargetGame } from '../db/games';

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
const SCOPES = 'https://www.googleapis.com/auth/drive.file';

const BACKUP_FOLDER_NAME = 'WordGamesBackup';
const BACKUP_FILE_NAME = 'wordgames-backup.json';

interface BackupData {
  panagramGames: PanagramGame[];
  targetGames: TargetGame[];
  exportedAt: string;
  version: string;
}

function getAccessToken(): string | null {
  return localStorage.getItem('google_access_token');
}

export async function handleGoogleAuth(): Promise<boolean> {
  if (!CLIENT_ID) {
    console.error('Google Client ID not configured');
    return false;
  }

  const redirectUri = window.location.origin + '/auth/google/callback';

  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authUrl.searchParams.set('client_id', CLIENT_ID);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('response_type', 'token');
  authUrl.searchParams.set('scope', SCOPES);
  authUrl.searchParams.set('include_granted_scopes', 'true');

  window.location.href = authUrl.toString();
  return true;
}

export function isAuthenticated(): boolean {
  return !!getAccessToken();
}

export async function exportBackup(): Promise<BackupData> {
  const panagramGames = gameDb.panagram.findAll();
  const targetGames = gameDb.target.findAll();

  return {
    panagramGames,
    targetGames,
    exportedAt: new Date().toISOString(),
    version: '1.0',
  };
}

async function findOrCreateBackupFolder(
  accessToken: string,
): Promise<string | null> {
  const searchResponse = await fetch(
    'https://www.googleapis.com/drive/v3/files?q=name+%3D+%27' +
      encodeURIComponent(BACKUP_FOLDER_NAME) +
      '%27+and+mimeType+%3D+%27application/vnd.google-apps.folder%27&spaces=drive',
    {
      headers: {
        Authorization: 'Bearer ' + accessToken,
      },
    },
  );

  const searchResult = await searchResponse.json();

  if (searchResult.files && searchResult.files.length > 0) {
    return searchResult.files[0].id;
  }

  const createResponse = await fetch(
    'https://www.googleapis.com/drive/v3/files',
    {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + accessToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: BACKUP_FOLDER_NAME,
        mimeType: 'application/vnd.google-apps.folder',
      }),
    },
  );

  const created = await createResponse.json();
  return created.id || null;
}

async function findBackupFile(
  accessToken: string,
  folderId: string,
): Promise<string | null> {
  const response = await fetch(
    'https://www.googleapis.com/drive/v3/files?q=name+%3D+%27' +
      encodeURIComponent(BACKUP_FILE_NAME) +
      '%27+and+%27' +
      folderId +
      '%27+in+parents&spaces=drive',
    {
      headers: {
        Authorization: 'Bearer ' + accessToken,
      },
    },
  );

  const result = await response.json();
  if (result.files && result.files.length > 0) {
    return result.files[0].id;
  }
  return null;
}

export async function uploadToGoogleDrive(): Promise<{
  success: boolean;
  message: string;
}> {
  const accessToken = getAccessToken();
  if (!accessToken) {
    return { success: false, message: 'Not authenticated with Google Drive' };
  }

  try {
    const folderId = await findOrCreateBackupFolder(accessToken);
    if (!folderId) {
      return { success: false, message: 'Failed to create backup folder' };
    }

    const existingFileId = await findBackupFile(accessToken, folderId);
    const backupData = await exportBackup();
    const jsonContent = JSON.stringify(backupData, null, 2);

    const metadata: Record<string, unknown> = {
      name: BACKUP_FILE_NAME,
      parents: [folderId],
    };

    if (existingFileId) {
      metadata['id'] = existingFileId;
    }

    const form = new FormData();
    form.append(
      'metadata',
      new Blob([JSON.stringify(metadata)], { type: 'application/json' }),
    );
    form.append('file', new Blob([jsonContent], { type: 'application/json' }));

    const endpoint = existingFileId
      ? `https://www.googleapis.com/upload/drive/v3/files/${existingFileId}`
      : 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';

    const response = await fetch(endpoint, {
      method: existingFileId ? 'PATCH' : 'POST',
      headers: {
        Authorization: 'Bearer ' + accessToken,
      },
      body: form,
    });

    if (!response.ok) {
      throw new Error('Upload failed');
    }

    return { success: true, message: 'Backup uploaded successfully' };
  } catch (error) {
    return {
      success: false,
      message: 'Upload failed: ' + (error as Error).message,
    };
  }
}

export async function downloadFromGoogleDrive(): Promise<{
  success: boolean;
  message: string;
  data?: BackupData;
}> {
  const accessToken = getAccessToken();
  if (!accessToken) {
    return { success: false, message: 'Not authenticated with Google Drive' };
  }

  try {
    const folderId = await findOrCreateBackupFolder(accessToken);
    if (!folderId) {
      return { success: false, message: 'No backup folder found' };
    }

    const fileId = await findBackupFile(accessToken, folderId);
    if (!fileId) {
      return { success: false, message: 'No backup file found' };
    }

    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
      {
        headers: {
          Authorization: 'Bearer ' + accessToken,
        },
      },
    );

    if (!response.ok) {
      throw new Error('Download failed');
    }

    const data: BackupData = await response.json();
    return { success: true, message: 'Backup downloaded successfully', data };
  } catch (error) {
    return {
      success: false,
      message: 'Download failed: ' + (error as Error).message,
    };
  }
}

export async function restoreFromGoogleDrive(): Promise<{
  success: boolean;
  message: string;
}> {
  const result = await downloadFromGoogleDrive();

  if (!result.success || !result.data) {
    return { success: false, message: result.message };
  }

  const { data } = result;

  for (const game of data.panagramGames) {
    const existing = gameDb.panagram.findById(game.id);
    if (existing) {
      gameDb.panagram.update(game.id, game);
    } else {
      gameDb.panagram.create(game);
    }
  }

  for (const game of data.targetGames) {
    const existing = gameDb.target.findById(game.id);
    if (existing) {
      gameDb.target.update(game.id, game);
    } else {
      gameDb.target.create(game);
    }
  }

  return { success: true, message: 'Games restored successfully' };
}

export function logout() {
  localStorage.removeItem('google_access_token');
}

export function handleAuthCallback(): boolean {
  const hash = window.location.hash;
  if (hash.includes('access_token=')) {
    const params = new URLSearchParams(hash.substring(1));
    const token = params.get('access_token');
    if (token) {
      localStorage.setItem('google_access_token', token);
      window.history.replaceState({}, document.title, window.location.pathname);
      return true;
    }
  }
  return false;
}
