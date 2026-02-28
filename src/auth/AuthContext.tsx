import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import { buildAuthUrl, exchangeToken, refreshAccessToken, fetchProfile, hasClientId } from './spotify';

interface User {
  displayName: string;
  id: string;
  avatarUrl?: string;
}

interface AuthState {
  status: 'loading' | 'unauthenticated' | 'authenticated';
  token: string | null;
  user: User | null;
  login: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

const KEYS = {
  accessToken: 'spotify_access_token',
  refreshToken: 'spotify_refresh_token',
  tokenExpiry: 'spotify_token_expiry',
  user: 'spotify_user',
} as const;

function saveAuthToStorage(
  accessToken: string,
  refreshToken: string | undefined,
  expiresIn: number,
  user: User,
) {
  localStorage.setItem(KEYS.accessToken, accessToken);
  if (refreshToken) localStorage.setItem(KEYS.refreshToken, refreshToken);
  localStorage.setItem(KEYS.tokenExpiry, String(Date.now() + expiresIn * 1000));
  localStorage.setItem(KEYS.user, JSON.stringify(user));
}

function loadAuthFromStorage(): {
  accessToken: string;
  refreshToken: string | null;
  expiry: number;
  user: User;
} | null {
  const accessToken = localStorage.getItem(KEYS.accessToken);
  const userJson = localStorage.getItem(KEYS.user);
  const expiry = localStorage.getItem(KEYS.tokenExpiry);
  if (!accessToken || !userJson || !expiry) return null;
  try {
    return {
      accessToken,
      refreshToken: localStorage.getItem(KEYS.refreshToken),
      expiry: Number(expiry),
      user: JSON.parse(userJson),
    };
  } catch {
    return null;
  }
}

function clearAuthFromStorage() {
  localStorage.removeItem(KEYS.accessToken);
  localStorage.removeItem(KEYS.refreshToken);
  localStorage.removeItem(KEYS.tokenExpiry);
  localStorage.removeItem(KEYS.user);
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthState['status']>('loading');
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');

    // Branch 1: OAuth callback
    if (code && hasClientId()) {
      exchangeToken(code)
        .then(async (data) => {
          const profile = await fetchProfile(data.access_token);
          const u: User = {
            displayName: profile.display_name,
            id: profile.id,
            avatarUrl: profile.images?.[0]?.url,
          };
          saveAuthToStorage(data.access_token, data.refresh_token, data.expires_in, u);
          setToken(data.access_token);
          setUser(u);
          setStatus('authenticated');
        })
        .catch((err) => {
          console.error('Auth callback failed:', err);
          setStatus('unauthenticated');
        })
        .finally(() => {
          window.history.replaceState({}, '', window.location.pathname);
        });
      return;
    }

    // Branch 2 & 3: Check localStorage
    const stored = loadAuthFromStorage();
    if (!stored) {
      setStatus('unauthenticated');
      return;
    }

    const tokenStillValid = stored.expiry > Date.now() + 60_000; // 1 min buffer

    if (tokenStillValid) {
      // Branch 2: Valid token in storage
      setToken(stored.accessToken);
      setUser(stored.user);
      setStatus('authenticated');
    } else if (stored.refreshToken) {
      // Branch 3: Expired token, try refresh
      refreshAccessToken(stored.refreshToken)
        .then(async (data) => {
          const profile = await fetchProfile(data.access_token);
          const u: User = {
            displayName: profile.display_name,
            id: profile.id,
            avatarUrl: profile.images?.[0]?.url,
          };
          saveAuthToStorage(
            data.access_token,
            data.refresh_token ?? stored.refreshToken!,
            data.expires_in,
            u,
          );
          setToken(data.access_token);
          setUser(u);
          setStatus('authenticated');
        })
        .catch((err) => {
          console.error('Token refresh failed:', err);
          clearAuthFromStorage();
          setStatus('unauthenticated');
        });
    } else {
      clearAuthFromStorage();
      setStatus('unauthenticated');
    }
  }, []);

  const login = useCallback(async () => {
    if (!hasClientId()) {
      console.warn('VITE_SPOTIFY_CLIENT_ID not set');
      return;
    }
    const url = await buildAuthUrl();
    window.location.href = url;
  }, []);

  const logout = useCallback(() => {
    clearAuthFromStorage();
    setToken(null);
    setUser(null);
    setStatus('unauthenticated');
  }, []);

  return (
    <AuthContext.Provider value={{ status, token, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
