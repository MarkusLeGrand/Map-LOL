import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useAuth } from './AuthContext';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface ChampionMastery {
  championId: number;
  championLevel: number;
  championPoints: number;
}

export interface TeamMember {
  id: string;
  username: string;
  email: string;
  riot_game_name?: string;
  riot_tag_line?: string;
  discord?: string;
  role: string;
  joined_at: string;
  // Summoner data
  summoner_level?: string | null;
  profile_icon_id?: string | null;
  solo_tier?: string | null;
  solo_rank?: string | null;
  solo_lp?: string | null;
  preferred_lane?: string | null;
  top_champions?: ChampionMastery[];
}

export interface Team {
  id: string;
  name: string;
  tag?: string;
  description?: string;
  owner_id: string;
  created_at: string;
  team_color: string;
  max_members: string;
  member_count: number;
  members: TeamMember[];
  is_locked?: boolean;
}

interface TeamInvite {
  id: string;
  team_id: string;
  team_name: string;
  invited_user_id: string;
  invited_by_id: string;
  role: string;
  status: string;
  created_at: string;
}

interface JoinRequest {
  id: string;
  team_id: string;
  team_name: string;
  user_id: string;
  username: string;
  user_email: string;
  riot_game_name?: string;
  riot_tag_line?: string;
  message?: string;
  status: string;
  created_at: string;
}

interface Scrim {
  id: string;
  team_id: string;
  opponent_name: string;
  scheduled_at: string;
  duration_minutes: string;
  notes?: string;
  status: string;
  created_at: string;
}

interface CreateTeamData {
  name: string;
  tag?: string;
  description?: string;
  team_color?: string;
}

interface CreateInviteData {
  user_id: string;
  role?: string;
}

interface CreateScrimData {
  opponent_name: string;
  scheduled_at: string;
  duration_minutes?: string;
  notes?: string;
}

interface UpdateTeamData {
  name?: string;
  tag?: string;
  description?: string;
  team_color?: string;
  is_locked?: boolean;
}

interface TeamContextType {
  teams: Team[];
  invites: TeamInvite[];
  joinRequests: JoinRequest[];
  scrims: Map<string, Scrim[]>;
  loading: boolean;
  createTeam: (data: CreateTeamData) => Promise<Team | null>;
  getMyTeams: () => Promise<void>;
  getAllTeams: () => Promise<Team[]>;
  getTeam: (teamId: string) => Promise<Team | null>;
  updateTeam: (teamId: string, data: UpdateTeamData) => Promise<Team | null>;
  inviteToTeam: (teamId: string, data: CreateInviteData) => Promise<TeamInvite | null>;
  getMyInvites: () => Promise<void>;
  acceptInvite: (inviteId: string) => Promise<Team | null>;
  getMyJoinRequests: () => Promise<void>;
  acceptJoinRequest: (requestId: string) => Promise<boolean>;
  rejectJoinRequest: (requestId: string) => Promise<boolean>;
  createScrim: (teamId: string, data: CreateScrimData) => Promise<Scrim | null>;
  getScrims: (teamId: string) => Promise<void>;
  kickMember: (teamId: string, userId: string) => Promise<boolean>;
  promoteToOwner: (teamId: string, userId: string) => Promise<boolean>;
  clearTeamData: () => void;
  requestJoinTeam: (teamId: string, message?: string) => Promise<boolean>;
}

const TeamContext = createContext<TeamContextType | undefined>(undefined);

export function TeamProvider({ children }: { children: ReactNode }) {
  const { registerLogoutCallback, registerLoginCallback } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [invites, setInvites] = useState<TeamInvite[]>([]);
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);
  const [scrims, setScrims] = useState<Map<string, Scrim[]>>(new Map());
  const [loading, setLoading] = useState(false);

  const getAuthToken = () => localStorage.getItem('token');

  const createTeam = async (data: CreateTeamData): Promise<Team | null> => {
    const token = getAuthToken();
    if (!token) {
      return null;
    }

    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/teams/create`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const team = await response.json();
        setTeams(prev => [...prev, team]);
        return team;
      }
      return null;
    } catch (error) {
      return null;
    } finally {
      setLoading(false);
    }
  };

  const getMyTeams = async () => {
    const token = getAuthToken();
    if (!token) {
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/teams/my-teams`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTeams(data);
      }
    } catch (error) {
      // Silently fail
    } finally {
      setLoading(false);
    }
  };

  const getAllTeams = async (): Promise<Team[]> => {
    const token = getAuthToken();
    if (!token) return [];

    try {
      const response = await fetch(`${API_BASE_URL}/api/teams/all`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        return data;
      }
      return [];
    } catch (error) {

      return [];
    }
  };

  const getTeam = async (teamId: string): Promise<Team | null> => {
    const token = getAuthToken();
    if (!token) return null;

    try {
      const response = await fetch(`${API_BASE_URL}/api/teams/${teamId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch (error) {

      return null;
    }
  };

  const updateTeam = async (teamId: string, data: UpdateTeamData): Promise<Team | null> => {
    const token = getAuthToken();
    if (!token) return null;

    try {
      const response = await fetch(`${API_BASE_URL}/api/teams/${teamId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const updatedTeam = await response.json();
        // Update the team in the local state
        setTeams(prev => prev.map(team => team.id === teamId ? updatedTeam : team));
        return updatedTeam;
      }
      return null;
    } catch (error) {

      return null;
    }
  };

  const inviteToTeam = async (teamId: string, data: CreateInviteData): Promise<TeamInvite | null> => {
    const token = getAuthToken();
    if (!token) return null;

    try {
      const response = await fetch(`${API_BASE_URL}/api/teams/${teamId}/invite`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch (error) {

      return null;
    }
  };

  const getMyInvites = async () => {
    const token = getAuthToken();
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/teams/invites`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setInvites(data);
      } else {

      }
    } catch (error) {

    }
  };

  const acceptInvite = async (inviteId: string): Promise<Team | null> => {
    const token = getAuthToken();
    if (!token) return null;

    try {
      const response = await fetch(`${API_BASE_URL}/api/teams/invites/${inviteId}/accept`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const team = await response.json();
        setTeams(prev => [...prev, team]);
        setInvites(prev => prev.filter(inv => inv.id !== inviteId));
        return team;
      }
      return null;
    } catch (error) {

      return null;
    }
  };

  const createScrim = async (teamId: string, data: CreateScrimData): Promise<Scrim | null> => {
    const token = getAuthToken();
    if (!token) return null;

    try {
      const response = await fetch(`${API_BASE_URL}/api/scrims/create?team_id=${teamId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const scrim = await response.json();
        setScrims(prev => {
          const teamScrims = prev.get(teamId) || [];
          const updated = new Map(prev);
          updated.set(teamId, [...teamScrims, scrim]);
          return updated;
        });
        return scrim;
      }
      return null;
    } catch (error) {

      return null;
    }
  };

  const getScrims = async (teamId: string) => {
    const token = getAuthToken();
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/scrims/team/${teamId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setScrims(prev => {
          const updated = new Map(prev);
          updated.set(teamId, data);
          return updated;
        });
      }
    } catch (error) {

    }
  };

  const kickMember = async (teamId: string, userId: string): Promise<boolean> => {
    const token = getAuthToken();
    if (!token) return false;

    try {
      const response = await fetch(`${API_BASE_URL}/api/teams/${teamId}/kick/${userId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        // Refresh team data to update members list
        await getMyTeams();
        return true;
      }
      return false;
    } catch (error) {

      return false;
    }
  };

  const promoteToOwner = async (teamId: string, userId: string): Promise<boolean> => {
    const token = getAuthToken();
    if (!token) return false;

    try {
      const response = await fetch(`${API_BASE_URL}/api/teams/${teamId}/promote/${userId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        // Refresh team data to update owner
        await getMyTeams();
        return true;
      }
      return false;
    } catch (error) {

      return false;
    }
  };

  const clearTeamData = () => {
    setTeams([]);
    setInvites([]);
    setJoinRequests([]);
    setScrims(new Map());
  };

  const requestJoinTeam = async (teamId: string, message?: string): Promise<boolean> => {
    const token = getAuthToken();
    if (!token) return false;

    try {
      const response = await fetch(`${API_BASE_URL}/api/teams/${teamId}/request-join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ message: message || null }),
      });

      if (response.ok) {
        return true;
      }

      // Handle error responses
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to send request');
    } catch (error) {

      throw error;
    }
  };

  const getMyJoinRequests = async () => {
    const token = getAuthToken();
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/teams/join-requests/mine`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setJoinRequests(data);
      }
    } catch (error) {

    }
  };

  const acceptJoinRequest = async (requestId: string): Promise<boolean> => {
    const token = getAuthToken();
    if (!token) return false;

    try {
      const response = await fetch(`${API_BASE_URL}/api/teams/join-requests/${requestId}/accept`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        // Refresh join requests and teams
        await getMyJoinRequests();
        await getMyTeams();
        return true;
      }
      return false;
    } catch (error) {

      return false;
    }
  };

  const rejectJoinRequest = async (requestId: string): Promise<boolean> => {
    const token = getAuthToken();
    if (!token) return false;

    try {
      const response = await fetch(`${API_BASE_URL}/api/teams/join-requests/${requestId}/reject`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        // Refresh join requests
        await getMyJoinRequests();
        return true;
      }
      return false;
    } catch (error) {

      return false;
    }
  };

  // Register callbacks with AuthContext on mount
  useEffect(() => {
    registerLogoutCallback(clearTeamData);
    registerLoginCallback(() => {
      // Refresh teams, invites and join requests on login
      getMyTeams();
      getMyInvites();
      getMyJoinRequests();
    });
  }, [registerLogoutCallback, registerLoginCallback]);

  // Reset teams and invites when token changes (login/logout)
  useEffect(() => {
    const token = getAuthToken();
    if (token) {
      getMyTeams();
      getMyInvites();
      getMyJoinRequests();
    } else {
      // Clear state when logged out
      clearTeamData();
    }
  }, []); // This runs once on mount

  // Listen to storage events for logout/login from other tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'token') {
        const newToken = e.newValue;
        if (newToken) {
          // New login detected
          getMyTeams();
          getMyInvites();
          getMyJoinRequests();
        } else {
          // Logout detected
          setTeams([]);
          setInvites([]);
          setJoinRequests([]);
          setScrims(new Map());
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Poll for new invites and join requests every 30 seconds
  useEffect(() => {
    const token = getAuthToken();
    if (!token) return;

    const interval = setInterval(() => {
      getMyInvites();
      getMyJoinRequests();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <TeamContext.Provider
      value={{
        teams,
        invites,
        joinRequests,
        scrims,
        loading,
        createTeam,
        getMyTeams,
        getAllTeams,
        getTeam,
        updateTeam,
        inviteToTeam,
        getMyInvites,
        acceptInvite,
        getMyJoinRequests,
        acceptJoinRequest,
        rejectJoinRequest,
        createScrim,
        getScrims,
        kickMember,
        promoteToOwner,
        clearTeamData,
        requestJoinTeam,
      }}
    >
      {children}
    </TeamContext.Provider>
  );
}

export function useTeam() {
  const context = useContext(TeamContext);
  if (context === undefined) {
    throw new Error('useTeam must be used within a TeamProvider');
  }
  return context;
}
