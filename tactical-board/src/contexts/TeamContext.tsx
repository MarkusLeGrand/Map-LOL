import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

const API_BASE_URL = 'http://localhost:8000';

interface TeamMember {
  id: string;
  username: string;
  email: string;
  riot_game_name?: string;
  riot_tag_line?: string;
  role: string;
  joined_at: string;
}

interface Team {
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

interface TeamContextType {
  teams: Team[];
  invites: TeamInvite[];
  scrims: Map<string, Scrim[]>;
  loading: boolean;
  createTeam: (data: CreateTeamData) => Promise<Team | null>;
  getMyTeams: () => Promise<void>;
  getTeam: (teamId: string) => Promise<Team | null>;
  inviteToTeam: (teamId: string, data: CreateInviteData) => Promise<TeamInvite | null>;
  getMyInvites: () => Promise<void>;
  acceptInvite: (inviteId: string) => Promise<Team | null>;
  createScrim: (teamId: string, data: CreateScrimData) => Promise<Scrim | null>;
  getScrims: (teamId: string) => Promise<void>;
  kickMember: (teamId: string, userId: string) => Promise<boolean>;
  promoteToOwner: (teamId: string, userId: string) => Promise<boolean>;
}

const TeamContext = createContext<TeamContextType | undefined>(undefined);

export function TeamProvider({ children }: { children: ReactNode }) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [invites, setInvites] = useState<TeamInvite[]>([]);
  const [scrims, setScrims] = useState<Map<string, Scrim[]>>(new Map());
  const [loading, setLoading] = useState(false);

  const getAuthToken = () => localStorage.getItem('token');

  const createTeam = async (data: CreateTeamData): Promise<Team | null> => {
    const token = getAuthToken();
    if (!token) return null;

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
      console.error('Failed to create team:', error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const getMyTeams = async () => {
    const token = getAuthToken();
    if (!token) return;

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
      console.error('Failed to get teams:', error);
    } finally {
      setLoading(false);
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
      console.error('Failed to get team:', error);
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
      console.error('Failed to invite user:', error);
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
        console.error('Failed to get invites:', response.status, await response.text());
      }
    } catch (error) {
      console.error('Failed to get invites:', error);
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
      console.error('Failed to accept invite:', error);
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
      console.error('Failed to create scrim:', error);
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
      console.error('Failed to get scrims:', error);
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
      console.error('Failed to kick member:', error);
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
      console.error('Failed to promote member:', error);
      return false;
    }
  };

  useEffect(() => {
    const token = getAuthToken();
    if (token) {
      getMyTeams();
      getMyInvites();
    }
  }, []);

  return (
    <TeamContext.Provider
      value={{
        teams,
        invites,
        scrims,
        loading,
        createTeam,
        getMyTeams,
        getTeam,
        inviteToTeam,
        getMyInvites,
        acceptInvite,
        createScrim,
        getScrims,
        kickMember,
        promoteToOwner,
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
