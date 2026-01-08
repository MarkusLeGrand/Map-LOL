import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTeam } from '../contexts/TeamContext';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import { TeamCard } from '../components/ui/TeamCard';

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
  members: any[];
}

export default function TeamsPage() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { getAllTeams, requestJoinTeam } = useTeam();
  const toast = useToast();
  const [allTeams, setAllTeams] = useState<Team[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Wait for auth to load before checking authentication
    if (authLoading) return;

    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    loadTeams();
  }, [isAuthenticated, authLoading]);

  const loadTeams = async () => {
    setIsLoading(true);
    const teams = await getAllTeams();
    setAllTeams(teams);
    setIsLoading(false);
  };

  const handleRequestJoin = async (teamId: string, teamName: string) => {
    try {
      await requestJoinTeam(teamId);
      toast?.success(`Request sent to ${teamName}`);
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to send request';
      toast?.error(errorMessage);
    }
  };

  // Filter teams based on search query
  const filteredTeams = allTeams.filter(team => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;

    const nameMatch = team.name.toLowerCase().includes(query);
    const tagMatch = team.tag?.toLowerCase().includes(query);
    const descMatch = team.description?.toLowerCase().includes(query);

    return nameMatch || tagMatch || descMatch;
  });

  // Sort teams: prioritize teams that start with the search query
  const sortedTeams = [...filteredTeams].sort((a, b) => {
    if (!searchQuery) return 0;

    const query = searchQuery.toLowerCase();
    const aNameStarts = a.name.toLowerCase().startsWith(query);
    const bNameStarts = b.name.toLowerCase().startsWith(query);
    const aTagStarts = a.tag?.toLowerCase().startsWith(query);
    const bTagStarts = b.tag?.toLowerCase().startsWith(query);

    // Prioritize exact starts
    if (aNameStarts && !bNameStarts) return -1;
    if (!aNameStarts && bNameStarts) return 1;
    if (aTagStarts && !bTagStarts) return -1;
    if (!aTagStarts && bTagStarts) return 1;

    return 0;
  });

  return (
    <div className="w-screen min-h-screen bg-[#0E0E0E] flex flex-col" style={{ fontFamily: 'Inter, sans-serif' }}>
      <Header
        brandName="OpenRift"
        tagline="PRO TOOLS FOR EVERYONE"
        showToolsLink={true}
      />

      <div className="flex-1 max-w-[1800px] mx-auto px-12 py-16 w-full">
        {/* Page Header */}
        <div className="mb-12">
          <h1 className="text-[#F5F5F5] text-6xl font-bold mb-4">Teams</h1>
          <p className="text-[#F5F5F5]/60 text-xl">Browse and discover competitive teams</p>
        </div>

        {/* Search Bar */}
        <div className="mb-10">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search teams by name, tag, or description..."
              className="w-full bg-[#1A1A1A] border border-[#F5F5F5]/20 text-[#F5F5F5] px-5 py-4 pr-12 focus:outline-none focus:border-[#3D7A5F] rounded-lg text-lg"
            />
            <svg
              className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 text-[#F5F5F5]/40"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          {searchQuery && (
            <p className="text-[#F5F5F5]/50 text-sm mt-3">
              Found {sortedTeams.length} team{sortedTeams.length !== 1 ? 's' : ''} matching "{searchQuery}"
            </p>
          )}
        </div>

        {/* Teams Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-32">
            <p className="text-[#F5F5F5]/50 text-lg">Loading teams...</p>
          </div>
        ) : sortedTeams.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32">
            <p className="text-[#F5F5F5]/50 text-lg mb-2">
              {searchQuery ? `No teams found matching "${searchQuery}"` : 'No teams available'}
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-[#3D7A5F] hover:text-[#3D7A5F]/80 text-sm mt-2"
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-6 auto-rows-fr">
            {sortedTeams.map((team) => (
              <TeamCard
                key={team.id}
                name={team.name}
                tag={team.tag}
                description={team.description}
                memberCount={team.member_count}
                maxMembers={team.max_members}
                color={team.team_color}
                createdAt={team.created_at}
                onRequestJoin={() => handleRequestJoin(team.id, team.name)}
              />
            ))}
          </div>
        )}
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
