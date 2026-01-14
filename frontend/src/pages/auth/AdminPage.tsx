import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { Header } from '../../components/layout/Header';
import { Footer } from '../../components/layout/Footer';
import { COLORS } from '../../constants/theme';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

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

interface Ticket {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  priority: string;
  admin_response: string | null;
  created_at: string;
  updated_at: string | null;
  resolved_at: string | null;
  page_url: string | null;
  user_id: string | null;
  username: string | null;
}

interface TicketStats {
  total: number;
  open: number;
  in_progress: number;
  resolved: number;
  closed: number;
  by_category: Record<string, number>;
}

export default function AdminPage() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [ticketStats, setTicketStats] = useState<TicketStats | null>(null);
  const [activeTab, setActiveTab] = useState<'stats' | 'users' | 'teams' | 'tickets'>('stats');
  const [searchQuery, setSearchQuery] = useState('');
  const [ticketFilter, setTicketFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [ticketResponse, setTicketResponse] = useState('');

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
        console.error('Failed to fetch stats:', error);
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
        console.error('Failed to fetch users:', error);
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
        console.error('Failed to fetch teams:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTeams();
  }, [token, user, activeTab]);

  // Fetch tickets
  useEffect(() => {
    if (!token || !user?.is_admin || activeTab !== 'tickets') return;

    const fetchTickets = async () => {
      setLoading(true);
      try {
        const url = new URL(`${API_BASE_URL}/api/admin/tickets`);
        if (ticketFilter !== 'all') {
          url.searchParams.append('status', ticketFilter);
        }

        const [ticketsRes, statsRes] = await Promise.all([
          fetch(url.toString(), { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch(`${API_BASE_URL}/api/admin/tickets/stats`, { headers: { 'Authorization': `Bearer ${token}` } })
        ]);

        if (ticketsRes.ok) {
          const data = await ticketsRes.json();
          setTickets(data.tickets);
        }
        if (statsRes.ok) {
          const data = await statsRes.json();
          setTicketStats(data);
        }
      } catch (error) {
        console.error('Failed to fetch tickets:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTickets();
  }, [token, user, activeTab, ticketFilter]);

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
        setUsers(users.map(u =>
          u.id === userId ? { ...u, is_active: !u.is_active } : u
        ));
        toast?.success('User status updated');
      }
    } catch (error) {
      toast?.error('Failed to update user');
    }
  };

  const handleToggleUserAdmin = async (userId: string, username: string) => {
    if (!token) return;

    const targetUser = users.find(u => u.id === userId);
    const action = targetUser?.is_admin ? 'demote' : 'promote';

    if (!confirm(`${action === 'promote' ? 'Promote' : 'Demote'} "${username}" ${action === 'promote' ? 'to' : 'from'} admin?`)) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/users/${userId}/toggle-admin`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setUsers(users.map(u =>
          u.id === userId ? { ...u, is_admin: !u.is_admin } : u
        ));
        toast?.success(`User ${action === 'promote' ? 'promoted to' : 'demoted from'} admin`);
      }
    } catch (error) {
      toast?.error('Failed to update admin status');
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
        toast?.success('User deleted');
      }
    } catch (error) {
      toast?.error('Failed to delete user');
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
        toast?.success('Team deleted');
      }
    } catch (error) {
      toast?.error('Failed to delete team');
    }
  };

  const handleUpdateTicket = async (ticketId: string, updates: Partial<Ticket>) => {
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/tickets/${ticketId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      });

      if (response.ok) {
        setTickets(tickets.map(t =>
          t.id === ticketId ? { ...t, ...updates } : t
        ));
        toast?.success('Ticket updated');
        setSelectedTicket(null);
        setTicketResponse('');
      }
    } catch (error) {
      toast?.error('Failed to update ticket');
    }
  };

  const handleDeleteTicket = async (ticketId: string) => {
    if (!token || !confirm('Delete this ticket?')) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/tickets/${ticketId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setTickets(tickets.filter(t => t.id !== ticketId));
        toast?.success('Ticket deleted');
        setSelectedTicket(null);
      }
    } catch (error) {
      toast?.error('Failed to delete ticket');
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-500 bg-red-500/20';
      case 'high': return 'text-orange-500 bg-orange-500/20';
      case 'normal': return 'text-blue-500 bg-blue-500/20';
      case 'low': return 'text-gray-500 bg-gray-500/20';
      default: return 'text-gray-500 bg-gray-500/20';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'text-yellow-500 bg-yellow-500/20';
      case 'in_progress': return 'text-blue-500 bg-blue-500/20';
      case 'resolved': return 'text-green-500 bg-green-500/20';
      case 'closed': return 'text-gray-500 bg-gray-500/20';
      default: return 'text-gray-500 bg-gray-500/20';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'bug': return '🐛';
      case 'feature': return '✨';
      case 'feedback': return '💬';
      default: return '📝';
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
            <p className="text-[#F5F5F5]/60">Manage users, teams, tickets and view platform statistics</p>
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
            <button
              onClick={() => setActiveTab('tickets')}
              className={`px-6 py-3 font-medium transition-colors flex items-center gap-2 ${
                activeTab === 'tickets'
                  ? 'text-[#F5F5F5] border-b-2 border-[#F5F5F5]'
                  : 'text-[#F5F5F5]/60 hover:text-[#F5F5F5]/80'
              }`}
            >
              Tickets
              {ticketStats && ticketStats.open > 0 && (
                <span className="px-2 py-0.5 text-xs bg-red-500/20 text-red-400 rounded-full">
                  {ticketStats.open}
                </span>
              )}
            </button>
          </div>

          {/* Stats Tab */}
          {activeTab === 'stats' && stats && (
            <div className="space-y-6">
              {/* Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-[#F5F5F5]/[0.03] border border-[#F5F5F5]/10 p-6 rounded-lg">
                  <div className="text-[#F5F5F5]/60 text-sm mb-2">Total Users</div>
                  <div className="text-4xl font-bold text-[#F5F5F5]">{stats.total_users}</div>
                  <div className="text-green-400 text-xs mt-2">
                    +{stats.new_users_7d} this week
                  </div>
                </div>

                <div className="bg-[#F5F5F5]/[0.03] border border-[#F5F5F5]/10 p-6 rounded-lg">
                  <div className="text-[#F5F5F5]/60 text-sm mb-2">Active Users (7d)</div>
                  <div className="text-4xl font-bold text-[#F5F5F5]">{stats.active_users_7d}</div>
                  <div className="text-[#F5F5F5]/40 text-xs mt-2">
                    {stats.total_users > 0 ? ((stats.active_users_7d / stats.total_users) * 100).toFixed(1) : 0}% of total
                  </div>
                </div>

                <div className="bg-[#F5F5F5]/[0.03] border border-[#F5F5F5]/10 p-6 rounded-lg">
                  <div className="text-[#F5F5F5]/60 text-sm mb-2">Total Teams</div>
                  <div className="text-4xl font-bold text-[#F5F5F5]">{stats.total_teams}</div>
                  <div className="text-[#F5F5F5]/40 text-xs mt-2">
                    {stats.total_scrims} scrims total
                  </div>
                </div>

                <div className="bg-[#F5F5F5]/[0.03] border border-[#F5F5F5]/10 p-6 rounded-lg">
                  <div className="text-[#F5F5F5]/60 text-sm mb-2">Open Tickets</div>
                  <div className="text-4xl font-bold text-[#F5F5F5]">{ticketStats?.open || 0}</div>
                  <div className="text-[#F5F5F5]/40 text-xs mt-2">
                    {ticketStats?.total || 0} total tickets
                  </div>
                </div>
              </div>

              {/* User Growth Chart */}
              {stats.users_by_date && stats.users_by_date.length > 0 && (
                <div className="bg-[#F5F5F5]/[0.03] border border-[#F5F5F5]/10 p-6 rounded-lg">
                  <h3 className="text-[#F5F5F5] text-xl font-bold mb-4">User Registrations (Last 30 Days)</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={stats.users_by_date}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#F5F5F5/10" />
                        <XAxis
                          dataKey="date"
                          stroke="#F5F5F5"
                          opacity={0.5}
                          fontSize={12}
                          tickFormatter={(value) => {
                            const date = new Date(value);
                            return `${date.getDate()}/${date.getMonth() + 1}`;
                          }}
                        />
                        <YAxis stroke="#F5F5F5" opacity={0.5} fontSize={12} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#1A1A1A',
                            border: '1px solid rgba(245, 245, 245, 0.1)',
                            borderRadius: '8px'
                          }}
                          labelStyle={{ color: '#F5F5F5' }}
                          itemStyle={{ color: COLORS.primary }}
                        />
                        <Area
                          type="monotone"
                          dataKey="count"
                          stroke={COLORS.primary}
                          fill={COLORS.primary}
                          fillOpacity={0.3}
                          name="New Users"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Tool Usage */}
              <div className="bg-[#F5F5F5]/[0.03] border border-[#F5F5F5]/10 p-6 rounded-lg">
                <h3 className="text-[#F5F5F5] text-xl font-bold mb-4">Popular Tools</h3>
                <div className="space-y-3">
                  {Object.entries(stats.tool_usage).length > 0 ? (
                    Object.entries(stats.tool_usage).map(([tool, count]) => (
                      <div key={tool} className="flex items-center justify-between">
                        <span className="text-[#F5F5F5]/80">{tool}</span>
                        <div className="flex items-center gap-3">
                          <div className="w-48 bg-[#F5F5F5]/10 rounded-full h-2">
                            <div
                              className="h-2 rounded-full"
                              style={{
                                width: `${Math.min((count / stats.total_users) * 100, 100)}%`,
                                backgroundColor: COLORS.primary
                              }}
                            />
                          </div>
                          <span className="text-[#F5F5F5]/60 text-sm w-16 text-right">
                            {count} users
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-[#F5F5F5]/40 text-center py-4">No tool usage data yet</p>
                  )}
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
                            <div className="flex flex-wrap gap-1">
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
                                <span className="px-2 py-1 rounded text-xs bg-yellow-500/20 text-yellow-400">
                                  Admin
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleToggleUserAdmin(u.id, u.username)}
                                disabled={u.id === user?.id}
                                className={`px-3 py-1 text-xs rounded transition-colors ${
                                  u.is_admin
                                    ? 'bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400'
                                    : 'bg-purple-500/20 hover:bg-purple-500/30 text-purple-400'
                                } disabled:opacity-50 disabled:cursor-not-allowed`}
                              >
                                {u.is_admin ? 'Demote' : 'Promote'}
                              </button>
                              <button
                                onClick={() => handleToggleUserActive(u.id)}
                                disabled={u.id === user?.id}
                                className="px-3 py-1 text-xs bg-[#F5F5F5]/10 hover:bg-[#F5F5F5]/20 text-[#F5F5F5] rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {u.is_active ? 'Ban' : 'Unban'}
                              </button>
                              <button
                                onClick={() => handleDeleteUser(u.id, u.username)}
                                disabled={u.id === user?.id}
                                className="px-3 py-1 text-xs bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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

          {/* Tickets Tab */}
          {activeTab === 'tickets' && (
            <div className="space-y-6">
              {/* Ticket Stats */}
              {ticketStats && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <button
                    onClick={() => setTicketFilter('all')}
                    className={`p-4 rounded-lg border transition-colors ${
                      ticketFilter === 'all'
                        ? 'border-[#F5F5F5]/30 bg-[#F5F5F5]/10'
                        : 'border-[#F5F5F5]/10 bg-[#F5F5F5]/[0.03] hover:bg-[#F5F5F5]/[0.05]'
                    }`}
                  >
                    <div className="text-2xl font-bold text-[#F5F5F5]">{ticketStats.total}</div>
                    <div className="text-[#F5F5F5]/60 text-sm">Total</div>
                  </button>
                  <button
                    onClick={() => setTicketFilter('open')}
                    className={`p-4 rounded-lg border transition-colors ${
                      ticketFilter === 'open'
                        ? 'border-yellow-500/30 bg-yellow-500/10'
                        : 'border-[#F5F5F5]/10 bg-[#F5F5F5]/[0.03] hover:bg-[#F5F5F5]/[0.05]'
                    }`}
                  >
                    <div className="text-2xl font-bold text-yellow-400">{ticketStats.open}</div>
                    <div className="text-[#F5F5F5]/60 text-sm">Open</div>
                  </button>
                  <button
                    onClick={() => setTicketFilter('in_progress')}
                    className={`p-4 rounded-lg border transition-colors ${
                      ticketFilter === 'in_progress'
                        ? 'border-blue-500/30 bg-blue-500/10'
                        : 'border-[#F5F5F5]/10 bg-[#F5F5F5]/[0.03] hover:bg-[#F5F5F5]/[0.05]'
                    }`}
                  >
                    <div className="text-2xl font-bold text-blue-400">{ticketStats.in_progress}</div>
                    <div className="text-[#F5F5F5]/60 text-sm">In Progress</div>
                  </button>
                  <button
                    onClick={() => setTicketFilter('resolved')}
                    className={`p-4 rounded-lg border transition-colors ${
                      ticketFilter === 'resolved'
                        ? 'border-green-500/30 bg-green-500/10'
                        : 'border-[#F5F5F5]/10 bg-[#F5F5F5]/[0.03] hover:bg-[#F5F5F5]/[0.05]'
                    }`}
                  >
                    <div className="text-2xl font-bold text-green-400">{ticketStats.resolved}</div>
                    <div className="text-[#F5F5F5]/60 text-sm">Resolved</div>
                  </button>
                  <button
                    onClick={() => setTicketFilter('closed')}
                    className={`p-4 rounded-lg border transition-colors ${
                      ticketFilter === 'closed'
                        ? 'border-gray-500/30 bg-gray-500/10'
                        : 'border-[#F5F5F5]/10 bg-[#F5F5F5]/[0.03] hover:bg-[#F5F5F5]/[0.05]'
                    }`}
                  >
                    <div className="text-2xl font-bold text-gray-400">{ticketStats.closed}</div>
                    <div className="text-[#F5F5F5]/60 text-sm">Closed</div>
                  </button>
                </div>
              )}

              {/* Tickets List */}
              <div className="space-y-4">
                {tickets.length === 0 ? (
                  <div className="bg-[#F5F5F5]/[0.03] border border-[#F5F5F5]/10 rounded-lg p-12 text-center">
                    <p className="text-[#F5F5F5]/60">No tickets found</p>
                  </div>
                ) : (
                  tickets.map((ticket) => (
                    <div
                      key={ticket.id}
                      className="bg-[#F5F5F5]/[0.03] border border-[#F5F5F5]/10 rounded-lg p-6 hover:bg-[#F5F5F5]/[0.05] transition-colors cursor-pointer"
                      onClick={() => setSelectedTicket(ticket)}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-xl">{getCategoryIcon(ticket.category)}</span>
                            <h3 className="text-[#F5F5F5] font-semibold">{ticket.title}</h3>
                            <span className={`px-2 py-0.5 rounded text-xs ${getStatusColor(ticket.status)}`}>
                              {ticket.status.replace('_', ' ')}
                            </span>
                            <span className={`px-2 py-0.5 rounded text-xs ${getPriorityColor(ticket.priority)}`}>
                              {ticket.priority}
                            </span>
                          </div>
                          <p className="text-[#F5F5F5]/60 text-sm line-clamp-2">{ticket.description}</p>
                          <div className="flex items-center gap-4 mt-3 text-xs text-[#F5F5F5]/40">
                            <span>By: {ticket.username || 'Anonymous'}</span>
                            <span>{new Date(ticket.created_at).toLocaleString()}</span>
                            {ticket.page_url && <span className="truncate max-w-xs">{ticket.page_url}</span>}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Ticket Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1A1A1A] border border-[#F5F5F5]/10 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-[#F5F5F5]/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{getCategoryIcon(selectedTicket.category)}</span>
                  <h2 className="text-xl font-bold text-[#F5F5F5]">{selectedTicket.title}</h2>
                </div>
                <button
                  onClick={() => setSelectedTicket(null)}
                  className="text-[#F5F5F5]/60 hover:text-[#F5F5F5]"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Status & Priority */}
              <div className="flex gap-4">
                <div>
                  <label className="block text-[#F5F5F5]/60 text-xs mb-2">Status</label>
                  <select
                    value={selectedTicket.status}
                    onChange={(e) => handleUpdateTicket(selectedTicket.id, { status: e.target.value })}
                    className="bg-[#0E0E0E] border border-[#F5F5F5]/20 text-[#F5F5F5] px-3 py-2 rounded"
                  >
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[#F5F5F5]/60 text-xs mb-2">Priority</label>
                  <select
                    value={selectedTicket.priority}
                    onChange={(e) => handleUpdateTicket(selectedTicket.id, { priority: e.target.value })}
                    className="bg-[#0E0E0E] border border-[#F5F5F5]/20 text-[#F5F5F5] px-3 py-2 rounded"
                  >
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-[#F5F5F5]/60 text-xs mb-2">Description</label>
                <div className="bg-[#0E0E0E] border border-[#F5F5F5]/10 rounded p-4 text-[#F5F5F5]/80 whitespace-pre-wrap">
                  {selectedTicket.description}
                </div>
              </div>

              {/* Meta Info */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-[#F5F5F5]/60">Submitted by:</span>
                  <span className="text-[#F5F5F5] ml-2">{selectedTicket.username || 'Anonymous'}</span>
                </div>
                <div>
                  <span className="text-[#F5F5F5]/60">Created:</span>
                  <span className="text-[#F5F5F5] ml-2">{new Date(selectedTicket.created_at).toLocaleString()}</span>
                </div>
                {selectedTicket.page_url && (
                  <div className="col-span-2">
                    <span className="text-[#F5F5F5]/60">Page URL:</span>
                    <span className="text-[#F5F5F5] ml-2 break-all">{selectedTicket.page_url}</span>
                  </div>
                )}
              </div>

              {/* Admin Response */}
              <div>
                <label className="block text-[#F5F5F5]/60 text-xs mb-2">Admin Response</label>
                <textarea
                  value={ticketResponse || selectedTicket.admin_response || ''}
                  onChange={(e) => setTicketResponse(e.target.value)}
                  placeholder="Write a response..."
                  className="w-full bg-[#0E0E0E] border border-[#F5F5F5]/20 text-[#F5F5F5] px-4 py-3 rounded focus:outline-none focus:border-[#F5F5F5]/40 min-h-24"
                />
                <button
                  onClick={() => handleUpdateTicket(selectedTicket.id, { admin_response: ticketResponse })}
                  className="mt-2 px-4 py-2 bg-[#3D7A5F] text-[#F5F5F5] rounded hover:bg-[#3D7A5F]/90 transition-colors"
                >
                  Save Response
                </button>
              </div>

              {/* Delete Button */}
              <div className="pt-4 border-t border-[#F5F5F5]/10">
                <button
                  onClick={() => handleDeleteTicket(selectedTicket.id)}
                  className="px-4 py-2 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 transition-colors"
                >
                  Delete Ticket
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
