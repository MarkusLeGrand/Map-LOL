import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Header } from '../../components/layout/Header';
import { Footer } from '../../components/layout/Footer';
import { COLORS } from '../../constants/theme';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface AdminStats {
  total_users: number;
  total_teams: number;
  total_scrims: number;
  active_users_7d: number;
  new_users_7d: number;
  tool_usage: Record<string, number>;
  users_by_date: Array<{ date: string; count: number }>;
}

interface User {
  id: string;
  email: string;
  username: string;
  riot_game_name: string | null;
  riot_tag_line: string | null;
  created_at: string;
  last_login: string | null;
  is_active: boolean;
  is_admin: boolean;
  favorite_tools: string[];
  teams_count: number;
}

interface Team {
  id: string;
  name: string;
  tag: string | null;
  description: string | null;
  team_color: string;
  created_at: string;
  owner_id: string;
  member_count: number;
  scrim_count: number;
}

export default function AdminPage() {
  const { user, token } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [activeTab, setActiveTab] = useState<'stats' | 'users' | 'teams'>('stats');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Redirect if not admin
  useEffect(() => {
    if (!user?.is_admin) {
      navigate('/');
    }
  }, [user, navigate]);

  // Fetch stats
  useEffect(() => {
    if (!token || !user?.is_admin) return;

    const fetchStats = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/admin/stats`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {

      }
    };

    fetchStats();
  }, [token, user]);

  // Fetch users
  useEffect(() => {
    if (!token || !user?.is_admin || activeTab !== 'users') return;

    const fetchUsers = async () => {
      setLoading(true);
      try {
        const url = new URL(`${API_BASE_URL}/api/admin/users`);
        if (searchQuery) {
          url.searchParams.append('search', searchQuery);
        }

        const response = await fetch(url.toString(), {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setUsers(data.users);
        }
      } catch (error) {

      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(fetchUsers, 300);
    return () => clearTimeout(debounce);
  }, [token, user, activeTab, searchQuery]);

  // Fetch teams
  useEffect(() => {
    if (!token || !user?.is_admin || activeTab !== 'teams') return;

    const fetchTeams = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${API_BASE_URL}/api/admin/teams`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setTeams(data.teams);
        }
      } catch (error) {

      } finally {
        setLoading(false);
      }
    };

    fetchTeams();
  }, [token, user, activeTab]);

  const handleToggleUserActive = async (userId: string) => {
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/users/${userId}/toggle-active`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        // Refresh users
        setUsers(users.map(u =>
          u.id === userId ? { ...u, is_active: !u.is_active } : u
        ));
      }
    } catch (error) {

    }
  };

  const handleDeleteUser = async (userId: string, username: string) => {
    if (!token || !confirm(`Delete user "${username}"? This action cannot be undone.`)) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setUsers(users.filter(u => u.id !== userId));
      }
    } catch (error) {

    }
  };

  const handleDeleteTeam = async (teamId: string, teamName: string) => {
    if (!token || !confirm(`Delete team "${teamName}"? This action cannot be undone.`)) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/teams/${teamId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setTeams(teams.filter(t => t.id !== teamId));
      }
    } catch (error) {

    }
  };

  if (!user?.is_admin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#0E0E0E] flex flex-col">
      <Header />

      <main className="flex-1 py-12">
        <div className="max-w-7xl mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-[#F5F5F5] mb-2">Admin Dashboard</h1>
            <p className="text-[#F5F5F5]/60">Manage users, teams, and view platform statistics</p>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 mb-8 border-b border-[#F5F5F5]/10">
            <button
              onClick={() => setActiveTab('stats')}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === 'stats'
                  ? 'text-[#F5F5F5] border-b-2 border-[#F5F5F5]'
                  : 'text-[#F5F5F5]/60 hover:text-[#F5F5F5]/80'
              }`}
            >
              Statistics
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === 'users'
                  ? 'text-[#F5F5F5] border-b-2 border-[#F5F5F5]'
                  : 'text-[#F5F5F5]/60 hover:text-[#F5F5F5]/80'
              }`}
            >
              Users ({stats?.total_users || 0})
            </button>
            <button
              onClick={() => setActiveTab('teams')}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === 'teams'
                  ? 'text-[#F5F5F5] border-b-2 border-[#F5F5F5]'
                  : 'text-[#F5F5F5]/60 hover:text-[#F5F5F5]/80'
              }`}
            >
              Teams ({stats?.total_teams || 0})
            </button>
          </div>

          {/* Stats Tab */}
          {activeTab === 'stats' && stats && (
            <div className="space-y-6">
              {/* Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-[#F5F5F5]/[0.03] border border-[#F5F5F5]/10 p-6 rounded-lg">
                  <div className="text-[#F5F5F5]/60 text-sm mb-2">Total Users</div>
                  <div className="text-4xl font-bold text-[#F5F5F5]">{stats.total_users}</div>
                  <div className="text-[#F5F5F5]/40 text-xs mt-2">
                    +{stats.new_users_7d} this week
                  </div>
                </div>

                <div className="bg-[#F5F5F5]/[0.03] border border-[#F5F5F5]/10 p-6 rounded-lg">
                  <div className="text-[#F5F5F5]/60 text-sm mb-2">Active Users (7d)</div>
                  <div className="text-4xl font-bold text-[#F5F5F5]">{stats.active_users_7d}</div>
                  <div className="text-[#F5F5F5]/40 text-xs mt-2">
                    {((stats.active_users_7d / stats.total_users) * 100).toFixed(1)}% of total
                  </div>
                </div>

                <div className="bg-[#F5F5F5]/[0.03] border border-[#F5F5F5]/10 p-6 rounded-lg">
                  <div className="text-[#F5F5F5]/60 text-sm mb-2">Total Teams</div>
                  <div className="text-4xl font-bold text-[#F5F5F5]">{stats.total_teams}</div>
                  <div className="text-[#F5F5F5]/40 text-xs mt-2">
                    {stats.total_scrims} scrims total
                  </div>
                </div>
              </div>

              {/* Tool Usage */}
              <div className="bg-[#F5F5F5]/[0.03] border border-[#F5F5F5]/10 p-6 rounded-lg">
                <h3 className="text-[#F5F5F5] text-xl font-bold mb-4">Popular Tools</h3>
                <div className="space-y-3">
                  {Object.entries(stats.tool_usage).map(([tool, count]) => (
                    <div key={tool} className="flex items-center justify-between">
                      <span className="text-[#F5F5F5]/80">{tool}</span>
                      <div className="flex items-center gap-3">
                        <div className="w-48 bg-[#F5F5F5]/10 rounded-full h-2">
                          <div
                            className="h-2 rounded-full"
                            style={{
                              width: `${(count / stats.total_users) * 100}%`,
                              backgroundColor: COLORS.primary
                            }}
                          />
                        </div>
                        <span className="text-[#F5F5F5]/60 text-sm w-12 text-right">
                          {count} users
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <div>
              {/* Search */}
              <div className="mb-6">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search users by username or email..."
                  className="w-full bg-[#F5F5F5]/[0.03] border border-[#F5F5F5]/20 text-[#F5F5F5] px-4 py-3 rounded focus:outline-none focus:border-[#F5F5F5]/40"
                />
              </div>

              {/* Users Table */}
              <div className="bg-[#F5F5F5]/[0.03] border border-[#F5F5F5]/10 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[#F5F5F5]/10">
                        <th className="text-left px-6 py-4 text-[#F5F5F5]/60 text-sm font-medium">User</th>
                        <th className="text-left px-6 py-4 text-[#F5F5F5]/60 text-sm font-medium">Riot Account</th>
                        <th className="text-left px-6 py-4 text-[#F5F5F5]/60 text-sm font-medium">Created</th>
                        <th className="text-left px-6 py-4 text-[#F5F5F5]/60 text-sm font-medium">Last Login</th>
                        <th className="text-left px-6 py-4 text-[#F5F5F5]/60 text-sm font-medium">Teams</th>
                        <th className="text-left px-6 py-4 text-[#F5F5F5]/60 text-sm font-medium">Status</th>
                        <th className="text-left px-6 py-4 text-[#F5F5F5]/60 text-sm font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u) => (
                        <tr key={u.id} className="border-b border-[#F5F5F5]/5 hover:bg-[#F5F5F5]/[0.02]">
                          <td className="px-6 py-4">
                            <div>
                              <div className="text-[#F5F5F5] font-medium">{u.username}</div>
                              <div className="text-[#F5F5F5]/40 text-sm">{u.email}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-[#F5F5F5]/80">
                            {u.riot_game_name && u.riot_tag_line
                              ? `${u.riot_game_name}#${u.riot_tag_line}`
                              : '-'}
                          </td>
                          <td className="px-6 py-4 text-[#F5F5F5]/80 text-sm">
                            {new Date(u.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 text-[#F5F5F5]/80 text-sm">
                            {u.last_login ? new Date(u.last_login).toLocaleDateString() : 'Never'}
                          </td>
                          <td className="px-6 py-4 text-[#F5F5F5]/80">{u.teams_count}</td>
                          <td className="px-6 py-4">
                            <span
                              className={`px-2 py-1 rounded text-xs ${
                                u.is_active
                                  ? 'bg-green-500/20 text-green-400'
                                  : 'bg-red-500/20 text-red-400'
                              }`}
                            >
                              {u.is_active ? 'Active' : 'Banned'}
                            </span>
                            {u.is_admin && (
                              <span className="ml-2 px-2 py-1 rounded text-xs bg-yellow-500/20 text-yellow-400">
                                Admin
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleToggleUserActive(u.id)}
                                className="px-3 py-1 text-xs bg-[#F5F5F5]/10 hover:bg-[#F5F5F5]/20 text-[#F5F5F5] rounded transition-colors"
                              >
                                {u.is_active ? 'Ban' : 'Unban'}
                              </button>
                              <button
                                onClick={() => handleDeleteUser(u.id, u.username)}
                                className="px-3 py-1 text-xs bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded transition-colors"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Teams Tab */}
          {activeTab === 'teams' && (
            <div className="bg-[#F5F5F5]/[0.03] border border-[#F5F5F5]/10 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#F5F5F5]/10">
                      <th className="text-left px-6 py-4 text-[#F5F5F5]/60 text-sm font-medium">Team</th>
                      <th className="text-left px-6 py-4 text-[#F5F5F5]/60 text-sm font-medium">Created</th>
                      <th className="text-left px-6 py-4 text-[#F5F5F5]/60 text-sm font-medium">Members</th>
                      <th className="text-left px-6 py-4 text-[#F5F5F5]/60 text-sm font-medium">Scrims</th>
                      <th className="text-left px-6 py-4 text-[#F5F5F5]/60 text-sm font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teams.map((team) => (
                      <tr key={team.id} className="border-b border-[#F5F5F5]/5 hover:bg-[#F5F5F5]/[0.02]">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {team.tag && (
                              <span style={{ color: team.team_color }} className="font-bold">
                                {team.tag}
                              </span>
                            )}
                            <span className="text-[#F5F5F5] font-medium">{team.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-[#F5F5F5]/80 text-sm">
                          {new Date(team.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-[#F5F5F5]/80">{team.member_count}</td>
                        <td className="px-6 py-4 text-[#F5F5F5]/80">{team.scrim_count}</td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => handleDeleteTeam(team.id, team.name)}
                            className="px-3 py-1 text-xs bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded transition-colors"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
