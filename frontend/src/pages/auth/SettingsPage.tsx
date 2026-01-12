import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { Header } from '../../components/layout/Header';
import { Footer } from '../../components/layout/Footer';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function SettingsPage() {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [isEditingRiot, setIsEditingRiot] = useState(false);
  const [isEditingDiscord, setIsEditingDiscord] = useState(false);
  const [isEditingAccount, setIsEditingAccount] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [riotId, setRiotId] = useState(
    user?.riot_game_name && user?.riot_tag_line
      ? `${user.riot_game_name}#${user.riot_tag_line}`
      : ''
  );
  const [discord, setDiscord] = useState(user?.discord || '');
  const [username, setUsername] = useState(user?.username || '');
  const [email, setEmail] = useState(user?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Sync local state with user data when it changes
  useEffect(() => {
    if (user) {
      setRiotId(
        user.riot_game_name && user.riot_tag_line
          ? `${user.riot_game_name}#${user.riot_tag_line}`
          : ''
      );
      setDiscord(user.discord || '');
      setUsername(user.username || '');
      setEmail(user.email || '');
    }
  }, [user]);

  const handleAccountUpdate = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          username: username !== user?.username ? username : undefined,
          email: email !== user?.email ? email : undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to update account');
      }

      const data = await response.json();
      updateUser(data);
      toast?.success('Account updated successfully!');
      setIsEditingAccount(false);
    } catch (error) {
      toast?.error(error instanceof Error ? error.message : 'Failed to update account');
    }
  };

  const handleRiotUpdate = async () => {
    try {
      const [gameName, tagLine] = riotId.split('#');
      if (!gameName || !tagLine) {
        toast?.error('Invalid Riot ID format. Use: GameName#TAG');
        return;
      }

      const token = localStorage.getItem('token');

      // Verify Riot account via API (this also saves it and gets PUUID)
      const response = await fetch(`${API_BASE_URL}/api/riot/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          game_name: gameName,
          tag_line: tagLine,
          platform: 'EUW1', // Default to EUW, could make this configurable
          region: 'europe',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to verify Riot account');
      }

      const data = await response.json();
      // Refresh user data
      const userResponse = await fetch(`${API_BASE_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const userData = await userResponse.json();
      updateUser(userData);

      toast?.success('Riot account verified and linked successfully!');
      setIsEditingRiot(false);
    } catch (error) {
      toast?.error(error instanceof Error ? error.message : 'Failed to verify Riot account');
    }
  };

  const handleDiscordUpdate = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ discord }),
      });

      if (!response.ok) throw new Error('Failed to update Discord');

      const data = await response.json();
      updateUser(data);
      toast?.success('Discord username updated!');
      setIsEditingDiscord(false);
    } catch (error) {
      toast?.error('Failed to update Discord username');
    }
  };

  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      toast?.error('New passwords do not match');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/auth/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to change password');
      }

      toast?.success('Password changed successfully!');
      setShowChangePassword(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      toast?.error(error instanceof Error ? error.message : 'Failed to change password');
    }
  };

  const handleDeleteAccount = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to delete account');

      toast?.success('Account deleted successfully');
      logout();
      navigate('/');
    } catch (error) {
      toast?.error('Failed to delete account');
    }
  };

  return (
    <div className="min-h-screen bg-[#0E0E0E] flex flex-col" style={{ fontFamily: 'Inter, sans-serif' }}>
      <Header />

      <div className="flex-1 py-12">
        <div className="max-w-[1200px] mx-auto px-12">
          {/* Page Title */}
          <div className="mb-8">
            <h1 className="text-[#F5F5F5] text-3xl font-bold mb-2">Settings</h1>
            <p className="text-[#F5F5F5]/60 text-sm">Manage your account and preferences</p>
          </div>

          <div className="grid grid-cols-12 gap-6">
            {/* Main Settings Column */}
            <div className="col-span-8 space-y-6">
              {/* Account Information */}
              <div className="border border-[#F5F5F5]/10 bg-[#F5F5F5]/[0.02] rounded">
                <div className="px-6 py-5 border-b border-[#F5F5F5]/10 flex items-center justify-between">
                  <div>
                    <h2 className="text-[#F5F5F5] text-xl font-semibold">Account</h2>
                    <p className="text-[#F5F5F5]/50 text-sm mt-1">Update your username and email</p>
                  </div>
                  {!isEditingAccount && (
                    <button
                      onClick={() => setIsEditingAccount(true)}
                      className="px-4 py-2 text-[#3D7A5F] text-sm font-medium hover:bg-[#3D7A5F]/10 transition-colors rounded"
                    >
                      Edit
                    </button>
                  )}
                </div>
                <div className="p-6">
                  {isEditingAccount ? (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-[#F5F5F5]/60 text-xs uppercase tracking-wider mb-2">Username</label>
                        <input
                          type="text"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          className="w-full px-4 py-3 bg-[#0E0E0E] border border-[#F5F5F5]/10 rounded text-[#F5F5F5] focus:outline-none focus:border-[#3D7A5F]/50"
                        />
                      </div>
                      <div>
                        <label className="block text-[#F5F5F5]/60 text-xs uppercase tracking-wider mb-2">Email</label>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full px-4 py-3 bg-[#0E0E0E] border border-[#F5F5F5]/10 rounded text-[#F5F5F5] focus:outline-none focus:border-[#3D7A5F]/50"
                        />
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={handleAccountUpdate}
                          className="flex-1 px-4 py-3 bg-[#3D7A5F] text-[#F5F5F5] font-medium hover:bg-[#3D7A5F]/90 transition-colors rounded"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => {
                            setIsEditingAccount(false);
                            setUsername(user?.username || '');
                            setEmail(user?.email || '');
                          }}
                          className="flex-1 px-4 py-3 border border-[#F5F5F5]/20 text-[#F5F5F5] font-medium hover:bg-[#F5F5F5]/5 transition-colors rounded"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-[#F5F5F5]/60 text-xs uppercase tracking-wider mb-2">Username</label>
                        <div className="px-4 py-3 bg-[#F5F5F5]/5 border border-[#F5F5F5]/10 rounded">
                          <p className="text-[#F5F5F5] font-medium">{user?.username}</p>
                        </div>
                      </div>
                      <div>
                        <label className="block text-[#F5F5F5]/60 text-xs uppercase tracking-wider mb-2">Email</label>
                        <div className="px-4 py-3 bg-[#F5F5F5]/5 border border-[#F5F5F5]/10 rounded">
                          <p className="text-[#F5F5F5] font-medium">{user?.email}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Riot Games Account */}
              <div className="border border-[#F5F5F5]/10 bg-[#F5F5F5]/[0.02] rounded">
                <div className="px-6 py-5 border-b border-[#F5F5F5]/10 flex items-center justify-between">
                  <div>
                    <h2 className="text-[#F5F5F5] text-xl font-semibold">Riot Games</h2>
                    <p className="text-[#F5F5F5]/50 text-sm mt-1">Connect your League of Legends account</p>
                  </div>
                  {!isEditingRiot && user?.riot_game_name && (
                    <button
                      onClick={() => setIsEditingRiot(true)}
                      className="px-4 py-2 text-[#3D7A5F] text-sm font-medium hover:bg-[#3D7A5F]/10 transition-colors rounded"
                    >
                      Edit
                    </button>
                  )}
                </div>
                <div className="p-6">
                  {isEditingRiot ? (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-[#F5F5F5]/60 text-xs uppercase tracking-wider mb-2">
                          Riot ID (GameName#TAG)
                        </label>
                        <input
                          type="text"
                          value={riotId}
                          onChange={(e) => setRiotId(e.target.value)}
                          placeholder="GameName#TAG"
                          className="w-full px-4 py-3 bg-[#0E0E0E] border border-[#F5F5F5]/10 rounded text-[#F5F5F5] focus:outline-none focus:border-[#3D7A5F]/50"
                        />
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={handleRiotUpdate}
                          className="flex-1 px-4 py-3 bg-[#3D7A5F] text-[#F5F5F5] font-medium hover:bg-[#3D7A5F]/90 transition-colors rounded"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => {
                            setIsEditingRiot(false);
                            setRiotId(
                              user?.riot_game_name && user?.riot_tag_line
                                ? `${user.riot_game_name}#${user.riot_tag_line}`
                                : ''
                            );
                          }}
                          className="flex-1 px-4 py-3 border border-[#F5F5F5]/20 text-[#F5F5F5] font-medium hover:bg-[#F5F5F5]/5 transition-colors rounded"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      {user?.riot_game_name ? (
                        <div className="px-4 py-3 bg-[#3D7A5F]/10 border border-[#3D7A5F]/20 rounded">
                          <p className="text-[#F5F5F5] font-medium">
                            {user.riot_game_name}#{user.riot_tag_line}
                          </p>
                        </div>
                      ) : (
                        <button
                          onClick={() => setIsEditingRiot(true)}
                          className="w-full px-4 py-3 bg-[#3D7A5F] text-[#F5F5F5] font-medium hover:bg-[#3D7A5F]/90 transition-colors rounded"
                        >
                          Connect Riot Account
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Discord */}
              <div className="border border-[#F5F5F5]/10 bg-[#F5F5F5]/[0.02] rounded">
                <div className="px-6 py-5 border-b border-[#F5F5F5]/10 flex items-center justify-between">
                  <div>
                    <h2 className="text-[#F5F5F5] text-xl font-semibold">Discord</h2>
                    <p className="text-[#F5F5F5]/50 text-sm mt-1">Connect with your team</p>
                  </div>
                  {!isEditingDiscord && user?.discord && (
                    <button
                      onClick={() => setIsEditingDiscord(true)}
                      className="px-4 py-2 text-[#3D7A5F] text-sm font-medium hover:bg-[#3D7A5F]/10 transition-colors rounded"
                    >
                      Edit
                    </button>
                  )}
                </div>
                <div className="p-6">
                  {isEditingDiscord ? (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-[#F5F5F5]/60 text-xs uppercase tracking-wider mb-2">
                          Discord Username
                        </label>
                        <input
                          type="text"
                          value={discord}
                          onChange={(e) => setDiscord(e.target.value)}
                          placeholder="username#0000"
                          className="w-full px-4 py-3 bg-[#0E0E0E] border border-[#F5F5F5]/10 rounded text-[#F5F5F5] focus:outline-none focus:border-[#3D7A5F]/50"
                        />
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={handleDiscordUpdate}
                          className="flex-1 px-4 py-3 bg-[#3D7A5F] text-[#F5F5F5] font-medium hover:bg-[#3D7A5F]/90 transition-colors rounded"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => {
                            setIsEditingDiscord(false);
                            setDiscord(user?.discord || '');
                          }}
                          className="flex-1 px-4 py-3 border border-[#F5F5F5]/20 text-[#F5F5F5] font-medium hover:bg-[#F5F5F5]/5 transition-colors rounded"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      {user?.discord ? (
                        <div className="px-4 py-3 bg-[#5865F2]/10 border border-[#5865F2]/20 rounded flex items-center gap-2">
                          <svg className="w-5 h-5 text-[#5865F2]" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>
                          </svg>
                          <p className="text-[#F5F5F5] font-medium">{user.discord}</p>
                        </div>
                      ) : (
                        <button
                          onClick={() => setIsEditingDiscord(true)}
                          className="w-full px-4 py-3 bg-[#5865F2]/20 text-[#5865F2] font-medium hover:bg-[#5865F2]/30 transition-colors rounded"
                        >
                          Add Discord Username
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="col-span-4 space-y-6">
              {/* Security */}
              <div className="border border-[#F5F5F5]/10 bg-[#F5F5F5]/[0.02] rounded">
                <div className="px-6 py-5 border-b border-[#F5F5F5]/10">
                  <h2 className="text-[#F5F5F5] text-xl font-semibold">Security</h2>
                </div>
                <div className="p-6">
                  {!showChangePassword ? (
                    <button
                      onClick={() => setShowChangePassword(true)}
                      className="w-full px-4 py-3 border border-[#F5F5F5]/20 text-[#F5F5F5] font-medium hover:bg-[#F5F5F5]/5 transition-colors rounded"
                    >
                      Change Password
                    </button>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-[#F5F5F5]/60 text-xs mb-2">Current Password</label>
                        <input
                          type="password"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          className="w-full px-4 py-2 bg-[#0E0E0E] border border-[#F5F5F5]/10 rounded text-[#F5F5F5] focus:outline-none focus:border-[#3D7A5F]/50"
                        />
                      </div>
                      <div>
                        <label className="block text-[#F5F5F5]/60 text-xs mb-2">New Password</label>
                        <input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full px-4 py-2 bg-[#0E0E0E] border border-[#F5F5F5]/10 rounded text-[#F5F5F5] focus:outline-none focus:border-[#3D7A5F]/50"
                        />
                      </div>
                      <div>
                        <label className="block text-[#F5F5F5]/60 text-xs mb-2">Confirm Password</label>
                        <input
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full px-4 py-2 bg-[#0E0E0E] border border-[#F5F5F5]/10 rounded text-[#F5F5F5] focus:outline-none focus:border-[#3D7A5F]/50"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={handlePasswordChange}
                          className="flex-1 px-4 py-2 bg-[#3D7A5F] text-[#F5F5F5] text-sm font-medium hover:bg-[#3D7A5F]/90 transition-colors rounded"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => {
                            setShowChangePassword(false);
                            setCurrentPassword('');
                            setNewPassword('');
                            setConfirmPassword('');
                          }}
                          className="flex-1 px-4 py-2 border border-[#F5F5F5]/20 text-[#F5F5F5] text-sm font-medium hover:bg-[#F5F5F5]/5 transition-colors rounded"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Danger Zone */}
              <div className="border border-[#C75B5B]/30 bg-[#C75B5B]/[0.05] rounded">
                <div className="px-6 py-5 border-b border-[#C75B5B]/30">
                  <h2 className="text-[#C75B5B] text-xl font-semibold">Danger Zone</h2>
                </div>
                <div className="p-6">
                  {!showDeleteConfirm ? (
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      className="w-full px-4 py-3 bg-[#C75B5B]/20 text-[#C75B5B] font-medium hover:bg-[#C75B5B]/30 transition-colors rounded"
                    >
                      Delete Account
                    </button>
                  ) : (
                    <div className="space-y-4">
                      <p className="text-[#F5F5F5]/70 text-sm">
                        This action is permanent and cannot be undone. All your data will be deleted.
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={handleDeleteAccount}
                          className="flex-1 px-4 py-2 bg-[#C75B5B] text-[#F5F5F5] text-sm font-medium hover:bg-[#C75B5B]/90 transition-colors rounded"
                        >
                          Confirm Delete
                        </button>
                        <button
                          onClick={() => setShowDeleteConfirm(false)}
                          className="flex-1 px-4 py-2 border border-[#F5F5F5]/20 text-[#F5F5F5] text-sm font-medium hover:bg-[#F5F5F5]/5 transition-colors rounded"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
