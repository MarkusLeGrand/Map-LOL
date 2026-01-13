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
  const [isEditingAccount, setIsEditingAccount] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showSetPassword, setShowSetPassword] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [discordLoading, setDiscordLoading] = useState(false);
  const [hasPassword, setHasPassword] = useState<boolean | null>(null); // null = checking, true = has password, false = no password

  const [riotId, setRiotId] = useState(
    user?.riot_game_name && user?.riot_tag_line
      ? `${user.riot_game_name}#${user.riot_tag_line}`
      : ''
  );
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
      setUsername(user.username || '');
      setEmail(user.email || '');
    }
  }, [user]);

  // Check if user has a password set
  useEffect(() => {
    const checkPassword = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/api/auth/has-password`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setHasPassword(data.has_password);
        }
      } catch (error) {

        // Default to assuming they have a password
        setHasPassword(true);
      }
    };

    if (user) {
      checkPassword();
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

  const handleDiscordConnect = async () => {
    setDiscordLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/discord/auth/authorize`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to get Discord authorization URL');
      }

      const data = await response.json();
      // Redirect to Discord OAuth
      window.location.href = data.authorization_url;
    } catch (error) {

      toast?.error('Failed to connect to Discord');
      setDiscordLoading(false);
    }
  };

  const handleDiscordDisconnect = async () => {
    // Check if user has a password before allowing Discord disconnect
    if (hasPassword === false) {
      toast?.error('You must set a password before disconnecting Discord. Otherwise you will lose access to your account!');
      return;
    }

    if (!confirm('Are you sure you want to unlink your Discord account?')) {
      return;
    }

    setDiscordLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/discord/unlink`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to unlink Discord');
      }

      // Refresh user data
      const userResponse = await fetch(`${API_BASE_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const userData = await userResponse.json();
      updateUser(userData);

      toast?.success('Discord account unlinked successfully');
    } catch (error) {

      toast?.error('Failed to unlink Discord account');
    } finally {
      setDiscordLoading(false);
    }
  };

  const handleSetPassword = async () => {
    if (newPassword !== confirmPassword) {
      toast?.error('Passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      toast?.error('Password must be at least 8 characters long');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/auth/set-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          new_password: newPassword,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to set password');
      }

      toast?.success('Password set successfully! You can now log in with email/password.');
      setHasPassword(true);
      setShowSetPassword(false);
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      toast?.error(error instanceof Error ? error.message : 'Failed to set password');
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

          <div className="max-w-[900px] mx-auto">
            {/* Main Settings Column */}
            <div className="space-y-6">
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

                      {/* Password Management in Account Section */}
                      <div className="border-t border-[#F5F5F5]/10 pt-4 mt-6">
                        <label className="block text-[#F5F5F5]/60 text-xs uppercase tracking-wider mb-3">Password</label>
                        {hasPassword === null ? (
                          <div className="text-[#F5F5F5]/60 text-sm text-center py-4">
                            Loading...
                          </div>
                        ) : hasPassword === false ? (
                          // User has NO password (Discord-only user) - Show "Set Password"
                          <>
                            {!showSetPassword ? (
                              <div className="space-y-4">
                                <div className="bg-[#5865F2]/10 border border-[#5865F2]/20 rounded p-3">
                                  <p className="text-[#F5F5F5]/80 text-xs mb-2">
                                    You signed up with Discord and don't have a password yet. Set a password to:
                                  </p>
                                  <ul className="text-[#F5F5F5]/70 text-xs space-y-1 ml-4 list-disc">
                                    <li>Enable email/password login</li>
                                    <li>Keep account access if you unlink Discord</li>
                                  </ul>
                                </div>
                                <button
                                  onClick={() => setShowSetPassword(true)}
                                  className="w-full px-4 py-3 bg-[#3D7A5F] text-[#F5F5F5] font-medium hover:bg-[#3D7A5F]/90 transition-colors rounded"
                                >
                                  Set Password
                                </button>
                              </div>
                            ) : (
                              <div className="space-y-4">
                                <div className="bg-[#3D7A5F]/10 border border-[#3D7A5F]/20 rounded p-3">
                                  <p className="text-[#F5F5F5]/80 text-xs">
                                    Create a password to enable email/password login
                                  </p>
                                </div>
                                <div>
                                  <label className="block text-[#F5F5F5]/60 text-xs mb-2">New Password (min 8 characters)</label>
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
                                    onClick={handleSetPassword}
                                    className="flex-1 px-4 py-2 bg-[#3D7A5F] text-[#F5F5F5] text-sm font-medium hover:bg-[#3D7A5F]/90 transition-colors rounded"
                                  >
                                    Set Password
                                  </button>
                                  <button
                                    onClick={() => {
                                      setShowSetPassword(false);
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
                          </>
                        ) : (
                          // User HAS a password - Show "Change Password"
                          <>
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
                          </>
                        )}
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

              {/* Discord OAuth */}
              <div className="border border-[#F5F5F5]/10 bg-[#F5F5F5]/[0.02] rounded">
                <div className="px-6 py-5 border-b border-[#F5F5F5]/10">
                  <div className="flex items-center gap-3">
                    <svg className="w-6 h-6 text-[#5865F2]" fill="currentColor" viewBox="0 0 71 55">
                      <path d="M60.1045 4.8978C55.5792 2.8214 50.7265 1.2916 45.6527 0.41542C45.5603 0.39851 45.468 0.440769 45.4204 0.525289C44.7963 1.6353 44.105 3.0834 43.6209 4.2216C38.1637 3.4046 32.7345 3.4046 27.3892 4.2216C26.905 3.0581 26.1886 1.6353 25.5617 0.525289C25.5141 0.443589 25.4218 0.40133 25.3294 0.41542C20.2584 1.2888 15.4057 2.8186 10.8776 4.8978C10.8384 4.9147 10.8048 4.9429 10.7825 4.9795C1.57795 18.7309 -0.943561 32.1443 0.293408 45.3914C0.299005 45.4562 0.335386 45.5182 0.385761 45.5576C6.45866 50.0174 12.3413 52.7249 18.1147 54.5195C18.2071 54.5477 18.305 54.5139 18.3638 54.4378C19.7295 52.5728 20.9469 50.6063 21.9907 48.5383C22.0523 48.4172 21.9935 48.2735 21.8676 48.2256C19.9366 47.4931 18.0979 46.6 16.3292 45.5858C16.1893 45.5041 16.1781 45.304 16.3068 45.2082C16.679 44.9293 17.0513 44.6391 17.4067 44.3461C17.471 44.2926 17.5606 44.2813 17.6362 44.3151C29.2558 49.6202 41.8354 49.6202 53.3179 44.3151C53.3935 44.2785 53.4831 44.2898 53.5502 44.3433C53.9057 44.6363 54.2779 44.9293 54.6529 45.2082C54.7816 45.304 54.7732 45.5041 54.6333 45.5858C52.8646 46.6197 51.0259 47.4931 49.0921 48.2228C48.9662 48.2707 48.9102 48.4172 48.9718 48.5383C50.038 50.6034 51.2554 52.5699 52.5959 54.435C52.6519 54.5139 52.7526 54.5477 52.845 54.5195C58.6464 52.7249 64.529 50.0174 70.6019 45.5576C70.6551 45.5182 70.6887 45.459 70.6943 45.3942C72.1747 30.0791 68.2147 16.7757 60.1968 4.9823C60.1772 4.9429 60.1437 4.9147 60.1045 4.8978ZM23.7259 37.3253C20.2276 37.3253 17.3451 34.1136 17.3451 30.1693C17.3451 26.225 20.1717 23.0133 23.7259 23.0133C27.308 23.0133 30.1626 26.2532 30.1066 30.1693C30.1066 34.1136 27.28 37.3253 23.7259 37.3253ZM47.3178 37.3253C43.8196 37.3253 40.9371 34.1136 40.9371 30.1693C40.9371 26.225 43.7636 23.0133 47.3178 23.0133C50.9 23.0133 53.7545 26.2532 53.6986 30.1693C53.6986 34.1136 50.9 37.3253 47.3178 37.3253Z"/>
                    </svg>
                    <div>
                      <h2 className="text-[#F5F5F5] text-xl font-semibold">Discord</h2>
                      <p className="text-[#F5F5F5]/50 text-sm mt-0.5">
                        {user?.discord_verified ? 'OAuth Connected' : 'Connect with your team'}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  {user?.discord_verified ? (
                    <div className="px-4 py-3 bg-[#5865F2]/10 border border-[#5865F2]/20 rounded flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <svg className="w-5 h-5 text-[#5865F2]" fill="currentColor" viewBox="0 0 71 55">
                          <path d="M60.1045 4.8978C55.5792 2.8214 50.7265 1.2916 45.6527 0.41542C45.5603 0.39851 45.468 0.440769 45.4204 0.525289C44.7963 1.6353 44.105 3.0834 43.6209 4.2216C38.1637 3.4046 32.7345 3.4046 27.3892 4.2216C26.905 3.0581 26.1886 1.6353 25.5617 0.525289C25.5141 0.443589 25.4218 0.40133 25.3294 0.41542C20.2584 1.2888 15.4057 2.8186 10.8776 4.8978C10.8384 4.9147 10.8048 4.9429 10.7825 4.9795C1.57795 18.7309 -0.943561 32.1443 0.293408 45.3914C0.299005 45.4562 0.335386 45.5182 0.385761 45.5576C6.45866 50.0174 12.3413 52.7249 18.1147 54.5195C18.2071 54.5477 18.305 54.5139 18.3638 54.4378C19.7295 52.5728 20.9469 50.6063 21.9907 48.5383C22.0523 48.4172 21.9935 48.2735 21.8676 48.2256C19.9366 47.4931 18.0979 46.6 16.3292 45.5858C16.1893 45.5041 16.1781 45.304 16.3068 45.2082C16.679 44.9293 17.0513 44.6391 17.4067 44.3461C17.471 44.2926 17.5606 44.2813 17.6362 44.3151C29.2558 49.6202 41.8354 49.6202 53.3179 44.3151C53.3935 44.2785 53.4831 44.2898 53.5502 44.3433C53.9057 44.6363 54.2779 44.9293 54.6529 45.2082C54.7816 45.304 54.7732 45.5041 54.6333 45.5858C52.8646 46.6197 51.0259 47.4931 49.0921 48.2228C48.9662 48.2707 48.9102 48.4172 48.9718 48.5383C50.038 50.6034 51.2554 52.5699 52.5959 54.435C52.6519 54.5139 52.7526 54.5477 52.845 54.5195C58.6464 52.7249 64.529 50.0174 70.6019 45.5576C70.6551 45.5182 70.6887 45.459 70.6943 45.3942C72.1747 30.0791 68.2147 16.7757 60.1968 4.9823C60.1772 4.9429 60.1437 4.9147 60.1045 4.8978ZM23.7259 37.3253C20.2276 37.3253 17.3451 34.1136 17.3451 30.1693C17.3451 26.225 20.1717 23.0133 23.7259 23.0133C27.308 23.0133 30.1626 26.2532 30.1066 30.1693C30.1066 34.1136 27.28 37.3253 23.7259 37.3253ZM47.3178 37.3253C43.8196 37.3253 40.9371 34.1136 40.9371 30.1693C40.9371 26.225 43.7636 23.0133 47.3178 23.0133C50.9 23.0133 53.7545 26.2532 53.6986 30.1693C53.6986 34.1136 50.9 37.3253 47.3178 37.3253Z"/>
                        </svg>
                        <div>
                          <p className="text-[#F5F5F5] font-medium">{user.discord}</p>
                          <p className="text-[#3D7A5F] text-xs">Connected via OAuth</p>
                        </div>
                      </div>
                      <button
                        onClick={handleDiscordDisconnect}
                        disabled={discordLoading}
                        className="px-3 py-1.5 text-red-500 text-xs font-medium hover:bg-red-500/10 transition-colors rounded disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {discordLoading ? 'Disconnecting...' : 'Disconnect'}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <button
                        onClick={handleDiscordConnect}
                        disabled={discordLoading}
                        className="w-full px-4 py-3 bg-[#5865F2] text-[#F5F5F5] font-medium hover:bg-[#5865F2]/90 transition-colors rounded flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {discordLoading ? (
                          'Connecting...'
                        ) : (
                          <>
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 71 55">
                              <path d="M60.1045 4.8978C55.5792 2.8214 50.7265 1.2916 45.6527 0.41542C45.5603 0.39851 45.468 0.440769 45.4204 0.525289C44.7963 1.6353 44.105 3.0834 43.6209 4.2216C38.1637 3.4046 32.7345 3.4046 27.3892 4.2216C26.905 3.0581 26.1886 1.6353 25.5617 0.525289C25.5141 0.443589 25.4218 0.40133 25.3294 0.41542C20.2584 1.2888 15.4057 2.8186 10.8776 4.8978C10.8384 4.9147 10.8048 4.9429 10.7825 4.9795C1.57795 18.7309 -0.943561 32.1443 0.293408 45.3914C0.299005 45.4562 0.335386 45.5182 0.385761 45.5576C6.45866 50.0174 12.3413 52.7249 18.1147 54.5195C18.2071 54.5477 18.305 54.5139 18.3638 54.4378C19.7295 52.5728 20.9469 50.6063 21.9907 48.5383C22.0523 48.4172 21.9935 48.2735 21.8676 48.2256C19.9366 47.4931 18.0979 46.6 16.3292 45.5858C16.1893 45.5041 16.1781 45.304 16.3068 45.2082C16.679 44.9293 17.0513 44.6391 17.4067 44.3461C17.471 44.2926 17.5606 44.2813 17.6362 44.3151C29.2558 49.6202 41.8354 49.6202 53.3179 44.3151C53.3935 44.2785 53.4831 44.2898 53.5502 44.3433C53.9057 44.6363 54.2779 44.9293 54.6529 45.2082C54.7816 45.304 54.7732 45.5041 54.6333 45.5858C52.8646 46.6197 51.0259 47.4931 49.0921 48.2228C48.9662 48.2707 48.9102 48.4172 48.9718 48.5383C50.038 50.6034 51.2554 52.5699 52.5959 54.435C52.6519 54.5139 52.7526 54.5477 52.845 54.5195C58.6464 52.7249 64.529 50.0174 70.6019 45.5576C70.6551 45.5182 70.6887 45.459 70.6943 45.3942C72.1747 30.0791 68.2147 16.7757 60.1968 4.9823C60.1772 4.9429 60.1437 4.9147 60.1045 4.8978ZM23.7259 37.3253C20.2276 37.3253 17.3451 34.1136 17.3451 30.1693C17.3451 26.225 20.1717 23.0133 23.7259 23.0133C27.308 23.0133 30.1626 26.2532 30.1066 30.1693C30.1066 34.1136 27.28 37.3253 23.7259 37.3253ZM47.3178 37.3253C43.8196 37.3253 40.9371 34.1136 40.9371 30.1693C40.9371 26.225 43.7636 23.0133 47.3178 23.0133C50.9 23.0133 53.7545 26.2532 53.6986 30.1693C53.6986 34.1136 50.9 37.3253 47.3178 37.3253Z"/>
                            </svg>
                            Connect with Discord
                          </>
                        )}
                      </button>
                      <div className="bg-[#5865F2]/5 border border-[#5865F2]/20 rounded p-3">
                        <p className="text-[#F5F5F5]/70 text-xs">
                          Connect your Discord account to display your Discord tag to your teammates. This uses secure OAuth 2.0.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Danger Zone - Moved to bottom of main column */}
              <div className="border border-[#C75B5B]/30 bg-[#C75B5B]/[0.05] rounded">
                <div className="px-6 py-5 border-b border-[#C75B5B]/30">
                  <h2 className="text-[#C75B5B] text-xl font-semibold">Danger Zone</h2>
                  <p className="text-[#F5F5F5]/50 text-sm mt-1">Permanently delete your account</p>
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
