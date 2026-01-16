import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTeam, type Team, type ChampionMastery } from '../../contexts/TeamContext';
import { useToast } from '../../contexts/ToastContext';
import { Header } from '../../components/layout/Header';
import { Footer } from '../../components/layout/Footer';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { useAutoRefresh } from '../../hooks/useAutoRefresh';
import { ImageWithFallback } from '../../components/ui/ImageWithFallback';
import { COLORS } from '../../constants/theme';
import { getChampionImageUrl, getProfileIconUrl } from '../../services/riotApi';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const RANK_COLORS: Record<string, string> = {
  IRON: '#6B5B54',
  BRONZE: '#8D5524',
  SILVER: '#8A9BA8',
  GOLD: '#F0AD4E',
  PLATINUM: '#5CB85C',
  EMERALD: '#00A99D',
  DIAMOND: '#5BC0DE',
  MASTER: '#9B59B6',
  GRANDMASTER: '#E74C3C',
  CHALLENGER: '#F39C12',
};

const LANE_COLORS: Record<string, string> = {
  TOP: '#B4975A',
  JUNGLE: '#5B8FB9',
  MID: '#8B5A9F',
  BOT: '#C75B5B',
  SUPPORT: '#3D7A5F',
};

// Champion ID to name mapping
const championIdToKey: Record<number, string> = {
  1: 'Annie', 2: 'Olaf', 3: 'Galio', 4: 'TwistedFate', 5: 'XinZhao', 6: 'Urgot', 7: 'LeBlanc', 8: 'Vladimir', 9: 'Fiddlesticks', 10: 'Kayle',
  11: 'MasterYi', 12: 'Alistar', 13: 'Ryze', 14: 'Sion', 15: 'Sivir', 16: 'Soraka', 17: 'Teemo', 18: 'Tristana', 19: 'Warwick', 20: 'Nunu',
  21: 'MissFortune', 22: 'Ashe', 23: 'Tryndamere', 24: 'Jax', 25: 'Morgana', 26: 'Zilean', 27: 'Singed', 28: 'Evelynn', 29: 'Twitch', 30: 'Karthus',
  31: 'Chogath', 32: 'Amumu', 33: 'Rammus', 34: 'Anivia', 35: 'Shaco', 36: 'DrMundo', 37: 'Sona', 38: 'Kassadin', 39: 'Irelia', 40: 'Janna',
  41: 'Gangplank', 42: 'Corki', 43: 'Karma', 44: 'Taric', 45: 'Veigar', 48: 'Trundle', 50: 'Swain', 51: 'Caitlyn', 53: 'Blitzcrank', 54: 'Malphite',
  55: 'Katarina', 56: 'Nocturne', 57: 'Maokai', 58: 'Renekton', 59: 'JarvanIV', 60: 'Elise', 61: 'Orianna', 62: 'MonkeyKing', 63: 'Brand', 64: 'LeeSin',
  67: 'Vayne', 68: 'Rumble', 69: 'Cassiopeia', 72: 'Skarner', 74: 'Heimerdinger', 75: 'Nasus', 76: 'Nidalee', 77: 'Udyr', 78: 'Poppy', 79: 'Gragas',
  80: 'Pantheon', 81: 'Ezreal', 82: 'Mordekaiser', 83: 'Yorick', 84: 'Akali', 85: 'Kennen', 86: 'Garen', 89: 'Leona', 90: 'Malzahar', 91: 'Talon',
  92: 'Riven', 96: 'KogMaw', 98: 'Shen', 99: 'Lux', 101: 'Xerath', 102: 'Shyvana', 103: 'Ahri', 104: 'Graves', 105: 'Fizz', 106: 'Volibear',
  107: 'Rengar', 110: 'Varus', 111: 'Nautilus', 112: 'Viktor', 113: 'Sejuani', 114: 'Fiora', 115: 'Ziggs', 117: 'Lulu', 119: 'Draven', 120: 'Hecarim',
  121: 'Khazix', 122: 'Darius', 126: 'Jayce', 127: 'Lissandra', 131: 'Diana', 133: 'Quinn', 134: 'Syndra', 136: 'AurelionSol', 141: 'Kayn', 142: 'Zoe',
  143: 'Zyra', 145: 'Kaisa', 147: 'Seraphine', 150: 'Gnar', 154: 'Zac', 157: 'Yasuo', 161: 'Velkoz', 163: 'Taliyah', 164: 'Camille', 166: 'Akshan',
  200: 'Belveth', 201: 'Braum', 202: 'Jhin', 203: 'Kindred', 221: 'Zeri', 222: 'Jinx', 223: 'TahmKench', 234: 'Viego', 235: 'Senna', 236: 'Lucian',
  238: 'Zed', 240: 'Kled', 245: 'Ekko', 246: 'Qiyana', 254: 'Vi', 266: 'Aatrox', 267: 'Nami', 268: 'Azir', 350: 'Yuumi', 360: 'Samira',
  412: 'Thresh', 420: 'Illaoi', 421: 'RekSai', 427: 'Ivern', 429: 'Kalista', 432: 'Bard', 497: 'Rakan', 498: 'Xayah', 516: 'Ornn', 517: 'Sylas',
  518: 'Neeko', 523: 'Aphelios', 526: 'Rell', 555: 'Pyke', 711: 'Vex', 777: 'Yone', 875: 'Sett', 876: 'Lillia', 887: 'Gwen', 888: 'Renata',
  895: 'Nilah', 897: 'KSante', 901: 'Smolder', 902: 'Milio', 910: 'Hwei', 950: 'Naafiri',
};

function getChampionImage(championId: number): string {
  const championKey = championIdToKey[championId] || 'Unknown';
  return getChampionImageUrl(championKey);
}

export default function TeamManagerPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { teams, getMyTeams, updateTeam, kickMember, promoteToOwner } = useTeam();
  const navigate = useNavigate();
  const toast = useToast();

  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const prevTeamsRef = useRef<Team[]>([]);
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

  // Sync selectedTeam with teams context when it updates
  useEffect(() => {
    if (selectedTeam && teams.length > 0) {
      const prevTeam = prevTeamsRef.current.find(t => t.id === selectedTeam.id);
      const updatedTeam = teams.find(t => t.id === selectedTeam.id);

      if (updatedTeam && prevTeam && updatedTeam.is_locked !== prevTeam.is_locked) {
        // is_locked changed in context, update selectedTeam
        console.log('Lock state changed, updating selectedTeam:', updatedTeam.is_locked);
        setSelectedTeam({...updatedTeam});
      }
    }
    prevTeamsRef.current = teams;
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

    setIsLoading(true);
    const result = await updateTeam(selectedTeam.id, editFormData);
    setIsLoading(false);
    if (result) {
      toast?.success('Team updated successfully');
      setShowEditModal(false);
      await getMyTeams();
      setSelectedTeam(result);
    } else {
      toast?.error('Failed to update team');
    }
  };

  const handleToggleLock = async () => {
    if (!selectedTeam) return;

    const newLockState = !selectedTeam.is_locked;

    // Optimistically update the UI immediately
    setSelectedTeam(prev => prev ? { ...prev, is_locked: newLockState } : null);

    setIsLoading(true);
    const result = await updateTeam(selectedTeam.id, { is_locked: newLockState });
    setIsLoading(false);

    if (result) {
      toast?.success(newLockState ? 'Team locked' : 'Team unlocked');
      // The useEffect will automatically sync selectedTeam with teams context
    } else {
      // Revert on error
      setSelectedTeam(prev => prev ? { ...prev, is_locked: !newLockState } : null);
      toast?.error('Failed to toggle team lock');
    }
  };

  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeam) return;

    setIsLoading(true);
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
    } finally {
      setIsLoading(false);
    }
  };

  const handleLeaveTeam = async () => {
    if (!selectedTeam) return;

    setConfirmDialog({
      show: true,
      title: 'Leave Team',
      message: `Are you sure you want to leave ${selectedTeam.name}? This action cannot be undone.`,
      type: 'danger',
      onConfirm: async () => {
        try {
          const token = localStorage.getItem('token');
          const response = await fetch(`${API_BASE_URL}/api/teams/${selectedTeam.id}/leave`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });

          if (response.ok) {
            toast?.success('You have left the team');
            await getMyTeams();
            // Redirect back to dashboard if user leaves
            navigate('/dashboard');
          } else {
            const error = await response.json();
            toast?.error(error.detail || 'Failed to leave team');
          }
        } catch (error) {

          toast?.error('Failed to leave team');
        } finally {
          setConfirmDialog({ ...confirmDialog, show: false });
        }
      }
    });
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
            navigate('/dashboard');
          } else {
            toast?.error('Failed to delete team');
          }
        } catch (error) {

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
              onClick={() => navigate('/dashboard')}
              className="px-8 py-3 bg-[#3D7A5F] text-[#F5F5F5] font-medium hover:bg-[#3D7A5F]/90 transition-colors"
            >
              Go to Dashboard
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

  // Calculate team average rank
  const calculateAverageRank = () => {
    const rankValues: Record<string, Record<string, number>> = {
      IRON: { IV: 1, III: 2, II: 3, I: 4 },
      BRONZE: { IV: 5, III: 6, II: 7, I: 8 },
      SILVER: { IV: 9, III: 10, II: 11, I: 12 },
      GOLD: { IV: 13, III: 14, II: 15, I: 16 },
      PLATINUM: { IV: 17, III: 18, II: 19, I: 20 },
      EMERALD: { IV: 21, III: 22, II: 23, I: 24 },
      DIAMOND: { IV: 25, III: 26, II: 27, I: 28 },
      MASTER: { I: 29 },
      GRANDMASTER: { I: 30 },
      CHALLENGER: { I: 31 }
    };

    const rankedMembers = selectedTeam.members.filter(m => m.solo_tier && m.solo_rank);
    if (rankedMembers.length === 0) return null;

    const totalValue = rankedMembers.reduce((sum, member) => {
      const tier = member.solo_tier!;
      const rank = member.solo_rank!;
      return sum + (rankValues[tier]?.[rank] || 0);
    }, 0);

    const avgValue = Math.round(totalValue / rankedMembers.length);

    // Convert back to tier/rank
    for (const [tier, ranks] of Object.entries(rankValues)) {
      for (const [rank, value] of Object.entries(ranks)) {
        if (value === avgValue) {
          return { tier, rank, color: RANK_COLORS[tier] };
        }
      }
    }
    return null;
  };

  const averageRank = calculateAverageRank();

  // Get occupied roles in order
  const getOccupiedRoles = () => {
    const roleOrder = ['TOP', 'JUNGLE', 'MID', 'BOT', 'SUPPORT'];
    const occupiedRoles = new Set(
      selectedTeam.members
        .filter(m => m.preferred_lane)
        .map(m => m.preferred_lane!.toUpperCase())
    );
    return roleOrder.filter(role => occupiedRoles.has(role));
  };

  const occupiedRoles = getOccupiedRoles();

  const getRoleIconPath = (role: string) => {
    const roleMap: Record<string, string> = {
      'TOP': 'Top',
      'JUNGLE': 'Jungle',
      'MID': 'Middle',
      'BOT': 'Bottom',
      'SUPPORT': 'Support'
    };
    return `/riot/role/${roleMap[role]}_icon.png`;
  };

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
                className="w-32 h-32 rounded-lg flex items-center justify-center text-5xl font-bold text-white"
                style={{ backgroundColor: selectedTeam.team_color }}
              >
                {selectedTeam.tag || selectedTeam.name.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-[#F5F5F5] text-4xl font-semibold">
                    {selectedTeam.name}
                  </h1>
                  {selectedTeam.is_locked && (
                    <span className="px-3 py-1 bg-[#B4975A]/20 border border-[#B4975A]/40 text-[#B4975A] text-sm font-medium rounded flex items-center gap-1.5">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                      </svg>
                      Locked
                    </span>
                  )}
                </div>
                <p className="text-[#F5F5F5]/50 text-lg mb-3">
                  {selectedTeam.description || 'No description'}
                </p>

                {/* Average Rank and Occupied Roles */}
                <div className="flex items-center gap-6">
                  {/* Average Rank */}
                  {averageRank && (
                    <div className="flex items-center gap-2">
                      <span className="text-[#F5F5F5]/40 text-sm uppercase tracking-wider">Avg Rank:</span>
                      <img
                        src={`/riot/Season_2022_-_${averageRank.tier.charAt(0).toUpperCase() + averageRank.tier.slice(1).toLowerCase()}.png`}
                        alt={averageRank.tier}
                        className="w-8 h-8"
                      />
                      <span className="text-[#F5F5F5] text-base font-semibold">
                        {averageRank.tier} {averageRank.rank}
                      </span>
                    </div>
                  )}

                  {/* Occupied Roles */}
                  {occupiedRoles.length > 0 && (
                    <>
                      {averageRank && <div className="w-px h-5 bg-[#F5F5F5]/20"></div>}
                      <div className="flex items-center gap-2">
                        <span className="text-[#F5F5F5]/40 text-sm uppercase tracking-wider">Roles:</span>
                        <div className="flex gap-1">
                          {occupiedRoles.map(role => (
                            <img
                              key={role}
                              src={getRoleIconPath(role)}
                              alt={role}
                              className="w-6 h-6"
                              title={role}
                            />
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
            {isOwner && (
              <div className="flex items-center gap-4">
                {/* iOS-style Toggle Switch */}
                <div className="flex items-center gap-3">
                  <span className="text-[#F5F5F5]/70 text-sm font-medium">
                    {selectedTeam.is_locked ? 'Private' : 'Public'}
                  </span>
                  <button
                    onClick={handleToggleLock}
                    className={`relative w-14 h-7 rounded-full transition-colors duration-300 ${
                      selectedTeam.is_locked ? 'bg-[#B4975A]' : 'bg-[#3D7A5F]'
                    }`}
                    title={selectedTeam.is_locked ? 'Team is private (click to make public)' : 'Team is public (click to make private)'}
                  >
                    <div
                      className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full transition-transform duration-300 flex items-center justify-center ${
                        selectedTeam.is_locked ? 'translate-x-7' : 'translate-x-0'
                      }`}
                    >
                      <svg className={`w-3.5 h-3.5 ${selectedTeam.is_locked ? 'text-[#B4975A]' : 'text-[#3D7A5F]'}`} fill="currentColor" viewBox="0 0 20 20">
                        {selectedTeam.is_locked ? (
                          <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                        ) : (
                          <path d="M10 2a5 5 0 00-5 5v2a2 2 0 00-2 2v5a2 2 0 002 2h10a2 2 0 002-2v-5a2 2 0 00-2-2H7V7a3 3 0 015.905-.75 1 1 0 001.937-.5A5.002 5.002 0 0010 2z" />
                        )}
                      </svg>
                    </div>
                  </button>
                </div>

                <button
                  onClick={openEditModal}
                  className="px-6 py-3 bg-[#3D7A5F] text-[#F5F5F5] font-medium hover:bg-[#3D7A5F]/90 transition-colors"
                >
                  Edit Team
                </button>
              </div>
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
                  {averageRank && (
                    <div>
                      <p className="text-[#F5F5F5]/50 text-sm mb-1">Average Rank</p>
                      <div className="flex items-center gap-2">
                        <img
                          src={`/riot/Season_2022_-_${averageRank.tier.charAt(0).toUpperCase() + averageRank.tier.slice(1).toLowerCase()}.png`}
                          alt={averageRank.tier}
                          className="w-10 h-10"
                        />
                        <span className="text-[#F5F5F5] text-lg font-semibold">
                          {averageRank.tier} {averageRank.rank}
                        </span>
                      </div>
                    </div>
                  )}
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
                  {!isOwner && (
                    <button
                      onClick={handleLeaveTeam}
                      className="w-full px-4 py-3 border transition-colors text-left font-medium"
                      style={{
                        backgroundColor: `${COLORS.danger}1A`,
                        color: COLORS.danger,
                        borderColor: `${COLORS.danger}4D`
                      }}
                    >
                      Leave Team
                    </button>
                  )}
                  {isOwner && (
                    <button
                      onClick={handleDeleteTeam}
                      className="w-full px-4 py-3 border transition-colors text-left font-medium"
                      style={{
                        backgroundColor: `${COLORS.danger}1A`,
                        color: COLORS.danger,
                        borderColor: `${COLORS.danger}4D`
                      }}
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
                          <div className="flex items-center gap-4">
                            {/* League Profile Icon */}
                            <div className="flex-shrink-0">
                              {member.profile_icon_id ? (
                                <ImageWithFallback
                                  src={getProfileIconUrl(member.profile_icon_id)}
                                  alt="Profile Icon"
                                  fallbackType="profile"
                                  className="w-16 h-16 rounded-lg border-2 border-[#F5F5F5]/20"
                                  style={{ width: '4rem', height: '4rem' }}
                                />
                              ) : (
                                <div
                                  className="w-16 h-16 rounded-lg flex items-center justify-center text-white font-bold text-xl"
                                  style={{ backgroundColor: selectedTeam.team_color }}
                                >
                                  {member.username.substring(0, 2).toUpperCase()}
                                </div>
                              )}
                            </div>

                            {/* Member Info - Single Line */}
                            <div className="flex-1 min-w-0 flex items-center gap-4">
                              {/* Role Icon */}
                              {member.preferred_lane ? (
                                <div className="flex items-center gap-1" title={member.preferred_lane}>
                                  <ImageWithFallback
                                    src={`/riot/role/${member.preferred_lane === 'BOT' ? 'Bottom' : member.preferred_lane === 'MID' ? 'Middle' : member.preferred_lane.charAt(0) + member.preferred_lane.slice(1).toLowerCase()}_icon.png`}
                                    alt={member.preferred_lane}
                                    fallbackType="champion"
                                    className="w-6 h-6"
                                    style={{ width: '1.5rem', height: '1.5rem' }}
                                  />
                                </div>
                              ) : (
                                <div className="flex items-center gap-1" title="No role set">
                                  <ImageWithFallback
                                    src="/riot/role/Specialist_icon.png"
                                    alt="No role"
                                    fallbackType="champion"
                                    className="w-6 h-6"
                                    style={{ width: '1.5rem', height: '1.5rem' }}
                                  />
                                </div>
                              )}

                              <div className="w-px h-6 bg-[#F5F5F5]/20"></div>

                              {/* Rank Icon */}
                              {member.solo_tier ? (
                                <div className="flex items-center gap-1" title={`${member.solo_tier} ${member.solo_rank}${member.solo_lp ? ` - ${member.solo_lp} LP` : ''}`}>
                                  <ImageWithFallback
                                    src={`/riot/Season_2022_-_${member.solo_tier.charAt(0).toUpperCase() + member.solo_tier.slice(1).toLowerCase()}.png`}
                                    alt={member.solo_tier}
                                    fallbackType="champion"
                                    className="w-8 h-8"
                                    style={{ width: '2rem', height: '2rem' }}
                                  />
                                </div>
                              ) : (
                                <div className="flex items-center gap-1" title="Unranked">
                                  <ImageWithFallback
                                    src="/riot/border-unranked.png"
                                    alt="Unranked"
                                    fallbackType="champion"
                                    className="w-8 h-8"
                                    style={{ width: '2rem', height: '2rem' }}
                                  />
                                </div>
                              )}

                              <div className="w-px h-6 bg-[#F5F5F5]/20"></div>

                              {/* Riot ID */}
                              <div className="flex items-center gap-2 min-w-[180px]">
                                <p className="text-[#F5F5F5] text-sm font-medium">
                                  {member.riot_game_name && member.riot_tag_line
                                    ? `${member.riot_game_name}#${member.riot_tag_line}`
                                    : <span className="text-[#F5F5F5]/40">No Riot ID</span>
                                  }
                                </p>
                              </div>

                              <div className="w-px h-6 bg-[#F5F5F5]/20"></div>

                              {/* Top 3 Champions */}
                              <div className="flex gap-2">
                                {member.top_champions && member.top_champions.length > 0 ? (
                                  member.top_champions.slice(0, 3).map((champ, idx) => (
                                    <div
                                      key={idx}
                                      className="relative"
                                      title={`Level ${champ.championLevel} - ${champ.championPoints.toLocaleString()} pts`}
                                    >
                                      <ImageWithFallback
                                        src={getChampionImage(champ.championId)}
                                        alt="Champion"
                                        fallbackType="champion"
                                        className="w-8 h-8 rounded border border-[#F5F5F5]/20"
                                        style={{ width: '2rem', height: '2rem' }}
                                      />
                                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-[#0E0E0E] border border-[#F5F5F5]/20 rounded-full flex items-center justify-center">
                                        <span className="text-[#F5F5F5] text-[9px] font-bold">
                                          {champ.championLevel}
                                        </span>
                                      </div>
                                    </div>
                                  ))
                                ) : (
                                  <div className="w-8 h-8 flex items-center justify-center">
                                    <span className="text-[#F5F5F5]/30 text-xs">-</span>
                                  </div>
                                )}
                              </div>

                              <div className="w-px h-6 bg-[#F5F5F5]/20"></div>

                              {/* Discord */}
                              <div className="flex items-center gap-2 min-w-[120px]">
                                <svg className="w-4 h-4 text-[#F5F5F5]/40 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                                  <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                                </svg>
                                <p className="text-[#F5F5F5]/60 text-sm truncate">
                                  {member.discord || <span className="text-[#F5F5F5]/30">-</span>}
                                </p>
                              </div>

                              {/* Owner Badge OR Action Buttons */}
                              <div className="min-w-[180px] flex items-center justify-end">
                                {isMemberOwner ? (
                                  <span className="px-2.5 py-1 bg-[#3D7A5F]/20 text-[#3D7A5F] text-xs font-medium rounded">
                                    OWNER
                                  </span>
                                ) : isOwner ? (
                                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                      onClick={() => handlePromoteToOwner(member.id, member.username)}
                                      className="px-3 py-1.5 text-xs border border-[#F5F5F5]/20 text-[#F5F5F5] hover:bg-[#F5F5F5]/10 transition-colors whitespace-nowrap"
                                      title="Transfer ownership to this member"
                                    >
                                      Promote
                                    </button>
                                    <button
                                      onClick={() => handleKickMember(member.id, member.username)}
                                      className="px-3 py-1.5 text-xs border border-[#C75B5B]/50 text-[#C75B5B] hover:bg-[#C75B5B]/10 transition-colors"
                                      title="Remove from team"
                                    >
                                      Kick
                                    </button>
                                  </div>
                                ) : null}
                              </div>
                            </div>
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
