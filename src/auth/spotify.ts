const SPOTIFY_AUTH_URL = 'https://accounts.spotify.com/authorize';
const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token';
const SCOPES = 'user-library-read user-read-private';

function getClientId(): string {
  return import.meta.env.VITE_SPOTIFY_CLIENT_ID ?? '';
}

function getRedirectUri(): string {
  return import.meta.env.VITE_SPOTIFY_REDIRECT_URI ?? window.location.origin;
}

export function hasClientId(): boolean {
  return getClientId().length > 0;
}

/** Generate a random code verifier (43–128 chars) */
function generateVerifier(): string {
  const array = new Uint8Array(64);
  crypto.getRandomValues(array);
  return Array.from(array, (b) =>
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~'[b % 66]
  ).join('');
}

/** SHA-256 hash → base64url */
async function sha256(plain: string): Promise<ArrayBuffer> {
  const encoder = new TextEncoder();
  return crypto.subtle.digest('SHA-256', encoder.encode(plain));
}

function base64url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** Build the full authorization URL and store verifier in sessionStorage */
export async function buildAuthUrl(): Promise<string> {
  const verifier = generateVerifier();
  const challenge = base64url(await sha256(verifier));

  // Store verifier so it survives the redirect
  sessionStorage.setItem('spotify_code_verifier', verifier);

  const params = new URLSearchParams({
    client_id: getClientId(),
    response_type: 'code',
    redirect_uri: getRedirectUri(),
    scope: SCOPES,
    code_challenge_method: 'S256',
    code_challenge: challenge,
  });

  return `${SPOTIFY_AUTH_URL}?${params.toString()}`;
}

/** Exchange authorization code for access token */
export async function exchangeToken(code: string): Promise<{
  access_token: string;
  expires_in: number;
  refresh_token?: string;
}> {
  const verifier = sessionStorage.getItem('spotify_code_verifier');
  if (!verifier) throw new Error('Missing code verifier');

  const body = new URLSearchParams({
    client_id: getClientId(),
    grant_type: 'authorization_code',
    code,
    redirect_uri: getRedirectUri(),
    code_verifier: verifier,
  });

  const res = await fetch(SPOTIFY_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Token exchange failed: ${res.status} ${text}`);
  }

  sessionStorage.removeItem('spotify_code_verifier');
  return res.json();
}

/** Refresh an expired access token */
export async function refreshAccessToken(refreshToken: string): Promise<{
  access_token: string;
  expires_in: number;
  refresh_token?: string;
}> {
  const body = new URLSearchParams({
    client_id: getClientId(),
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
  });

  const res = await fetch(SPOTIFY_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Token refresh failed: ${res.status} ${text}`);
  }

  return res.json();
}

/** Fetch the current user's profile */
export async function fetchProfile(token: string): Promise<{
  display_name: string;
  id: string;
  images: { url: string }[];
}> {
  const res = await fetch('https://api.spotify.com/v1/me', {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Profile fetch failed: ${res.status}`);
  return res.json();
}

/** Spotify API track shape */
export interface SpotifyTrack {
  id: string;
  name: string;
  artists: { name: string }[];
  album: {
    name: string;
    images: { url: string; width: number; height: number }[];
  };
}

/** Fetch the user's liked songs (paginated) */
export async function fetchLikedSongs(
  token: string,
  limit = 50,
  offset = 0
): Promise<{ items: { track: SpotifyTrack }[]; total: number }> {
  const params = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
  });
  const res = await fetch(
    `https://api.spotify.com/v1/me/tracks?${params.toString()}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!res.ok) throw new Error(`Liked songs fetch failed: ${res.status}`);
  return res.json();
}
