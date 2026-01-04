import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { COLORS } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';
import { useTeam } from '../../contexts/TeamContext';

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
    const { invites, acceptInvite, getMyInvites, teams } = useTeam();
    const [showNotifications, setShowNotifications] = useState(false);

    // Get user's team tag
    const myTeam = teams.length > 0 ? teams[0] : null;

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (showNotifications && !target.closest('.notifications-dropdown')) {
                setShowNotifications(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showNotifications]);

    return (
        <header className="border-b border-[#F5F5F5]/10 sticky top-0 bg-[#0E0E0E] z-50">
            <div className="max-w-[1600px] mx-auto px-12 py-6 flex items-center justify-between">
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
                            onClick={() => navigate('/teams')}
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
                                onClick={() => navigate('/dashboard')}
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
                                    {invites.length > 0 && (
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
                                            {invites.length === 0 ? (
                                                <div className="p-6 text-center">
                                                    <p className="text-[#F5F5F5]/50 text-sm">No new notifications</p>
                                                </div>
                                            ) : (
                                                <div className="p-2">
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
                                onClick={() => navigate('/profile')}
                                className="text-sm transition-colors group"
                            >
                                {myTeam?.tag && (
                                    <span style={{ color: myTeam.team_color }} className="font-semibold brightness-90 group-hover:brightness-110 transition-all">{myTeam.tag} </span>
                                )}
                                <span className="text-[#F5F5F5]/50 group-hover:text-[#F5F5F5] transition-colors">{user?.username}</span>
                            </button>
                            <button
                                onClick={logout}
                                className="px-5 py-2 text-[#F5F5F5] text-sm font-medium transition-colors"
                                style={{ backgroundColor: COLORS.danger }}
                            >
                                Logout
                            </button>
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
