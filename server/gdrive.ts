import { db } from '../src/db/index.ts';
import { settings } from '../src/db/schema.ts';
import { eq } from 'drizzle-orm';

// Refresh Google Drive Access Token using stored Client ID, Client Secret, and Refresh Token
export async function getDriveAccessToken(clientId: string, clientSecret: string, refreshToken: string): Promise<string> {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Failed to refresh Google Drive access token: ${errText}`);
  }
  const data = await response.json();
  return data.access_token;
}

// Generate Google Drive OAuth2 Auth URL for Admin authentication
export function getDriveAuthUrl(clientId: string, redirectUri: string): string {
  const rootUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
  const options = {
    redirect_uri: redirectUri,
    client_id: clientId,
    access_type: 'offline',
    response_type: 'code',
    prompt: 'consent',
    scope: 'https://www.googleapis.com/auth/drive.file',
  };
  return `${rootUrl}?${new URLSearchParams(options).toString()}`;
}

// Exchange Auth Code for Refresh Token
export async function exchangeCodeForRefreshToken(
  clientId: string,
  clientSecret: string,
  code: string,
  redirectUri: string
): Promise<string> {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  });
  if (!response.ok) {
    throw new Error(`Failed to exchange code: ${await response.text()}`);
  }
  const data = await response.json();
  if (!data.refresh_token) {
    // Fallback: if user already authorized, some services might not send refresh token unless forced
    throw new Error('No refresh token returned. Make sure to delete application access in Google Account Settings and retry to force consent.');
  }
  return data.refresh_token;
}

// Upload a file to Google Drive using multipart upload
export async function uploadFileToDrive(
  accessToken: string,
  fileName: string,
  mimeType: string,
  base64Data: string,
  folderId?: string
): Promise<{ id: string; name: string }> {
  const buffer = Buffer.from(base64Data, 'base64');
  const boundary = 'gdrive_upload_boundary_' + Date.now();
  
  const metadata = {
    name: fileName,
    parents: folderId && folderId.trim() !== '' ? [folderId.trim()] : undefined,
  };

  const metadataPart = [
    `--${boundary}`,
    'Content-Type: application/json; charset=UTF-8',
    '',
    JSON.stringify(metadata),
    ''
  ].join('\r\n');

  const filePartHeader = [
    `--${boundary}`,
    `Content-Type: ${mimeType || 'application/octet-stream'}`,
    '',
    ''
  ].join('\r\n');

  const filePartFooter = `\r\n--${boundary}--`;

  const bodyBuffer = Buffer.concat([
    Buffer.from(metadataPart),
    Buffer.from(filePartHeader),
    buffer,
    Buffer.from(filePartFooter)
  ]);

  const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': `multipart/related; boundary=${boundary}`,
      'Content-Length': String(bodyBuffer.length)
    },
    body: bodyBuffer
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Failed to upload file to Google Drive: ${errText}`);
  }

  const fileData = await response.json();
  return {
    id: fileData.id,
    name: fileData.name || fileName
  };
}

// Download file content from Google Drive
export async function downloadFileFromDrive(
  accessToken: string,
  fileId: string
): Promise<{ buffer: Buffer; contentType: string; name: string }> {
  // Get file metadata first
  const metaRes = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!metaRes.ok) {
    throw new Error(`Failed to fetch file metadata: ${await metaRes.text()}`);
  }
  const meta = await metaRes.json();

  // Get file content
  const contentRes = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!contentRes.ok) {
    throw new Error(`Failed to download file media: ${await contentRes.text()}`);
  }
  
  const arrayBuffer = await contentRes.arrayBuffer();
  return {
    buffer: Buffer.from(arrayBuffer),
    contentType: meta.mimeType || 'application/octet-stream',
    name: meta.name || 'file'
  };
}

// Delete a file from Google Drive
export async function deleteFileFromDrive(fileId: string): Promise<boolean> {
  if (!fileId) return false;
  try {
    const results = await db.select().from(settings).where(eq(settings.id, 1));
    const currentSettings = results[0];
    if (
      !currentSettings ||
      !currentSettings.gdriveEnabled ||
      !currentSettings.gdriveClientId ||
      !currentSettings.gdriveClientSecret ||
      !currentSettings.gdriveRefreshToken
    ) {
      return false; // GDrive not configured or enabled
    }

    const accessToken = await getDriveAccessToken(
      currentSettings.gdriveClientId,
      currentSettings.gdriveClientSecret,
      currentSettings.gdriveRefreshToken
    );

    const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      if (response.status === 404) {
        // File already deleted or doesn't exist
        return true;
      }
      const errText = await response.text();
      console.error(`Failed to delete file ${fileId} from Google Drive: ${errText}`);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Error in deleteFileFromDrive:', err);
    return false;
  }
}

