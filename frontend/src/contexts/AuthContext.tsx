import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';

interface User {
  id: string;
  email: string;
  username: string;
  riot_game_name?: string;
  riot_tag_line?: string;
  discord?: string;
  discord_id?: string;
  discord_verified?: boolean;
  favorite_tools: string[];
  theme: string;
  is_admin: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, username: string, password: string, riotGameName?: string, riotTagLine?: string, discord?: string) => Promise<void>;
  logout: () => void;
  toggleFavoriteTool: (toolName: string) => Promise<void>;
  updateUser: (updates: Partial<User>) => void;
  isAuthenticated: boolean;
  isLoading: boolean;
  registerLogoutCallback: (callback: () => void) => void;
  registerLoginCallback: (callback: () => void) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [logoutCallbacks, setLogoutCallbacks] = useState<(() => void)[]>([]);
  const [loginCallbacks, setLoginCallbacks] = useState<(() => void)[]>([]);

  // Load token from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const tokenTimestamp = localStorage.getItem('token_timestamp');

    if (storedToken && tokenTimestamp) {
      // Check if token is expired (24 hours)
      const now = Date.now();
      const tokenAge = now - parseInt(tokenTimestamp);
      const twentyFourHours = 24 * 60 * 60 * 1000;

      if (tokenAge > twentyFourHours) {
        // Token expired - auto logout
        localStorage.removeItem('token');
        localStorage.removeItem('token_timestamp');
        setIsLoading(false);
        return;
      }

      setToken(storedToken);
      fetchUser(storedToken);
    } else {
      setIsLoading(false);
    }
  }, []);

  const fetchUser = async (authToken: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        // Token invalid, clear it
        localStorage.removeItem('token');
        setToken(null);
      }
    } catch (error) {

      localStorage.removeItem('token');
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const formData = new FormData();
    formData.append('username', email); // OAuth2 uses "username" field
    formData.append('password', password);

    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Login failed');
    }

    const data = await response.json();
    const authToken = data.access_token;

    localStorage.setItem('token', authToken);
    localStorage.setItem('token_timestamp', Date.now().toString());
    setToken(authToken);

    await fetchUser(authToken);

    // Call all registered login callbacks (e.g., TeamContext refresh)
    loginCallbacks.forEach(callback => callback());
  };

  const register = async (
    email: string,
    username: string,
    password: string,
    riotGameName?: string,
    riotTagLine?: string,
    discord?: string
  ) => {
    const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        username,
        password,
        riot_game_name: riotGameName,
        riot_tag_line: riotTagLine,
        discord,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Registration failed');
    }

    // Auto-login after registration
    await login(email, password);
  };

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('token_timestamp');
    setToken(null);
    setUser(null);
    // Call all registered logout callbacks (e.g., TeamContext cleanup)
    logoutCallbacks.forEach(callback => callback());
  }, [logoutCallbacks]);

  const registerLogoutCallback = useCallback((callback: () => void) => {
    setLogoutCallbacks(prev => [...prev, callback]);
  }, []);

  const registerLoginCallback = useCallback((callback: () => void) => {
    setLoginCallbacks(prev => [...prev, callback]);
  }, []);

  const updateUser = (updates: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...updates });
    }
  };

  const toggleFavoriteTool = async (toolName: string) => {
    if (!token || !user) return;

    try {
      const currentFavorites = user.favorite_tools || [];
      const newFavorites = currentFavorites.includes(toolName)
        ? currentFavorites.filter(t => t !== toolName)
        : [...currentFavorites, toolName];

      const response = await fetch(`${API_BASE_URL}/api/auth/favorite-tools`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ favorite_tools: newFavorites }),
      });

      if (response.ok) {
        const updatedUser = await response.json();
        setUser(updatedUser);
      }
    } catch (error) {

    }
  };

  const value = {
    user,
    token,
    login,
    register,
    logout,
    toggleFavoriteTool,
    updateUser,
    isAuthenticated: !!user,
    isLoading,
    registerLogoutCallback,
    registerLoginCallback,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
