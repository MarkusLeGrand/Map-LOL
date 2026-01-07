import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTeam } from '../../contexts/TeamContext';
import { useToast } from '../../contexts/ToastContext';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { Header } from '../../components/layout/Header';
import { Footer } from '../../components/layout/Footer';
import { COLORS } from '../../constants/theme';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function ProfilePage() {
  const { user, logout, updateUser } = useAuth();
  const { teams, invites, createTeam, getMyTeams, acceptInvite, getMyInvites } = useTeam();
  const navigate = useNavigate();
  const toast = useToast();

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
      toast?.success('Riot account updated successfully');
      setIsEditingRiot(false);
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

  const handleLeaveTeam = async () => {
    if (!myTeam || !window.confirm('Are you sure you want to leave this team?')) return;

    // TODO: Implement API call to leave team
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${API_BASE_URL}/api/teams/${myTeam.id}/leave`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        getMyTeams();
      }
    } catch (error) {
      console.error('Failed to leave team:', error);
    }
  };

  // Get user's main team (first team they're in)
  const myTeam = teams.length > 0 ? teams[0] : null;
  const isTeamOwner = myTeam?.owner_id === user?.id;

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
          <div>
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

            {/* Stats Bar */}
            <div className="flex items-center gap-8 mt-6">
              <div className="flex items-center gap-3">
                <span className="text-[#F5F5F5]/40 text-sm uppercase tracking-wider">Team:</span>
                <span className="text-[#F5F5F5] text-base font-semibold">
                  {myTeam ? myTeam.name : 'No team'}
                </span>
              </div>
              <div className="w-px h-5 bg-[#F5F5F5]/20"></div>
              <div className="flex items-center gap-3">
                <span className="text-[#F5F5F5]/40 text-sm uppercase tracking-wider">Status:</span>
                <span className="text-[#F5F5F5] text-base font-semibold">
                  {isTeamOwner ? 'Owner' : 'Member'}
                </span>
              </div>
              <div className="w-px h-5 bg-[#F5F5F5]/20"></div>
              <div className="flex items-center gap-3">
                <span className="text-[#F5F5F5]/40 text-sm uppercase tracking-wider">Favorite Tools:</span>
                <span className="text-[#F5F5F5] text-base font-semibold">
                  {user?.favorite_tools?.length || 0}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 py-16">
        <div className="max-w-[1600px] mx-auto px-12">
          <div className="grid grid-cols-3 gap-8">

            {/* Left Column - Personal Info */}
            <div className="col-span-1 space-y-6">

              {/* Account Info */}
              <div className="border border-[#F5F5F5]/10 p-6 bg-[#F5F5F5]/[0.02]">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-[#F5F5F5] text-xl font-semibold">Account</h2>
                  {!isEditingProfile && (
                    <button
                      onClick={() => setIsEditingProfile(true)}
                      className="text-[#3D7A5F] text-sm hover:text-[#3D7A5F]/80 transition-colors"
                    >
                      Edit
                    </button>
                  )}
                </div>

                {isEditingProfile ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[#F5F5F5]/50 text-xs mb-2">USERNAME</label>
                      <input
                        type="text"
                        value={profileFormData.username}
                        onChange={(e) => setProfileFormData({ ...profileFormData, username: e.target.value })}
                        className="w-full px-3 py-2 bg-[#0E0E0E] border border-[#F5F5F5]/10 text-[#F5F5F5] text-sm focus:outline-none focus:border-[#3D7A5F] rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-[#F5F5F5]/50 text-xs mb-2">EMAIL</label>
                      <input
                        type="email"
                        value={profileFormData.email}
                        onChange={(e) => setProfileFormData({ ...profileFormData, email: e.target.value })}
                        className="w-full px-3 py-2 bg-[#0E0E0E] border border-[#F5F5F5]/10 text-[#F5F5F5] text-sm focus:outline-none focus:border-[#3D7A5F] rounded"
                      />
                    </div>
                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={() => setIsEditingProfile(false)}
                        className="flex-1 px-4 py-2 bg-[#F5F5F5]/5 text-[#F5F5F5] text-sm hover:bg-[#F5F5F5]/10 transition-colors rounded"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveProfile}
                        className="flex-1 px-4 py-2 bg-[#3D7A5F] text-[#F5F5F5] text-sm hover:bg-[#3D7A5F]/90 transition-colors rounded"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[#F5F5F5]/50 text-xs mb-2">USERNAME</label>
                      <p className="text-[#F5F5F5] text-base">{user?.username}</p>
                    </div>
                    <div>
                      <label className="block text-[#F5F5F5]/50 text-xs mb-2">EMAIL</label>
                      <p className="text-[#F5F5F5] text-base">{user?.email}</p>
                    </div>
                  </div>
                )}

                {/* Change Password Button */}
                <div className="mt-6 pt-6 border-t border-[#F5F5F5]/10">
                  <button
                    onClick={() => setShowChangePasswordModal(true)}
                    className="w-full px-4 py-2.5 bg-[#F5F5F5]/5 text-[#F5F5F5] text-sm hover:bg-[#F5F5F5]/10 transition-colors rounded border border-[#F5F5F5]/10"
                  >
                    Change Password
                  </button>
                </div>
              </div>

              {/* Riot Account */}
              <div className="border border-[#F5F5F5]/10 p-6 bg-[#F5F5F5]/[0.02]">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-[#F5F5F5] text-xl font-semibold">Riot Account</h2>
                  {!isEditingRiot && (
                    <button
                      onClick={() => setIsEditingRiot(true)}
                      className="text-[#3D7A5F] text-sm hover:text-[#3D7A5F]/80 transition-colors"
                    >
                      Edit
                    </button>
                  )}
                </div>

                {isEditingRiot ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[#F5F5F5]/50 text-xs mb-2">RIOT ID</label>
                      <input
                        type="text"
                        value={riotFormData.riot_id}
                        onChange={(e) => setRiotFormData({ riot_id: e.target.value })}
                        className="w-full px-3 py-2 bg-[#0E0E0E] border border-[#F5F5F5]/10 text-[#F5F5F5] text-sm focus:outline-none focus:border-[#3D7A5F] rounded"
                        placeholder="GameName#TAG"
                      />
                      <p className="text-[#F5F5F5]/40 text-xs mt-2">Format: GameName#TAG (ex: Faker#KR1)</p>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={() => {
                          setIsEditingRiot(false);
                          setRiotFormData({
                            riot_id: user?.riot_game_name && user?.riot_tag_line
                              ? `${user.riot_game_name}#${user.riot_tag_line}`
                              : '',
                          });
                        }}
                        className="flex-1 px-4 py-2 bg-[#F5F5F5]/5 text-[#F5F5F5] text-sm hover:bg-[#F5F5F5]/10 transition-colors rounded"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveRiot}
                        className="flex-1 px-4 py-2 bg-[#3D7A5F] text-[#F5F5F5] text-sm hover:bg-[#3D7A5F]/90 transition-colors rounded"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[#F5F5F5]/50 text-xs mb-2">RIOT ID</label>
                      <p className="text-[#F5F5F5] text-base">
                        {user?.riot_game_name && user?.riot_tag_line
                          ? `${user.riot_game_name}#${user.riot_tag_line}`
                          : 'Not set'}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Discord */}
              <div className="border border-[#F5F5F5]/10 p-6 bg-[#F5F5F5]/[0.02]">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-[#F5F5F5] text-xl font-semibold">Discord</h2>
                  {!isEditingDiscord && (
                    <button
                      onClick={() => setIsEditingDiscord(true)}
                      className="text-[#3D7A5F] text-sm hover:text-[#3D7A5F]/80 transition-colors"
                    >
                      Edit
                    </button>
                  )}
                </div>

                {isEditingDiscord ? (
                  <form onSubmit={handleUpdateDiscord} className="space-y-4">
                    <div>
                      <label className="block text-[#F5F5F5]/50 text-xs mb-2">DISCORD USERNAME</label>
                      <input
                        type="text"
                        value={discordFormData.discord}
                        onChange={(e) => setDiscordFormData({ discord: e.target.value })}
                        className="w-full px-3 py-2 bg-[#0E0E0E] border border-[#F5F5F5]/10 text-[#F5F5F5] text-sm focus:outline-none focus:border-[#3D7A5F] rounded"
                        placeholder="username#1234"
                      />
                      <p className="text-[#F5F5F5]/40 text-xs mt-2">Visible to your team members</p>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditingDiscord(false);
                          setDiscordFormData({
                            discord: user?.discord || '',
                          });
                        }}
                        className="flex-1 px-4 py-2 bg-[#F5F5F5]/5 text-[#F5F5F5] text-sm hover:bg-[#F5F5F5]/10 transition-colors rounded"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="flex-1 px-4 py-2 bg-[#3D7A5F] text-[#F5F5F5] text-sm hover:bg-[#3D7A5F]/90 transition-colors rounded"
                      >
                        Save
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[#F5F5F5]/50 text-xs mb-2">DISCORD USERNAME</label>
                      <p className="text-[#F5F5F5] text-base">
                        {user?.discord || 'Not set'}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Team Invitations */}
              {invites.length > 0 && (
                <div className="border border-[#3D7A5F]/30 p-6 bg-[#3D7A5F]/[0.08]">
                  <h3 className="text-[#F5F5F5] text-lg font-semibold mb-4">Invitations ({invites.length})</h3>
                  <div className="space-y-3">
                    {invites.map((invite) => (
                      <div key={invite.id} className="p-4 bg-[#0E0E0E]/50 border border-[#3D7A5F]/20 rounded">
                        <p className="text-[#F5F5F5] font-medium mb-1">{invite.team_name}</p>
                        <p className="text-[#F5F5F5]/50 text-xs mb-3">as {invite.role}</p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleAcceptInvite(invite.id)}
                            className="flex-1 px-3 py-2 bg-[#3D7A5F] text-[#F5F5F5] text-sm hover:bg-[#3D7A5F]/90 transition-colors rounded"
                          >
                            Accept
                          </button>
                          <button className="flex-1 px-3 py-2 bg-[#F5F5F5]/5 text-[#F5F5F5] text-sm hover:bg-[#F5F5F5]/10 transition-colors rounded">
                            Decline
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Logout */}
              <button
                onClick={logout}
                className="w-full px-4 py-3 text-[#F5F5F5] font-medium transition-colors rounded"
                style={{ backgroundColor: COLORS.danger }}
              >
                Logout
              </button>
            </div>

            {/* Right Column - Team Management */}
            <div className="col-span-2">
              <div className="border border-[#F5F5F5]/10 p-8 bg-[#F5F5F5]/[0.02]">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-[#F5F5F5] text-2xl font-bold">My Team</h2>
                  {!myTeam && (
                    <button
                      onClick={() => setShowCreateTeamModal(true)}
                      className="px-6 py-3 bg-[#3D7A5F] text-[#F5F5F5] font-medium hover:bg-[#3D7A5F]/90 transition-colors rounded"
                    >
                      Create Team
                    </button>
                  )}
                </div>

                {myTeam ? (
                  <div className="space-y-8">
                    {/* Team Header */}
                    <div className="flex items-center justify-between pb-6 border-b border-[#F5F5F5]/10">
                      <div className="flex items-center gap-6">
                        <div
                          className="w-20 h-20 rounded-lg flex items-center justify-center text-[#F5F5F5] font-bold text-3xl shadow-lg"
                          style={{ backgroundColor: myTeam.team_color }}
                        >
                          {myTeam.tag || myTeam.name.charAt(0)}
                        </div>
                        <div>
                          <h3 className="text-[#F5F5F5] text-3xl font-bold mb-2">
                            {myTeam.name}
                          </h3>
                          <p className="text-[#F5F5F5]/60">{myTeam.description || 'No description'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Members */}
                    <div>
                      <h4 className="text-[#F5F5F5]/60 text-sm font-medium mb-4 uppercase tracking-wider">
                        Members ({myTeam.member_count})
                      </h4>
                      <div className="grid grid-cols-2 gap-4">
                        {myTeam.members.map((member) => {
                          const isMemberOwner = member.id === myTeam.owner_id;
                          const isCurrentUser = member.id === user?.id;
                          const canManage = isTeamOwner && !isCurrentUser && !isMemberOwner;

                          return (
                            <div
                              key={member.id}
                              className="flex items-center gap-3 p-4 bg-[#F5F5F5]/[0.03] border border-[#F5F5F5]/10 rounded-lg hover:bg-[#F5F5F5]/[0.05] transition-colors group"
                            >
                              <div className="flex-1 min-w-0">
                                <p className="text-[#F5F5F5] font-medium truncate">
                                  {myTeam.tag && (
                                    <span style={{ color: myTeam.team_color }} className="font-bold">
                                      {myTeam.tag}{' '}
                                    </span>
                                  )}
                                  {member.username}
                                </p>
                                {member.riot_game_name && member.riot_tag_line && (
                                  <p className="text-[#F5F5F5]/50 text-xs mt-0.5">
                                    {member.riot_game_name}#{member.riot_tag_line}
                                  </p>
                                )}
                              </div>

                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-4 pt-6 border-t border-[#F5F5F5]/10">
                      <button
                        onClick={() => navigate('/team-manager')}
                        className="flex-1 px-6 py-4 bg-[#3D7A5F] text-[#F5F5F5] font-medium hover:bg-[#3D7A5F]/90 transition-colors rounded-lg"
                      >
                        Open Team Manager
                      </button>
                      {!isTeamOwner && (
                        <button
                          onClick={handleLeaveTeam}
                          className="px-6 py-4 border transition-colors rounded-lg"
                          style={{
                            backgroundColor: `${COLORS.danger}1A`,
                            color: COLORS.danger,
                            borderColor: `${COLORS.danger}4D`
                          }}
                        >
                          Leave Team
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-[#F5F5F5]/5 flex items-center justify-center">
                      <svg className="w-12 h-12 text-[#F5F5F5]/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <h3 className="text-[#F5F5F5] text-2xl font-semibold mb-3">No Team Yet</h3>
                    <p className="text-[#F5F5F5]/50 mb-8 max-w-md mx-auto">
                      Create your own team or wait for an invitation to join one
                    </p>
                    <button
                      onClick={() => setShowCreateTeamModal(true)}
                      className="px-8 py-4 bg-[#3D7A5F] text-[#F5F5F5] font-medium hover:bg-[#3D7A5F]/90 transition-colors rounded-lg"
                    >
                      Create Your Team
                    </button>
                  </div>
                )}
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
          { label: 'About', href: '#' },
          { label: 'Privacy', href: '#' },
          { label: 'Terms', href: '#' },
        ]}
      />
    </div>
  );
}
