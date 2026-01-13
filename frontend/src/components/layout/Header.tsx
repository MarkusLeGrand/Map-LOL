import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { COLORS } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';
import { useTeam } from '../../contexts/TeamContext';
import { useToast } from '../../contexts/ToastContext';
import { getSummonerData } from '../../services/riotApi';
import { ImageWithFallback } from '../ui/ImageWithFallback';

interface HeaderProps {
    brandName?: string;
    tagline?: string;
    showToolsLink?: boolean;
    showAboutLink?: boolean;
}

export function Header({
    brandName = 'OpenRift',
    tagline = 'PRO TOOLS FOR EVERYONE',
    showToolsLink = true,
    showAboutLink = true,
}: HeaderProps) {
    const navigate = useNavigate();
    const { isAuthenticated, user, logout } = useAuth();
    const { invites, joinRequests, acceptInvite, getMyInvites, acceptJoinRequest, rejectJoinRequest, getMyJoinRequests, teams } = useTeam();
    const toast = useToast();
    const [showNotifications, setShowNotifications] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);
    // Initialize profile icon from sessionStorage cache
    const [profileIconId, setProfileIconId] = useState<number | string | null>(() => {
        const cached = sessionStorage.getItem('profileIconId');
        return cached ? JSON.parse(cached) : null;
    });

    // Get user's team tag
    const myTeam = teams.length > 0 ? teams[0] : null;

    // Load user's profile icon from Riot (only if not already loaded)
    useEffect(() => {
        const loadProfileIcon = async () => {
            // Skip if already loaded or no riot account linked
            if (profileIconId !== null || !isAuthenticated || !user?.riot_game_name) return;

            try {
                const token = localStorage.getItem('token');
                if (!token) return;

                const data = await getSummonerData(token);
                if (data?.summoner?.profile_icon_id) {
                    setProfileIconId(data.summoner.profile_icon_id);
                    // Cache in sessionStorage to persist across navigations
                    sessionStorage.setItem('profileIconId', JSON.stringify(data.summoner.profile_icon_id));
                }
            } catch (error) {
                // Silent fail
            }
        };

        loadProfileIcon();
    }, [isAuthenticated, user?.riot_game_name, profileIconId]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (showNotifications && !target.closest('.notifications-dropdown')) {
                setShowNotifications(false);
            }
            if (showUserMenu && !target.closest('.user-menu-dropdown')) {
                setShowUserMenu(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showNotifications, showUserMenu]);

    return (
        <header className="border-b border-[#F5F5F5]/10 sticky top-0 bg-[#0E0E0E] z-50">
            <div className="w-full px-12 py-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate('/')}
                        className="text-[#F5F5F5] text-xl font-semibold tracking-wide hover:text-[#F5F5F5]/80 transition-colors"
                        style={{ letterSpacing: '0.02em' }}
                    >
                        {brandName}
                    </button>
                    <span className="text-[#F5F5F5]/40 text-xs font-medium tracking-wider">
                        {tagline}
                    </span>
                    {showAboutLink && (
                        <button
                            onClick={() => navigate('/about')}
                            className="ml-6 text-sm font-medium text-[#F5F5F5]/50 hover:text-[#F5F5F5] transition-colors"
                        >
                            About
                        </button>
                    )}
                    {showToolsLink && (
                        <button
                            onClick={() => navigate('/tools')}
                            className="ml-6 text-sm font-medium text-[#F5F5F5]/50 hover:text-[#F5F5F5] transition-colors"
                        >
                            Tools
                        </button>
                    )}
                    {isAuthenticated && (
                        <button
                            onClick={() => navigate('/team-manager')}
                            className="ml-6 text-sm font-medium text-[#F5F5F5]/50 hover:text-[#F5F5F5] transition-colors"
                        >
                            Teams
                        </button>
                    )}
                </div>
                <nav className="flex gap-4 items-center">
                    {isAuthenticated ? (
                        <>
                            <button
                                onClick={() => navigate('/favorite-tools')}
                                className="px-3 py-2 text-[#F5F5F5]/60 hover:text-[#F5F5F5] transition-colors"
                            >
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
                                </svg>
                            </button>

                            {/* Notifications Dropdown */}
                            <div className="relative notifications-dropdown">
                                <button
                                    onClick={() => setShowNotifications(!showNotifications)}
                                    className="relative px-3 py-2 text-[#F5F5F5]/60 hover:text-[#F5F5F5] transition-colors"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                    </svg>
                                    {(invites.length > 0 || joinRequests.length > 0) && (
                                        <span className="absolute top-1 right-1 w-2 h-2 bg-[#3D7A5F] rounded-full"></span>
                                    )}
                                </button>

                                {/* Notifications Dropdown Menu */}
                                {showNotifications && (
                                    <div className="absolute right-0 mt-2 w-80 bg-[#1A1A1A] border border-[#F5F5F5]/10 shadow-lg z-50">
                                        <div className="p-4 border-b border-[#F5F5F5]/10">
                                            <h3 className="text-[#F5F5F5] font-semibold">Notifications</h3>
                                        </div>
                                        <div className="max-h-96 overflow-y-auto">
                                            {invites.length === 0 && joinRequests.length === 0 ? (
                                                <div className="p-6 text-center">
                                                    <p className="text-[#F5F5F5]/50 text-sm">No new notifications</p>
                                                </div>
                                            ) : (
                                                <div className="p-2">
                                                    {/* Team Invitations */}
                                                    {invites.map((invite) => (
                                                        <div key={invite.id} className="p-3 mb-2 border border-[#3D7A5F]/20 bg-[#3D7A5F]/10 rounded">
                                                            <div className="flex items-start gap-2">
                                                                <div className="w-2 h-2 rounded-full bg-[#3D7A5F] mt-1.5 flex-shrink-0"></div>
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-[#F5F5F5] text-sm font-medium">Team Invitation</p>
                                                                    <p className="text-[#F5F5F5]/60 text-xs mt-1">
                                                                        You've been invited to join <span className="font-medium">{invite.team_name}</span> as {invite.role}
                                                                    </p>
                                                                    <div className="flex gap-2 mt-2">
                                                                        <button
                                                                            onClick={async () => {
                                                                                await acceptInvite(invite.id);
                                                                                getMyInvites();
                                                                            }}
                                                                            className="px-3 py-1 bg-[#3D7A5F] text-[#F5F5F5] text-xs hover:bg-[#3D7A5F]/90 transition-colors"
                                                                        >
                                                                            Accept
                                                                        </button>
                                                                        <button
                                                                            onClick={() => navigate('/teams')}
                                                                            className="px-3 py-1 border border-[#F5F5F5]/20 text-[#F5F5F5] text-xs hover:bg-[#F5F5F5]/10 transition-colors"
                                                                        >
                                                                            View
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}

                                                    {/* Join Requests */}
                                                    {joinRequests.map((request) => (
                                                        <div key={request.id} className="p-3 mb-2 border border-[#B4975A]/20 bg-[#B4975A]/10 rounded">
                                                            <div className="flex items-start gap-2">
                                                                <div className="w-2 h-2 rounded-full bg-[#B4975A] mt-1.5 flex-shrink-0"></div>
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-[#F5F5F5] text-sm font-medium">Join Request</p>
                                                                    <p className="text-[#F5F5F5]/60 text-xs mt-1">
                                                                        <span className="font-medium">{request.username}</span> wants to join <span className="font-medium">{request.team_name}</span>
                                                                    </p>
                                                                    {request.riot_game_name && request.riot_tag_line && (
                                                                        <p className="text-[#F5F5F5]/40 text-xs mt-0.5">
                                                                            {request.riot_game_name}#{request.riot_tag_line}
                                                                        </p>
                                                                    )}
                                                                    {request.message && (
                                                                        <p className="text-[#F5F5F5]/50 text-xs mt-1 italic">
                                                                            "{request.message}"
                                                                        </p>
                                                                    )}
                                                                    <div className="flex gap-2 mt-2">
                                                                        <button
                                                                            onClick={async () => {
                                                                                const success = await acceptJoinRequest(request.id);
                                                                                if (success) {
                                                                                    toast?.success(`${request.username} has joined the team`);
                                                                                    getMyJoinRequests();
                                                                                } else {
                                                                                    toast?.error('Failed to accept join request');
                                                                                }
                                                                            }}
                                                                            className="px-3 py-1 bg-[#3D7A5F] text-[#F5F5F5] text-xs hover:bg-[#3D7A5F]/90 transition-colors"
                                                                        >
                                                                            Accept
                                                                        </button>
                                                                        <button
                                                                            onClick={async () => {
                                                                                const success = await rejectJoinRequest(request.id);
                                                                                if (success) {
                                                                                    toast?.success('Join request rejected');
                                                                                    getMyJoinRequests();
                                                                                } else {
                                                                                    toast?.error('Failed to reject join request');
                                                                                }
                                                                            }}
                                                                            className="px-3 py-1 border border-[#C75B5B]/50 text-[#C75B5B] text-xs hover:bg-[#C75B5B]/10 transition-colors"
                                                                        >
                                                                            Reject
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {user?.is_admin && (
                                <button
                                    onClick={() => navigate('/admin')}
                                    className="px-4 py-2 text-yellow-400 text-sm font-medium bg-yellow-500/10 hover:bg-yellow-500/20 transition-colors border border-yellow-500/30"
                                >
                                    Admin
                                </button>
                            )}
                            <button
                                onClick={() => navigate('/dashboard')}
                                className="text-sm transition-colors group"
                            >
                                {myTeam?.tag && (
                                    <span style={{ color: myTeam.team_color }} className="font-semibold brightness-90 group-hover:brightness-110 transition-all">{myTeam.tag} </span>
                                )}
                                <span className="text-[#F5F5F5]/50 group-hover:text-[#F5F5F5] transition-colors">{user?.username}</span>
                            </button>

                            {/* User Menu Dropdown */}
                            <div className="relative user-menu-dropdown">
                                <button
                                    onClick={() => setShowUserMenu(!showUserMenu)}
                                    className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center bg-[#1A1A1A] hover:opacity-80 transition-opacity"
                                >
                                    {profileIconId ? (
                                        <ImageWithFallback
                                            src={`https://ddragon.leagueoflegends.com/cdn/14.24.1/img/profileicon/${profileIconId}.png`}
                                            alt="Profile Icon"
                                            fallbackType="profile"
                                            className="w-full h-full object-cover"
                                            style={{ width: '100%', height: '100%' }}
                                        />
                                    ) : (
                                        <svg className="w-5 h-5 text-[#3D7A5F]" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                        </svg>
                                    )}
                                </button>

                                {/* User Dropdown Menu */}
                                {showUserMenu && (
                                    <div className="absolute right-0 mt-2 w-48 bg-[#1A1A1A] border border-[#F5F5F5]/10 shadow-lg z-50">
                                        <div className="p-2">
                                            <button
                                                onClick={() => {
                                                    navigate('/dashboard');
                                                    setShowUserMenu(false);
                                                }}
                                                className="w-full px-4 py-2 text-left text-[#F5F5F5] text-sm hover:bg-[#F5F5F5]/10 transition-colors rounded"
                                            >
                                                Dashboard
                                            </button>
                                            <button
                                                onClick={() => {
                                                    navigate('/favorite-tools');
                                                    setShowUserMenu(false);
                                                }}
                                                className="w-full px-4 py-2 text-left text-[#F5F5F5] text-sm hover:bg-[#F5F5F5]/10 transition-colors rounded"
                                            >
                                                Favorite Tools
                                            </button>
                                            <button
                                                onClick={() => {
                                                    navigate('/team-manager');
                                                    setShowUserMenu(false);
                                                }}
                                                className="w-full px-4 py-2 text-left text-[#F5F5F5] text-sm hover:bg-[#F5F5F5]/10 transition-colors rounded"
                                            >
                                                My Team
                                            </button>
                                            <button
                                                onClick={() => {
                                                    navigate('/settings');
                                                    setShowUserMenu(false);
                                                }}
                                                className="w-full px-4 py-2 text-left text-[#F5F5F5] text-sm hover:bg-[#F5F5F5]/10 transition-colors rounded"
                                            >
                                                Settings
                                            </button>
                                            <div className="h-px bg-[#F5F5F5]/10 my-2"></div>
                                            <button
                                                onClick={() => {
                                                    logout();
                                                    setShowUserMenu(false);
                                                }}
                                                className="w-full px-4 py-2 text-left text-sm hover:bg-[#F5F5F5]/10 transition-colors rounded"
                                                style={{ color: COLORS.danger }}
                                            >
                                                Logout
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <>
                            <button
                                onClick={() => navigate('/login')}
                                className="px-5 py-2 text-[#F5F5F5]/60 text-sm font-medium hover:text-[#F5F5F5] transition-colors"
                            >
                                Login
                            </button>
                            <button
                                onClick={() => navigate('/signup')}
                                className={`px-5 py-2 bg-[${COLORS.primary}] text-[#F5F5F5] text-sm font-medium hover:bg-[#4A9170] transition-colors`}
                            >
                                Sign Up
                            </button>
                        </>
                    )}
                </nav>
            </div>
        </header>
    );
}
