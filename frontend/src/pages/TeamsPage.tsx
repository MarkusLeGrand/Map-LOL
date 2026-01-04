import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTeam } from '../contexts/TeamContext';
import { useAuth } from '../contexts/AuthContext';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';

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
  const { isAuthenticated } = useAuth();
  const { getAllTeams } = useTeam();
  const [allTeams, setAllTeams] = useState<Team[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    loadTeams();
  }, [isAuthenticated]);

  const loadTeams = async () => {
    setIsLoading(true);
    const teams = await getAllTeams();
    console.log('Loaded teams:', teams);
    setAllTeams(teams);
    setIsLoading(false);
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

      <div className="flex-1 max-w-[1600px] mx-auto px-12 py-12 w-full">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-[#F5F5F5] text-4xl font-semibold mb-2">Teams</h1>
          <p className="text-[#F5F5F5]/50 text-lg">Browse and discover teams</p>
        </div>

        {/* Search Bar */}
        <div className="mb-8">
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
          <div className="flex items-center justify-center py-20">
            <p className="text-[#F5F5F5]/50 text-lg">Loading teams...</p>
          </div>
        ) : sortedTeams.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedTeams.map((team) => (
              <div
                key={team.id}
                onClick={() => navigate('/profile')}
                className="bg-[#1A1A1A] border border-[#F5F5F5]/10 p-6 hover:border-[#3D7A5F]/50 transition-all cursor-pointer group rounded-lg"
              >
                {/* Team Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {team.tag && (
                        <span
                          className="text-sm font-bold px-2 py-0.5 rounded"
                          style={{
                            color: team.team_color,
                            backgroundColor: `${team.team_color}20`,
                          }}
                        >
                          {team.tag}
                        </span>
                      )}
                    </div>
                    <h3 className="text-[#F5F5F5] text-xl font-semibold group-hover:text-[#3D7A5F] transition-colors truncate">
                      {team.name}
                    </h3>
                  </div>
                </div>

                {/* Team Description */}
                {team.description && (
                  <p className="text-[#F5F5F5]/60 text-sm mb-4 line-clamp-2">
                    {team.description}
                  </p>
                )}

                {/* Team Stats */}
                <div className="flex items-center gap-4 pt-4 border-t border-[#F5F5F5]/10">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-[#F5F5F5]/40" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                    </svg>
                    <span className="text-[#F5F5F5]/60 text-sm">
                      {team.member_count}/{team.max_members} members
                    </span>
                  </div>
                </div>

                {/* Created Date */}
                <div className="mt-3">
                  <span className="text-[#F5F5F5]/40 text-xs">
                    Created {new Date(team.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

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
