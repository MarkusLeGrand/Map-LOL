import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTeam } from '../../contexts/TeamContext';
import { useToast } from '../../contexts/ToastContext';
import { Header } from '../../components/layout/Header';
import { Footer } from '../../components/layout/Footer';
import { getSummonerData, getProfileIconUrl, type SummonerData, type RiotAccount } from '../../services/riotApi';
import { ImageWithFallback } from '../../components/ui/ImageWithFallback';

export default function DashboardPage() {
  const { user } = useAuth();
  const { teams, invites, joinRequests, createTeam, getMyTeams, acceptInvite } = useTeam();
  const navigate = useNavigate();
  const toast = useToast();

  const [summonerData, setSummonerData] = useState<SummonerData | null>(null);
  const [riotAccount, setRiotAccount] = useState<RiotAccount | null>(null);
  const [isLoadingSummoner, setIsLoadingSummoner] = useState(false);
  const [showCreateTeamModal, setShowCreateTeamModal] = useState(false);
  const [teamFormData, setTeamFormData] = useState({
    name: '',
    tag: '',
    description: '',
    team_color: '#3D7A5F',
  });

  useEffect(() => {
    if (user?.riot_game_name) {
      loadSummonerData();
    }
  }, [user?.riot_game_name]);

  const loadSummonerData = async () => {
    setIsLoadingSummoner(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const data = await getSummonerData(token);
      setSummonerData(data.summoner);
      setRiotAccount(data.riot_account);
    } catch (error) {
      // Silently fail - summoner data is optional
    } finally {
      setIsLoadingSummoner(false);
    }
  };

  // Load teams on mount
  useEffect(() => {
    getMyTeams();
  }, []);

  // Handle create team
  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createTeam(teamFormData);
      toast?.success('Team created successfully!');
      setShowCreateTeamModal(false);
      setTeamFormData({ name: '', tag: '', description: '', team_color: '#3D7A5F' });
      await getMyTeams();
    } catch (error) {
      toast?.error(error instanceof Error ? error.message : 'Failed to create team');
    }
  };

  // Handle accept invite
  const handleAcceptInvite = async (inviteId: string) => {
    try {
      await acceptInvite(inviteId);
      toast?.success('Invite accepted!');
      await getMyTeams();
    } catch (error) {
      toast?.error('Failed to accept invite');
    }
  };

  // Get user's main team (first team they're in)
  const myTeam = teams.length > 0 ? teams[0] : null;
  const totalNotifications = invites.length + joinRequests.length;

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
            <div className="flex-shrink-0 relative">
              {isLoadingSummoner ? (
                <div className="w-40 h-40 rounded-lg border-2 border-[#F5F5F5]/20 bg-[#F5F5F5]/5 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#B4975A]"></div>
                </div>
              ) : summonerData?.profile_icon_id ? (
                <ImageWithFallback
                  src={getProfileIconUrl(summonerData.profile_icon_id)}
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

              {/* Stats Line: Role, Team, Rank, Level */}
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

      {/* Main Content - Command Center */}
      <div className="flex-1 py-12">
        <div className="max-w-[1600px] mx-auto px-12">
          <div className="grid grid-cols-12 gap-6">

            {/* Left Column - Quick Navigation */}
            <div className="col-span-4 space-y-6">
              {/* Quick Navigation */}
              <div className="border border-[#F5F5F5]/10 bg-[#F5F5F5]/[0.02] rounded">
                <div className="px-5 py-4 border-b border-[#F5F5F5]/10">
                  <h2 className="text-[#F5F5F5] text-lg font-semibold">Quick Navigation</h2>
                </div>
                <div className="p-4 space-y-2">
                  <button
                    onClick={() => navigate('/favorite-tools')}
                    className="w-full px-4 py-3 text-left border border-[#F5F5F5]/10 hover:border-[#3D7A5F]/40 hover:bg-[#3D7A5F]/5 transition-all rounded flex items-center gap-3"
                  >
                    <svg className="w-5 h-5 text-[#F5F5F5]/60" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
                    </svg>
                    <span className="text-[#F5F5F5] font-medium">Favorite Tools</span>
                  </button>
                  <button
                    onClick={() => navigate('/tools')}
                    className="w-full px-4 py-3 text-left border border-[#F5F5F5]/10 hover:border-[#3D7A5F]/40 hover:bg-[#3D7A5F]/5 transition-all rounded flex items-center gap-3"
                  >
                    <svg className="w-5 h-5 text-[#F5F5F5]/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                    <span className="text-[#F5F5F5] font-medium">All Tools</span>
                  </button>
                  <button
                    onClick={() => navigate('/settings')}
                    className="w-full px-4 py-3 text-left border border-[#F5F5F5]/10 hover:border-[#3D7A5F]/40 hover:bg-[#3D7A5F]/5 transition-all rounded flex items-center gap-3"
                  >
                    <svg className="w-5 h-5 text-[#F5F5F5]/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="text-[#F5F5F5] font-medium">Settings</span>
                  </button>
                </div>
              </div>

              {/* Riot Account Setup / Data Sync */}
              {user?.riot_game_name ? (
                <div className="border border-[#F5F5F5]/10 bg-[#F5F5F5]/[0.02] rounded">
                  <div className="px-5 py-4 border-b border-[#F5F5F5]/10">
                    <h2 className="text-[#F5F5F5] text-lg font-semibold">Riot Data</h2>
                  </div>
                  <div className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[#F5F5F5]/60 text-sm">Last synced</span>
                      <span className="text-[#F5F5F5] text-sm font-medium">
                        {summonerData?.last_synced ? new Date(summonerData.last_synced).toLocaleDateString() : 'Never'}
                      </span>
                    </div>
                    <button
                      onClick={async () => {
                        try {
                          const { syncRiotData } = await import('../../services/riotApi');
                          const token = localStorage.getItem('token');
                          if (!token) return;
                          await syncRiotData(token);
                          await loadSummonerData();
                          toast?.success('Data synced successfully!');
                        } catch (error) {
                          const errorMessage = error instanceof Error ? error.message : 'Failed to sync';
                          if (errorMessage.includes('No Riot account linked')) {
                            toast?.error('Please verify your Riot ID in Settings first by clicking the Save button.');
                          } else {
                            toast?.error(errorMessage);
                          }
                        }
                      }}
                      className="w-full px-4 py-2 bg-[#3D7A5F] text-[#F5F5F5] hover:bg-[#3D7A5F]/90 transition-colors rounded font-medium"
                    >
                      Sync Now
                    </button>
                  </div>
                </div>
              ) : (
                <div className="border border-[#B4975A]/20 bg-[#B4975A]/5 rounded">
                  <div className="px-5 py-4 border-b border-[#B4975A]/20">
                    <h2 className="text-[#F5F5F5] text-lg font-semibold">Setup Riot Account</h2>
                  </div>
                  <div className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[#F5F5F5]/60 text-sm">Status</span>
                      <span className="text-[#B4975A] text-sm font-medium">Not configured</span>
                    </div>
                    <button
                      onClick={() => navigate('/settings')}
                      className="w-full px-4 py-2 bg-[#B4975A] text-[#F5F5F5] hover:bg-[#B4975A]/90 transition-colors rounded font-medium"
                    >
                      Go to Settings
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Widgets */}
            <div className="col-span-8 space-y-6">
              {/* Notifications Widget */}
              {totalNotifications > 0 && (
                <div className="border border-[#B4975A]/20 bg-[#B4975A]/5 rounded">
                  <div className="px-5 py-4 border-b border-[#B4975A]/20">
                    <div className="flex items-center justify-between">
                      <h2 className="text-[#F5F5F5] text-lg font-semibold">Notifications</h2>
                      <span className="px-2 py-1 bg-[#B4975A] text-[#F5F5F5] text-xs font-bold rounded">
                        {totalNotifications}
                      </span>
                    </div>
                  </div>
                  <div className="p-5">
                    <p className="text-[#F5F5F5]/80 mb-4">
                      You have {invites.length} team {invites.length === 1 ? 'invite' : 'invites'} and {joinRequests.length} join {joinRequests.length === 1 ? 'request' : 'requests'} pending.
                    </p>
                    <button
                      onClick={() => navigate('/teams')}
                      className="px-6 py-2 bg-[#B4975A] text-[#F5F5F5] hover:bg-[#B4975A]/90 transition-colors rounded font-medium"
                    >
                      View All Notifications
                    </button>
                  </div>
                </div>
              )}

              {/* My Team Section */}
              <div className="border border-[#F5F5F5]/10 bg-[#F5F5F5]/[0.02] rounded">
                <div className="px-5 py-4 border-b border-[#F5F5F5]/10">
                  <h2 className="text-[#F5F5F5] text-lg font-semibold">My Team</h2>
                </div>
                <div className="p-5">
                  {myTeam ? (
                    <div className="space-y-4">
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

                      {/* Open Team Manager Button */}
                      <button
                        onClick={() => navigate('/team-manager')}
                        className="w-full px-5 py-2.5 bg-[#3D7A5F] text-[#F5F5F5] font-medium hover:bg-[#3D7A5F]/90 transition-colors rounded text-sm"
                      >
                        My Team
                      </button>
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-[#F5F5F5]/5 flex items-center justify-center">
                        <svg className="w-8 h-8 text-[#F5F5F5]/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                      <h4 className="text-[#F5F5F5] text-base font-semibold mb-1.5">No Team Yet</h4>
                      <p className="text-[#F5F5F5]/50 text-xs mb-4">
                        Create your own team or wait for an invitation
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setShowCreateTeamModal(true)}
                          className="flex-1 px-4 py-2.5 bg-[#3D7A5F] text-[#F5F5F5] font-medium hover:bg-[#3D7A5F]/90 transition-colors rounded text-sm"
                        >
                          Create Team
                        </button>
                        <button
                          onClick={() => navigate('/teams')}
                          className="flex-1 px-4 py-2.5 border border-[#F5F5F5]/20 text-[#F5F5F5] font-medium hover:bg-[#F5F5F5]/5 transition-colors rounded text-sm"
                        >
                          Find Teams
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Team Invitations */}
                  {invites.length > 0 && (
                    <div className="pt-5 mt-5 border-t border-[#F5F5F5]/10">
                      <h3 className="text-[#F5F5F5]/80 text-sm font-semibold uppercase tracking-wider mb-3">
                        Team Invitations ({invites.length})
                      </h3>
                      <div className="space-y-2">
                        {invites.slice(0, 3).map((invite) => (
                          <div key={invite.id} className="p-3 bg-[#3D7A5F]/10 border border-[#3D7A5F]/20 rounded">
                            <p className="text-[#F5F5F5] font-semibold text-sm mb-0.5">{invite.team_name}</p>
                            <p className="text-[#F5F5F5]/50 text-xs mb-2">as {invite.role}</p>
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
                        {invites.length > 3 && (
                          <button
                            onClick={() => navigate('/team-manager')}
                            className="w-full text-[#3D7A5F] text-xs hover:underline"
                          >
                            View {invites.length - 3} more
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Access Tools */}
              <div className="border border-[#F5F5F5]/10 bg-[#F5F5F5]/[0.02] rounded">
                <div className="px-5 py-4 border-b border-[#F5F5F5]/10">
                  <h2 className="text-[#F5F5F5] text-lg font-semibold">Quick Access</h2>
                </div>
                <div className="p-5">
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => navigate('/tacticalmap')}
                      className="px-6 py-8 border border-[#F5F5F5]/10 hover:border-[#3D7A5F]/40 hover:bg-[#3D7A5F]/5 transition-all rounded text-center"
                    >
                      <div className="mb-3">
                        <svg className="w-10 h-10 mx-auto text-[#3D7A5F]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                        </svg>
                      </div>
                      <p className="text-[#F5F5F5] font-semibold">Tactical Map</p>
                      <p className="text-[#F5F5F5]/50 text-xs mt-1">Plan strategies</p>
                    </button>
                    <button
                      onClick={() => navigate('/data-analytics')}
                      className="px-6 py-8 border border-[#F5F5F5]/10 hover:border-[#3D7A5F]/40 hover:bg-[#3D7A5F]/5 transition-all rounded text-center"
                    >
                      <div className="mb-3">
                        <svg className="w-10 h-10 mx-auto text-[#3D7A5F]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                      <p className="text-[#F5F5F5] font-semibold">Scrim Data Analytics</p>
                      <p className="text-[#F5F5F5]/50 text-xs mt-1">View stats</p>
                    </button>
                  </div>
                </div>
              </div>
            </div>

          </div>
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
              <div className="flex gap-4 mt-8">
                <button
                  type="button"
                  onClick={() => setShowCreateTeamModal(false)}
                  className="flex-1 px-6 py-3 border border-[#F5F5F5]/20 text-[#F5F5F5] font-medium hover:bg-[#F5F5F5]/5 transition-colors rounded"
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
    </div>
  );
}
