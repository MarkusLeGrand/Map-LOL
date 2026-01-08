import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTeam } from '../../contexts/TeamContext';
import { useToast } from '../../contexts/ToastContext';
import { Header } from '../../components/layout/Header';
import { Footer } from '../../components/layout/Footer';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { useAutoRefresh } from '../../hooks/useAutoRefresh';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface TeamMember {
  id: string;
  username: string;
  email: string;
  riot_game_name?: string;
  riot_tag_line?: string;
  discord?: string;
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

export default function TeamManagerPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { teams, getMyTeams, updateTeam, kickMember, promoteToOwner } = useTeam();
  const navigate = useNavigate();
  const toast = useToast();

  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: '',
    tag: '',
    description: '',
    team_color: '#3D7A5F',
  });
  const [inviteFormData, setInviteFormData] = useState({
    username: '',
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
    // Wait for auth to load before checking authentication
    if (authLoading) return;

    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    getMyTeams();
  }, [isAuthenticated, authLoading]);

  useEffect(() => {
    if (teams.length > 0 && !selectedTeam) {
      setSelectedTeam(teams[0]);
    }
  }, [teams]);

  // Auto-refresh team data every 30 seconds
  useAutoRefresh({
    onRefresh: () => {
      if (isAuthenticated) {
        getMyTeams();
      }
    },
    interval: 30000, // 30 seconds
    enabled: isAuthenticated
  });

  const handleEditTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeam) return;

    const result = await updateTeam(selectedTeam.id, editFormData);
    if (result) {
      toast?.success('Team updated successfully');
      setShowEditModal(false);
      await getMyTeams();
      setSelectedTeam(result);
    } else {
      toast?.error('Failed to update team');
    }
  };

  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeam) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/teams/${selectedTeam.id}/invite`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: inviteFormData.username }),
      });

      if (response.ok) {
        toast?.success('Invitation sent successfully');
        setShowInviteModal(false);
        setInviteFormData({ username: '' });
      } else {
        const error = await response.json();
        toast?.error(error.detail || 'Failed to send invitation');
      }
    } catch (error) {
      toast?.error('Failed to send invitation');
    }
  };

  const handleKickMember = async (memberId: string, memberName: string) => {
    if (!selectedTeam) return;

    setConfirmDialog({
      show: true,
      title: 'Kick Member',
      message: `Are you sure you want to kick ${memberName} from the team?`,
      type: 'danger',
      onConfirm: async () => {
        const success = await kickMember(selectedTeam.id, memberId);
        if (success) {
          toast?.success(`${memberName} has been kicked from the team`);
          await getMyTeams();
          const updatedTeam = teams.find(t => t.id === selectedTeam.id);
          if (updatedTeam) setSelectedTeam(updatedTeam);
        } else {
          toast?.error('Failed to kick member');
        }
        setConfirmDialog({ ...confirmDialog, show: false });
      }
    });
  };

  const handlePromoteToOwner = async (memberId: string, memberName: string) => {
    if (!selectedTeam) return;

    setConfirmDialog({
      show: true,
      title: 'Promote to Owner',
      message: `Are you sure you want to promote ${memberName} to owner? You will lose your owner role.`,
      type: 'warning',
      onConfirm: async () => {
        const success = await promoteToOwner(selectedTeam.id, memberId);
        if (success) {
          toast?.success(`${memberName} is now the team owner`);
          await getMyTeams();
          const updatedTeam = teams.find(t => t.id === selectedTeam.id);
          if (updatedTeam) setSelectedTeam(updatedTeam);
        } else {
          toast?.error('Failed to promote member');
        }
        setConfirmDialog({ ...confirmDialog, show: false });
      }
    });
  };

  const openEditModal = () => {
    if (!selectedTeam) return;
    setEditFormData({
      name: selectedTeam.name,
      tag: selectedTeam.tag || '',
      description: selectedTeam.description || '',
      team_color: selectedTeam.team_color,
    });
    setShowEditModal(true);
  };

  const handleDeleteTeam = () => {
    if (!selectedTeam) return;

    setConfirmDialog({
      show: true,
      title: 'Delete Team',
      message: `Are you sure you want to delete ${selectedTeam.name}? This action cannot be undone and all team data will be permanently lost.`,
      type: 'danger',
      onConfirm: async () => {
        const token = localStorage.getItem('token');
        try {
          const response = await fetch(`${API_BASE_URL}/api/teams/${selectedTeam.id}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });

          if (response.ok) {
            toast?.success('Team deleted successfully');
            await getMyTeams();
            navigate('/profile');
          } else {
            toast?.error('Failed to delete team');
          }
        } catch (error) {
          console.error('Failed to delete team:', error);
          toast?.error('Failed to delete team');
        }
        setConfirmDialog({ ...confirmDialog, show: false });
      }
    });
  };

  if (!selectedTeam) {
    return (
      <div className="min-h-screen bg-[#0E0E0E] flex flex-col" style={{ fontFamily: 'Inter, sans-serif' }}>
        <Header
          brandName="OpenRift"
          tagline="PRO TOOLS FOR EVERYONE"
          showToolsLink={true}
        />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-[#F5F5F5]/5 flex items-center justify-center">
              <svg className="w-12 h-12 text-[#F5F5F5]/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h2 className="text-[#F5F5F5] text-2xl font-semibold mb-3">No Team</h2>
            <p className="text-[#F5F5F5]/50 mb-6">Create or join a team to access the team manager</p>
            <button
              onClick={() => navigate('/profile')}
              className="px-8 py-3 bg-[#3D7A5F] text-[#F5F5F5] font-medium hover:bg-[#3D7A5F]/90 transition-colors"
            >
              Go to Profile
            </button>
          </div>
        </div>
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

  const isOwner = selectedTeam.owner_id === user?.id;

  return (
    <div className="min-h-screen bg-[#0E0E0E] flex flex-col" style={{ fontFamily: 'Inter, sans-serif' }}>
      <Header
        brandName="OpenRift"
        tagline="PRO TOOLS FOR EVERYONE"
        showToolsLink={true}
      />

      {/* Page Header */}
      <div className="border-b border-[#F5F5F5]/10 py-12">
        <div className="max-w-[1600px] mx-auto px-12">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div
                className="w-20 h-20 rounded-lg flex items-center justify-center text-3xl font-bold text-white"
                style={{ backgroundColor: selectedTeam.team_color }}
              >
                {selectedTeam.tag || selectedTeam.name.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <h1 className="text-[#F5F5F5] text-4xl font-semibold mb-2">
                  {selectedTeam.name}
                </h1>
                <p className="text-[#F5F5F5]/50 text-lg">
                  {selectedTeam.description || 'No description'}
                </p>
              </div>
            </div>
            {isOwner && (
              <button
                onClick={openEditModal}
                className="px-6 py-3 bg-[#3D7A5F] text-[#F5F5F5] font-medium hover:bg-[#3D7A5F]/90 transition-colors"
              >
                Edit Team
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 py-16">
        <div className="max-w-[1600px] mx-auto px-12">
          <div className="grid grid-cols-3 gap-8">

            {/* Team Stats */}
            <div className="col-span-1 space-y-6">
              <div className="border border-[#F5F5F5]/10 p-6 bg-[#F5F5F5]/[0.02]">
                <h3 className="text-[#F5F5F5] text-lg font-semibold mb-4">Statistics</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-[#F5F5F5]/50 text-sm mb-1">Members</p>
                    <p className="text-[#F5F5F5] text-2xl font-semibold">
                      {selectedTeam.member_count}/{selectedTeam.max_members}
                    </p>
                  </div>
                  <div>
                    <p className="text-[#F5F5F5]/50 text-sm mb-1">Created</p>
                    <p className="text-[#F5F5F5] text-lg">
                      {new Date(selectedTeam.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-[#F5F5F5]/50 text-sm mb-1">Tag</p>
                    <p className="text-[#F5F5F5] text-lg font-medium">
                      {selectedTeam.tag || 'None'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="border border-[#F5F5F5]/10 p-6 bg-[#F5F5F5]/[0.02]">
                <h3 className="text-[#F5F5F5] text-lg font-semibold mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  {isOwner && (
                    <button
                      onClick={() => setShowInviteModal(true)}
                      className="w-full px-4 py-3 bg-[#3D7A5F] text-[#F5F5F5] font-medium hover:bg-[#3D7A5F]/90 transition-colors text-left"
                    >
                      Invite Player
                    </button>
                  )}
                  <button
                    onClick={() => navigate('/scrim-scheduler')}
                    className="w-full px-4 py-3 border border-[#F5F5F5]/20 text-[#F5F5F5] hover:bg-[#F5F5F5]/10 transition-colors text-left"
                  >
                    Schedule Scrim
                  </button>
                  {isOwner && (
                    <button
                      onClick={handleDeleteTeam}
                      className="w-full px-4 py-3 border border-[#C75B5B]/50 text-[#C75B5B] hover:bg-[#C75B5B]/10 transition-colors text-left"
                    >
                      Delete Team
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Team Members */}
            <div className="col-span-2 border border-[#F5F5F5]/10 bg-[#F5F5F5]/[0.02]">
              <div className="p-6 border-b border-[#F5F5F5]/10">
                <div className="flex items-center justify-between">
                  <h3 className="text-[#F5F5F5] text-lg font-semibold">
                    Team Members ({selectedTeam.members.length}/{selectedTeam.max_members})
                  </h3>
                </div>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 gap-4">
                  {selectedTeam.members.map((member) => {
                    const isMemberOwner = member.id === selectedTeam.owner_id;
                    return (
                      <div
                        key={member.id}
                        className="bg-[#0E0E0E] border border-[#F5F5F5]/10 hover:border-[#F5F5F5]/20 transition-all group"
                      >
                        <div className="p-5">
                          <div className="flex items-start justify-between">
                            {/* Left: Avatar & Info */}
                            <div className="flex gap-4 flex-1">
                              {/* Avatar */}
                              <div
                                className="w-16 h-16 rounded-lg flex items-center justify-center text-white font-bold text-xl flex-shrink-0"
                                style={{ backgroundColor: selectedTeam.team_color }}
                              >
                                {member.username.substring(0, 2).toUpperCase()}
                              </div>

                              {/* Member Info */}
                              <div className="flex-1 min-w-0">
                                {/* Name & Role */}
                                <div className="flex items-center gap-2 mb-2">
                                  <h4 className="text-[#F5F5F5] text-lg font-semibold truncate">
                                    {member.username}
                                  </h4>
                                  {isMemberOwner && (
                                    <span className="px-2.5 py-1 bg-[#3D7A5F]/20 text-[#3D7A5F] text-xs font-medium rounded">
                                      OWNER
                                    </span>
                                  )}
                                </div>

                                {/* Contact Info */}
                                <div className="flex items-center gap-6">
                                  {/* Riot ID */}
                                  <div className="flex items-center gap-2">
                                    <svg className="w-4 h-4 text-[#F5F5F5]/40 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                    <p className="text-[#F5F5F5] text-sm font-medium">
                                      {member.riot_game_name && member.riot_tag_line
                                        ? `${member.riot_game_name}#${member.riot_tag_line}`
                                        : <span className="text-[#F5F5F5]/40">No Riot ID</span>
                                      }
                                    </p>
                                  </div>

                                  {/* Discord */}
                                  <div className="flex items-center gap-2">
                                    <svg className="w-4 h-4 text-[#F5F5F5]/40 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                                      <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                                    </svg>
                                    <p className="text-[#F5F5F5] text-sm font-medium">
                                      {member.discord || <span className="text-[#F5F5F5]/40">No Discord</span>}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Right: Actions */}
                            {isOwner && !isMemberOwner && (
                              <div className="flex flex-col gap-2 ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => handlePromoteToOwner(member.id, member.username)}
                                  className="px-2 py-1.5 text-xs border border-[#F5F5F5]/20 text-[#F5F5F5] hover:bg-[#F5F5F5]/10 transition-colors whitespace-nowrap"
                                  title="Transfer ownership to this member"
                                >
                                  Promote
                                </button>
                                <button
                                  onClick={() => handleKickMember(member.id, member.username)}
                                  className="px-2 py-1.5 text-xs border border-[#C75B5B]/50 text-[#C75B5B] hover:bg-[#C75B5B]/10 transition-colors"
                                  title="Remove from team"
                                >
                                  Kick
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Team Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowEditModal(false)}>
          <div className="bg-[#1A1A1A] border border-[#F5F5F5]/10 p-8 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-[#F5F5F5] text-2xl font-semibold mb-6">Edit Team</h2>
            <form onSubmit={handleEditTeam}>
              <div className="space-y-4">
                <div>
                  <label className="block text-[#F5F5F5]/70 text-sm mb-2">Team Name *</label>
                  <input
                    type="text"
                    value={editFormData.name}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    className="w-full px-4 py-2.5 bg-[#0E0E0E] border border-[#F5F5F5]/10 text-[#F5F5F5] focus:outline-none focus:border-[#3D7A5F]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[#F5F5F5]/70 text-sm mb-2">Team Tag</label>
                  <input
                    type="text"
                    value={editFormData.tag}
                    onChange={(e) => setEditFormData({ ...editFormData, tag: e.target.value })}
                    className="w-full px-4 py-2.5 bg-[#0E0E0E] border border-[#F5F5F5]/10 text-[#F5F5F5] focus:outline-none focus:border-[#3D7A5F]"
                    maxLength={5}
                  />
                </div>
                <div>
                  <label className="block text-[#F5F5F5]/70 text-sm mb-2">Description</label>
                  <textarea
                    value={editFormData.description}
                    onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                    className="w-full px-4 py-2.5 bg-[#0E0E0E] border border-[#F5F5F5]/10 text-[#F5F5F5] focus:outline-none focus:border-[#3D7A5F] resize-none"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-[#F5F5F5]/70 text-sm mb-2">Team Color</label>
                  <div className="flex gap-3">
                    {['#3D7A5F', '#5B8FB9', '#B4975A', '#8B5A9F', '#C75B5B'].map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setEditFormData({ ...editFormData, team_color: color })}
                        className={`w-10 h-10 rounded transition-all ${editFormData.team_color === color ? 'ring-2 ring-[#F5F5F5] scale-110' : 'hover:scale-105'}`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-6 py-2.5 border border-[#F5F5F5]/20 text-[#F5F5F5] hover:bg-[#F5F5F5]/10 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-2.5 bg-[#3D7A5F] text-[#F5F5F5] font-medium hover:bg-[#3D7A5F]/90 transition-colors"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invite User Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowInviteModal(false)}>
          <div className="bg-[#1A1A1A] border border-[#F5F5F5]/10 p-8 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-[#F5F5F5] text-2xl font-semibold mb-6">Invite Player</h2>
            <form onSubmit={handleInviteUser}>
              <div className="space-y-4">
                <div>
                  <label className="block text-[#F5F5F5]/70 text-sm mb-2">Username *</label>
                  <input
                    type="text"
                    value={inviteFormData.username}
                    onChange={(e) => setInviteFormData({ ...inviteFormData, username: e.target.value })}
                    className="w-full px-4 py-2.5 bg-[#0E0E0E] border border-[#F5F5F5]/10 text-[#F5F5F5] focus:outline-none focus:border-[#3D7A5F]"
                    required
                    placeholder="Enter username"
                  />
                  <p className="text-[#F5F5F5]/40 text-xs mt-1">The user will be added as a team member</p>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="flex-1 px-6 py-2.5 border border-[#F5F5F5]/20 text-[#F5F5F5] hover:bg-[#F5F5F5]/10 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-2.5 bg-[#3D7A5F] text-[#F5F5F5] font-medium hover:bg-[#3D7A5F]/90 transition-colors"
                >
                  Send Invitation
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
          type={confirmDialog.type}
          onConfirm={confirmDialog.onConfirm}
          onCancel={() => setConfirmDialog({ ...confirmDialog, show: false })}
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
