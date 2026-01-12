import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTeam } from '../../contexts/TeamContext';
import { useToast } from '../../contexts/ToastContext';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { Header } from '../../components/layout/Header';
import { Footer } from '../../components/layout/Footer';
import { COLORS } from '../../constants/theme';
import { useAutoRefresh } from '../../hooks/useAutoRefresh';
import { verifyRiotAccount, getSummonerData, syncRiotData, type SummonerData, type RiotAccount } from '../../services/riotApi';
import { ImageWithFallback } from '../../components/ui/ImageWithFallback';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function ProfilePage() {
  const { user, logout, updateUser } = useAuth();
  const { teams, invites, createTeam, getMyTeams, acceptInvite, getMyInvites } = useTeam();
  const navigate = useNavigate();
  const toast = useToast();

  const [summonerData, setSummonerData] = useState<SummonerData | null>(null);
  const [riotAccount, setRiotAccount] = useState<RiotAccount | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const [isEditingRiot, setIsEditingRiot] = useState(false);
  const [isEditingDiscord, setIsEditingDiscord] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [showCreateTeamModal, setShowCreateTeamModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);

  const [profileFormData, setProfileFormData] = useState({
    username: user?.username || '',
    email: user?.email || '',
  });

  const [riotFormData, setRiotFormData] = useState({
    riot_id: user?.riot_game_name && user?.riot_tag_line
      ? `${user.riot_game_name}#${user.riot_tag_line}`
      : '',
  });

  const [discordFormData, setDiscordFormData] = useState({
    discord: user?.discord || '',
  });

  const [passwordFormData, setPasswordFormData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });

  const [teamFormData, setTeamFormData] = useState({
    name: '',
    tag: '',
    description: '',
    team_color: '#3D7A5F',
  });


  const [confirmDialog, setConfirmDialog] = useState<{
    show: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    type?: 'danger' | 'warning' | 'info';
  }>({
    show: false,
    title: '',
    message: '',
    onConfirm: () => {},
    type: 'danger'
  });

  useEffect(() => {
    getMyTeams();
    getMyInvites();
  }, []);

  useEffect(() => {
    if (user?.riot_game_name) {
      loadSummonerData();
    }
  }, [user?.riot_game_name]);

  const loadSummonerData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const data = await getSummonerData(token);
      console.log('Summoner data loaded:', data);
      setSummonerData(data.summoner);
      setRiotAccount(data.riot_account);
    } catch (error) {
      console.error('Failed to load summoner data:', error);
    }
  };

  // Auto-refresh invites and teams every 30 seconds
  useAutoRefresh({
    onRefresh: () => {
      if (user) {
        getMyTeams();
        getMyInvites();
      }
    },
    interval: 30000,
    enabled: Boolean(user)
  });

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast?.error('Not authenticated');
        return;
      }

      await syncRiotData(token);
      toast?.success('Summoner data synced successfully!');
      await loadSummonerData();
    } catch (error) {
      console.error('Failed to sync data:', error);
      toast?.error(error instanceof Error ? error.message : 'Failed to sync data');
    } finally {
      setIsSyncing(false);
    }
  };

  const needsUpdate = () => {
    if (!summonerData?.last_synced) return false;
    const lastSync = new Date(summonerData.last_synced);
    const now = new Date();
    const hoursSinceSync = (now.getTime() - lastSync.getTime()) / (1000 * 60 * 60);
    return hoursSinceSync >= 48; // 48 hours = 2 days
  };

  const getTimeSinceUpdate = () => {
    if (!summonerData?.last_synced) return '';
    const lastSync = new Date(summonerData.last_synced);
    const now = new Date();
    const hoursSinceSync = (now.getTime() - lastSync.getTime()) / (1000 * 60 * 60);

    if (hoursSinceSync < 1) return 'Updated recently';
    if (hoursSinceSync < 24) return `Updated ${Math.floor(hoursSinceSync)}h ago`;
    const days = Math.floor(hoursSinceSync / 24);
    return `Updated ${days}d ago`;
  };

  const handleSaveProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast?.error('Not authenticated');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: profileFormData.username,
          email: profileFormData.email,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to update profile');
      }

      const updatedUser = await response.json();
      updateUser(updatedUser);
      toast?.success('Profile updated successfully');
      setIsEditingProfile(false);
    } catch (error) {
      console.error('Failed to update profile:', error);
      toast?.error(error instanceof Error ? error.message : 'Failed to update profile');
    }
  };

  const handleSaveRiot = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast?.error('Not authenticated');
        return;
      }

      // Parse single-line Riot ID format: GameName#TAG
      const riotId = riotFormData.riot_id.trim();

      if (!riotId.includes('#')) {
        toast?.error('Invalid format. Use: GameName#TAG');
        return;
      }

      const parts = riotId.split('#');
      if (parts.length !== 2 || !parts[0].trim() || !parts[1].trim()) {
        toast?.error('Invalid format. Use: GameName#TAG');
        return;
      }

      const riot_game_name = parts[0].trim();
      const riot_tag_line = parts[1].trim();

      // STEP 1: Verify the Riot account exists via Riot API
      toast?.info('Verifying Riot account...');
      try {
        await verifyRiotAccount(token, riot_game_name, riot_tag_line, 'EUW1', 'europe');
      } catch (verifyError) {
        toast?.error(verifyError instanceof Error ? verifyError.message : 'Riot account not found');
        return; // Stop if verification fails
      }

      // STEP 2: If verification succeeded, update user profile
      const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          riot_game_name,
          riot_tag_line,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to update Riot account');
      }

      const updatedUser = await response.json();
      updateUser(updatedUser);
      toast?.success('Riot account updated and verified successfully!');
      setIsEditingRiot(false);

      // Reload summoner data
      await loadSummonerData();
    } catch (error) {
      console.error('Failed to update Riot account:', error);
      toast?.error(error instanceof Error ? error.message : 'Failed to update Riot account');
    }
  };

  const handleUpdateDiscord = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast?.error('You must be logged in');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          discord: discordFormData.discord.trim() || null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to update Discord');
      }

      const updatedUser = await response.json();
      updateUser(updatedUser);
      toast?.success('Discord updated successfully');
      setIsEditingDiscord(false);
    } catch (error) {
      console.error('Failed to update Discord:', error);
      toast?.error(error instanceof Error ? error.message : 'Failed to update Discord');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordFormData.new_password !== passwordFormData.confirm_password) {
      toast?.error('Passwords do not match');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast?.error('Not authenticated');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/auth/password`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          current_password: passwordFormData.current_password,
          new_password: passwordFormData.new_password,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to change password');
      }

      toast?.success('Password changed successfully');
      setShowChangePasswordModal(false);
      setPasswordFormData({ current_password: '', new_password: '', confirm_password: '' });
    } catch (error) {
      console.error('Failed to change password:', error);
      toast?.error(error instanceof Error ? error.message : 'Failed to change password');
    }
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    const team = await createTeam(teamFormData);
    if (team) {
      setShowCreateTeamModal(false);
      setTeamFormData({ name: '', tag: '', description: '', team_color: '#3D7A5F' });
      getMyTeams();
    }
  };

  const handleAcceptInvite = async (inviteId: string) => {
    const team = await acceptInvite(inviteId);
    if (team) {
      getMyTeams();
      getMyInvites();
    }
  };

  const handleDeleteAccount = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast?.error('Not authenticated');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to delete account');
      }

      toast?.success('Account deleted successfully');
      logout();
      navigate('/');
    } catch (error) {
      console.error('Failed to delete account:', error);
      toast?.error(error instanceof Error ? error.message : 'Failed to delete account');
    } finally {
      setConfirmDialog({ ...confirmDialog, show: false });
    }
  };

  // Get user's main team (first team they're in)
  const myTeam = teams.length > 0 ? teams[0] : null;

  return (
    <div className="min-h-screen bg-[#0E0E0E] flex flex-col overflow-x-hidden" style={{ fontFamily: 'Inter, sans-serif' }}>
      <Header
        brandName="OpenRift"
        tagline="PRO TOOLS FOR EVERYONE"
        showToolsLink={true}
      />

      {/* Profile Header */}
      <div className="border-b border-[#F5F5F5]/10 py-16">
        <div className="max-w-[1600px] mx-auto px-12">
          <div className="flex gap-8 items-start">
            {/* Profile Picture - League Icon */}
            <div className="flex-shrink-0">
              {summonerData?.profile_icon_id ? (
                <ImageWithFallback
                  src={`https://ddragon.leagueoflegends.com/cdn/14.24.1/img/profileicon/${summonerData.profile_icon_id}.png`}
                  alt="Profile Icon"
                  fallbackType="profile"
                  className="w-40 h-40 rounded-lg border-2 border-[#F5F5F5]/20"
                  style={{ width: '10rem', height: '10rem' }}
                />
              ) : (
                <div className="w-40 h-40 rounded-lg border-2 border-[#F5F5F5]/20 bg-[#F5F5F5]/5 flex items-center justify-center">
                  <span className="text-[#F5F5F5]/40 text-4xl font-bold">
                    {user?.username?.substring(0, 2).toUpperCase()}
                  </span>
                </div>
              )}
            </div>

            {/* Info Section */}
            <div className="flex-1">
              {/* Tag + Username */}
              <h1 className="text-[#F5F5F5] text-6xl font-bold mb-4">
                {myTeam?.tag && (
                  <span style={{ color: myTeam.team_color }}>{myTeam.tag} </span>
                )}
                {user?.username}
              </h1>

              {/* Riot ID */}
              <p className="text-[#F5F5F5]/60 text-2xl mb-6">
                {user?.riot_game_name && user?.riot_tag_line
                  ? `${user.riot_game_name}#${user.riot_tag_line}`
                  : 'No Riot ID set'}
              </p>

              {/* First Stats Line: Role, Team, Rank, Level */}
              <div className="flex items-center gap-6">
                {/* Role */}
                {summonerData?.preferred_lane && (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="text-[#F5F5F5]/40 text-sm uppercase tracking-wider">Role:</span>
                      <ImageWithFallback
                        src={`/riot/role/${summonerData.preferred_lane === 'BOT' ? 'Bottom' : summonerData.preferred_lane === 'MID' ? 'Middle' : summonerData.preferred_lane.charAt(0) + summonerData.preferred_lane.slice(1).toLowerCase()}_icon.png`}
                        alt={summonerData.preferred_lane}
                        fallbackType="champion"
                        className="w-8 h-8"
                        style={{ width: '2rem', height: '2rem' }}
                      />
                      <span className="text-[#F5F5F5] text-base font-semibold">
                        {summonerData.preferred_lane}
                      </span>
                    </div>
                    <div className="w-px h-5 bg-[#F5F5F5]/20"></div>
                  </>
                )}

                {/* Team */}
                <div className="flex items-center gap-2">
                  <span className="text-[#F5F5F5]/40 text-sm uppercase tracking-wider">Team:</span>
                  <span className="text-[#F5F5F5] text-base font-semibold">
                    {myTeam ? myTeam.name : 'No team'}
                  </span>
                </div>

                {/* Rank with BIG Icon */}
                {summonerData?.solo_tier && summonerData?.solo_rank && (
                  <>
                    <div className="w-px h-5 bg-[#F5F5F5]/20"></div>
                    <div className="flex items-center gap-2">
                      <span className="text-[#F5F5F5]/40 text-sm uppercase tracking-wider">Rank:</span>
                      <ImageWithFallback
                        src={`/riot/Season_2022_-_${summonerData.solo_tier.charAt(0).toUpperCase() + summonerData.solo_tier.slice(1).toLowerCase()}.png`}
                        alt={summonerData.solo_tier}
                        fallbackType="champion"
                        className="w-12 h-12"
                        style={{ width: '3rem', height: '3rem' }}
                      />
                      <span className="text-[#F5F5F5] text-base font-semibold">
                        {summonerData.solo_tier} {summonerData.solo_rank}
                      </span>
                    </div>
                  </>
                )}

                {/* Level */}
                <div className="w-px h-5 bg-[#F5F5F5]/20"></div>
                <div className="flex items-center gap-2">
                  <span className="text-[#F5F5F5]/40 text-sm uppercase tracking-wider">Level:</span>
                  <span className="text-[#F5F5F5] text-base font-semibold">
                    {summonerData?.summoner_level || 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Single Unified Section */}
      <div className="flex-1 py-16">
        <div className="max-w-[1600px] mx-auto px-12">
          <div className="border border-[#F5F5F5]/10 bg-[#F5F5F5]/[0.02] overflow-hidden">
            {/* Main Header */}
            <div className="px-6 py-4 border-b border-[#F5F5F5]/10 bg-[#F5F5F5]/[0.02]">
              <h2 className="text-[#F5F5F5] text-xl font-semibold tracking-wide">PROFILE SETTINGS</h2>
            </div>

            <div className="grid grid-cols-12">
              {/* Left Column - Team Section */}
              <div className="col-span-5 p-6 border-r border-[#F5F5F5]/10 flex flex-col">
                <div className="flex-1">
                  <h3 className="text-[#F5F5F5]/80 text-sm font-semibold uppercase tracking-wider mb-5">My Team</h3>
                  {myTeam ? (
                    <div className="space-y-5">
                      {/* Team Info */}
                      <div className="flex items-center gap-4">
                        <div
                          className="w-14 h-14 rounded-lg flex items-center justify-center text-[#F5F5F5] font-bold text-xl shadow-lg flex-shrink-0"
                          style={{ backgroundColor: myTeam.team_color }}
                        >
                          {myTeam.tag || myTeam.name.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <h4 className="text-[#F5F5F5] text-lg font-bold mb-1">
                            {myTeam.name}
                          </h4>
                          <p className="text-[#F5F5F5]/60 text-sm">{myTeam.description || 'No description'}</p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="space-y-2.5">
                        <button
                          onClick={() => navigate('/team-manager')}
                          className="w-full px-5 py-2.5 bg-[#3D7A5F] text-[#F5F5F5] font-medium hover:bg-[#3D7A5F]/90 transition-colors rounded text-sm"
                        >
                          Open Team Manager
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-10">
                      <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-[#F5F5F5]/5 flex items-center justify-center">
                        <svg className="w-8 h-8 text-[#F5F5F5]/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                      <h4 className="text-[#F5F5F5] text-base font-semibold mb-1.5">No Team Yet</h4>
                      <p className="text-[#F5F5F5]/50 text-xs mb-5">
                        Create your own team or wait for an invitation
                      </p>
                      <button
                        onClick={() => setShowCreateTeamModal(true)}
                        className="px-5 py-2.5 bg-[#3D7A5F] text-[#F5F5F5] font-medium hover:bg-[#3D7A5F]/90 transition-colors rounded text-sm"
                      >
                        Create Team
                      </button>
                    </div>
                  )}

                  {/* Team Invitations - Integrated */}
                  {invites.length > 0 && (
                    <div className="pt-6 mt-6 border-t border-[#F5F5F5]/10">
                      <h3 className="text-[#F5F5F5]/80 text-sm font-semibold uppercase tracking-wider mb-4">
                        Team Invitations ({invites.length})
                      </h3>
                      <div className="space-y-3">
                        {invites.map((invite) => (
                          <div key={invite.id} className="p-3.5 bg-[#3D7A5F]/10 border border-[#3D7A5F]/20 rounded">
                            <p className="text-[#F5F5F5] font-semibold text-sm mb-0.5">{invite.team_name}</p>
                            <p className="text-[#F5F5F5]/50 text-xs mb-2.5">as {invite.role}</p>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleAcceptInvite(invite.id)}
                                className="flex-1 px-3 py-1.5 bg-[#3D7A5F] text-[#F5F5F5] text-xs hover:bg-[#3D7A5F]/90 transition-colors rounded font-medium"
                              >
                                Accept
                              </button>
                              <button className="flex-1 px-3 py-1.5 bg-[#F5F5F5]/5 text-[#F5F5F5] text-xs hover:bg-[#F5F5F5]/10 transition-colors rounded">
                                Decline
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Riot Games Section */}
                  <div className="pt-6 mt-6 border-t border-[#F5F5F5]/10">
                    <div className="flex items-center justify-between mb-5">
                      <h3 className="text-[#F5F5F5]/80 text-sm font-semibold uppercase tracking-wider">Riot Games</h3>
                      {!isEditingRiot && (
                        <button
                          onClick={() => setIsEditingRiot(true)}
                          className="text-[#3D7A5F] text-sm hover:text-[#3D7A5F]/80 transition-colors font-medium"
                        >
                          Edit
                        </button>
                      )}
                    </div>

                    {isEditingRiot ? (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-[#F5F5F5]/50 text-xs uppercase tracking-wider mb-2">Riot ID</label>
                          <input
                            type="text"
                            value={riotFormData.riot_id}
                            onChange={(e) => setRiotFormData({ riot_id: e.target.value })}
                            className="w-full px-4 py-2.5 bg-[#0E0E0E] border border-[#F5F5F5]/10 text-[#F5F5F5] focus:outline-none focus:border-[#3D7A5F] rounded"
                            placeholder="GameName#TAG"
                          />
                          <p className="text-[#F5F5F5]/40 text-xs mt-2">Format: GameName#TAG (ex: Faker#KR1)</p>
                        </div>
                        <div className="flex gap-3 pt-2">
                          <button
                            onClick={() => {
                              setIsEditingRiot(false);
                              setRiotFormData({
                                riot_id: user?.riot_game_name && user?.riot_tag_line
                                  ? `${user.riot_game_name}#${user.riot_tag_line}`
                                  : '',
                              });
                            }}
                            className="flex-1 px-4 py-2.5 bg-[#F5F5F5]/5 text-[#F5F5F5] hover:bg-[#F5F5F5]/10 transition-colors rounded"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleSaveRiot}
                            className="flex-1 px-4 py-2.5 bg-[#3D7A5F] text-[#F5F5F5] hover:bg-[#3D7A5F]/90 transition-colors rounded font-medium"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-[#F5F5F5]/50 text-xs uppercase tracking-wider mb-2">Riot ID</label>
                          <p className="text-[#F5F5F5] text-base font-medium">
                            {user?.riot_game_name && user?.riot_tag_line
                              ? `${user.riot_game_name}#${user.riot_tag_line}`
                              : 'Not set'}
                          </p>
                        </div>

                        {/* Sync Button - only show if user has Riot ID */}
                        {user?.riot_game_name && user?.riot_tag_line && summonerData && (
                          <div className="flex items-center justify-between pt-2">
                            <div className="flex flex-col gap-1">
                              <span className="text-[#F5F5F5]/50 text-xs">
                                {getTimeSinceUpdate() || 'Never synced'}
                              </span>
                            </div>
                            <button
                              onClick={handleSync}
                              disabled={isSyncing}
                              className="px-4 py-2 rounded font-medium text-sm transition-all relative"
                              style={{
                                backgroundColor: needsUpdate() ? '#D4A855' : 'rgba(61, 122, 95, 0.2)',
                                color: needsUpdate() ? '#F5F5F5' : '#3D7A5F',
                                border: needsUpdate() ? '1px solid #D4A855' : '1px solid #3D7A5F',
                                cursor: isSyncing ? 'not-allowed' : 'pointer',
                                opacity: isSyncing ? 0.6 : 1,
                              }}
                            >
                              {isSyncing ? 'Syncing...' : '↻ Sync Data'}
                              {needsUpdate() && !isSyncing && (
                                <span
                                  className="absolute -top-1 -right-1 w-2 h-2 rounded-full"
                                  style={{
                                    backgroundColor: '#E74C3C',
                                    border: '2px solid #1A1A1A'
                                  }}
                                />
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column - Account & Discord Settings */}
              <div className="col-span-7 p-6">
                {/* Account Info Section */}
                <div className="mb-6 pb-6 border-b border-[#F5F5F5]/10">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="text-[#F5F5F5]/80 text-sm font-semibold uppercase tracking-wider">Account Information</h3>
                    {!isEditingProfile && (
                      <button
                        onClick={() => setIsEditingProfile(true)}
                        className="text-[#3D7A5F] text-sm hover:text-[#3D7A5F]/80 transition-colors font-medium"
                      >
                        Edit
                      </button>
                    )}
                  </div>

                  {isEditingProfile ? (
                    <div className="space-y-5">
                      <div>
                        <label className="block text-[#F5F5F5]/50 text-xs uppercase tracking-wider mb-2">Username</label>
                        <input
                          type="text"
                          value={profileFormData.username}
                          onChange={(e) => setProfileFormData({ ...profileFormData, username: e.target.value })}
                          className="w-full px-4 py-2.5 bg-[#0E0E0E] border border-[#F5F5F5]/10 text-[#F5F5F5] focus:outline-none focus:border-[#3D7A5F] rounded"
                        />
                      </div>
                      <div>
                        <label className="block text-[#F5F5F5]/50 text-xs uppercase tracking-wider mb-2">Email</label>
                        <input
                          type="email"
                          value={profileFormData.email}
                          onChange={(e) => setProfileFormData({ ...profileFormData, email: e.target.value })}
                          className="w-full px-4 py-2.5 bg-[#0E0E0E] border border-[#F5F5F5]/10 text-[#F5F5F5] focus:outline-none focus:border-[#3D7A5F] rounded"
                        />
                      </div>
                      <div className="flex gap-3 pt-3">
                        <button
                          onClick={() => setIsEditingProfile(false)}
                          className="flex-1 px-4 py-2.5 bg-[#F5F5F5]/5 text-[#F5F5F5] hover:bg-[#F5F5F5]/10 transition-colors rounded"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSaveProfile}
                          className="flex-1 px-4 py-2.5 bg-[#3D7A5F] text-[#F5F5F5] hover:bg-[#3D7A5F]/90 transition-colors rounded font-medium"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-5">
                      <div>
                        <label className="block text-[#F5F5F5]/50 text-xs uppercase tracking-wider mb-2">Username</label>
                        <p className="text-[#F5F5F5] text-base font-medium">{user?.username}</p>
                      </div>
                      <div>
                        <label className="block text-[#F5F5F5]/50 text-xs uppercase tracking-wider mb-2">Email</label>
                        <p className="text-[#F5F5F5] text-base font-medium">{user?.email}</p>
                      </div>
                      <div className="pt-2">
                        <button
                          onClick={() => setShowChangePasswordModal(true)}
                          className="w-full px-4 py-2.5 bg-[#F5F5F5]/5 text-[#F5F5F5] text-sm hover:bg-[#F5F5F5]/10 transition-colors rounded border border-[#F5F5F5]/10 font-medium"
                        >
                          Change Password
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Discord Section */}
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="text-[#F5F5F5]/80 text-sm font-semibold uppercase tracking-wider">Discord</h3>
                    {!isEditingDiscord && (
                      <button
                        onClick={() => setIsEditingDiscord(true)}
                        className="text-[#3D7A5F] text-sm hover:text-[#3D7A5F]/80 transition-colors font-medium"
                      >
                        Edit
                      </button>
                    )}
                  </div>

                  {isEditingDiscord ? (
                    <form onSubmit={handleUpdateDiscord} className="space-y-4">
                      <div>
                        <label className="block text-[#F5F5F5]/50 text-xs uppercase tracking-wider mb-2">Discord Username</label>
                        <input
                          type="text"
                          value={discordFormData.discord}
                          onChange={(e) => setDiscordFormData({ discord: e.target.value })}
                          className="w-full px-4 py-2.5 bg-[#0E0E0E] border border-[#F5F5F5]/10 text-[#F5F5F5] focus:outline-none focus:border-[#3D7A5F] rounded"
                          placeholder="username#1234"
                        />
                        <p className="text-[#F5F5F5]/40 text-xs mt-2">Visible to your team members</p>
                      </div>
                      <div className="flex gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            setIsEditingDiscord(false);
                            setDiscordFormData({
                              discord: user?.discord || '',
                            });
                          }}
                          className="flex-1 px-4 py-2.5 bg-[#F5F5F5]/5 text-[#F5F5F5] hover:bg-[#F5F5F5]/10 transition-colors rounded"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="flex-1 px-4 py-2.5 bg-[#3D7A5F] text-[#F5F5F5] hover:bg-[#3D7A5F]/90 transition-colors rounded font-medium"
                        >
                          Save
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div>
                      <label className="block text-[#F5F5F5]/50 text-xs uppercase tracking-wider mb-2">Discord Username</label>
                      <p className="text-[#F5F5F5] text-base font-medium">
                        {user?.discord || 'Not set'}
                      </p>
                    </div>
                  )}
                </div>

                {/* Danger Zone - Delete Account */}
                <div className="pt-6 mt-6 border-t border-[#F5F5F5]/10">
                  <h3 className="text-[#F5F5F5]/80 text-sm font-semibold uppercase tracking-wider mb-4">Danger Zone</h3>
                  <button
                    onClick={() => {
                      setConfirmDialog({
                        show: true,
                        title: 'Delete Account',
                        message: 'Are you sure you want to delete your account? This action cannot be undone. All your data, including teams and statistics, will be permanently deleted.',
                        type: 'danger',
                        onConfirm: handleDeleteAccount
                      });
                    }}
                    className="w-full px-4 py-3 border transition-colors text-left font-medium"
                    style={{
                      backgroundColor: `${COLORS.danger}1A`,
                      color: COLORS.danger,
                      borderColor: `${COLORS.danger}4D`
                    }}
                  >
                    Delete Account
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Create Team Modal */}
      {showCreateTeamModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setShowCreateTeamModal(false)}>
          <div className="bg-[#1A1A1A] border border-[#F5F5F5]/10 p-8 max-w-lg w-full rounded-lg" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-[#F5F5F5] text-2xl font-bold mb-6">Create Team</h2>
            <form onSubmit={handleCreateTeam}>
              <div className="space-y-5">
                <div>
                  <label className="block text-[#F5F5F5]/60 text-sm mb-2">Team Name *</label>
                  <input
                    type="text"
                    value={teamFormData.name}
                    onChange={(e) => setTeamFormData({ ...teamFormData, name: e.target.value })}
                    className="w-full px-4 py-3 bg-[#0E0E0E] border border-[#F5F5F5]/10 text-[#F5F5F5] focus:outline-none focus:border-[#3D7A5F] rounded"
                    required
                    placeholder="e.g., Kingslayers"
                  />
                </div>
                <div>
                  <label className="block text-[#F5F5F5]/60 text-sm mb-2">Team Tag (2-4 letters) *</label>
                  <input
                    type="text"
                    value={teamFormData.tag}
                    onChange={(e) => setTeamFormData({ ...teamFormData, tag: e.target.value.toUpperCase() })}
                    className="w-full px-4 py-3 bg-[#0E0E0E] border border-[#F5F5F5]/10 text-[#F5F5F5] focus:outline-none focus:border-[#3D7A5F] rounded uppercase"
                    maxLength={4}
                    minLength={2}
                    required
                    placeholder="e.g., KC, T1, FNC"
                  />
                </div>
                <div>
                  <label className="block text-[#F5F5F5]/60 text-sm mb-2">Description</label>
                  <textarea
                    value={teamFormData.description}
                    onChange={(e) => setTeamFormData({ ...teamFormData, description: e.target.value })}
                    className="w-full px-4 py-3 bg-[#0E0E0E] border border-[#F5F5F5]/10 text-[#F5F5F5] focus:outline-none focus:border-[#3D7A5F] resize-none rounded"
                    rows={3}
                    placeholder="A few words about your team..."
                  />
                </div>
                <div>
                  <label className="block text-[#F5F5F5]/60 text-sm mb-3">Team Color</label>
                  <div className="flex gap-3">
                    {['#3D7A5F', '#5B8FB9', '#B4975A', '#8B5A9F', '#C75B5B', '#E07B39'].map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setTeamFormData({ ...teamFormData, team_color: color })}
                        className={`w-12 h-12 rounded-lg transition-all ${teamFormData.team_color === color ? 'ring-2 ring-[#F5F5F5] ring-offset-2 ring-offset-[#1A1A1A] scale-110' : 'hover:scale-105'}`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex gap-3 mt-8">
                <button
                  type="button"
                  onClick={() => setShowCreateTeamModal(false)}
                  className="flex-1 px-6 py-3 bg-[#F5F5F5]/5 text-[#F5F5F5] hover:bg-[#F5F5F5]/10 transition-colors rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-[#3D7A5F] text-[#F5F5F5] font-medium hover:bg-[#3D7A5F]/90 transition-colors rounded"
                >
                  Create Team
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {showChangePasswordModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setShowChangePasswordModal(false)}>
          <div className="bg-[#1A1A1A] border border-[#F5F5F5]/10 p-8 max-w-lg w-full rounded-lg" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-[#F5F5F5] text-2xl font-bold mb-2">Change Password</h2>
            <p className="text-[#F5F5F5]/50 text-sm mb-6">Enter your current password and choose a new one</p>
            <form onSubmit={handleChangePassword}>
              <div className="space-y-5">
                <div>
                  <label className="block text-[#F5F5F5]/60 text-sm mb-2">Current Password *</label>
                  <input
                    type="password"
                    value={passwordFormData.current_password}
                    onChange={(e) => setPasswordFormData({ ...passwordFormData, current_password: e.target.value })}
                    className="w-full px-4 py-3 bg-[#0E0E0E] border border-[#F5F5F5]/10 text-[#F5F5F5] focus:outline-none focus:border-[#3D7A5F] rounded"
                    required
                    placeholder="Enter current password"
                  />
                </div>
                <div>
                  <label className="block text-[#F5F5F5]/60 text-sm mb-2">New Password *</label>
                  <input
                    type="password"
                    value={passwordFormData.new_password}
                    onChange={(e) => setPasswordFormData({ ...passwordFormData, new_password: e.target.value })}
                    className="w-full px-4 py-3 bg-[#0E0E0E] border border-[#F5F5F5]/10 text-[#F5F5F5] focus:outline-none focus:border-[#3D7A5F] rounded"
                    required
                    minLength={8}
                    placeholder="Minimum 8 characters"
                  />
                </div>
                <div>
                  <label className="block text-[#F5F5F5]/60 text-sm mb-2">Confirm New Password *</label>
                  <input
                    type="password"
                    value={passwordFormData.confirm_password}
                    onChange={(e) => setPasswordFormData({ ...passwordFormData, confirm_password: e.target.value })}
                    className="w-full px-4 py-3 bg-[#0E0E0E] border border-[#F5F5F5]/10 text-[#F5F5F5] focus:outline-none focus:border-[#3D7A5F] rounded"
                    required
                    placeholder="Re-enter new password"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-8">
                <button
                  type="button"
                  onClick={() => {
                    setShowChangePasswordModal(false);
                    setPasswordFormData({ current_password: '', new_password: '', confirm_password: '' });
                  }}
                  className="flex-1 px-6 py-3 bg-[#F5F5F5]/5 text-[#F5F5F5] hover:bg-[#F5F5F5]/10 transition-colors rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-[#3D7A5F] text-[#F5F5F5] font-medium hover:bg-[#3D7A5F]/90 transition-colors rounded"
                >
                  Change Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Dialog */}
      {confirmDialog.show && (
        <ConfirmDialog
          title={confirmDialog.title}
          message={confirmDialog.message}
          confirmText="Confirm"
          cancelText="Cancel"
          onConfirm={confirmDialog.onConfirm}
          onCancel={() => setConfirmDialog({ ...confirmDialog, show: false })}
          type={confirmDialog.type}
        />
      )}

      <Footer
        copyright="© 2025 OpenRift — Professional Tools Platform"
        links={[
          { label: 'About', href: '/about' },
          { label: 'Privacy', href: '/privacy' },
          { label: 'Terms', href: '/terms' },
        ]}
      />
    </div>
  );
}
