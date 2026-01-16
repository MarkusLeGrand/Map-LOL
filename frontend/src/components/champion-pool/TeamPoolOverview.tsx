import { useState, useEffect } from 'react';
import { getChampionImageUrl } from '../../services/riotApi';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface ChampionEntry {
  id: string;
  champion_id: string;
  champion_name: string;
  tier: string;
  notes?: string;
}

interface Pool {
  id: string;
  entries: ChampionEntry[];
}

interface UserPool {
  user_id: string;
  username: string;
  pool: Pool | null;
}

interface TeamPoolOverviewProps {
  teamId: string;
}

const TIERS = ['S', 'A', 'B', 'C'] as const;

const tierColors = {
  S: { bg: 'bg-[#FFD700]/10', border: 'border-[#FFD700]/30', text: 'text-[#FFD700]' },
  A: { bg: 'bg-[#3D7A5F]/10', border: 'border-[#3D7A5F]/30', text: 'text-[#3D7A5F]' },
  B: { bg: 'bg-[#5F7A8E]/10', border: 'border-[#5F7A8E]/30', text: 'text-[#5F7A8E]' },
  C: { bg: 'bg-[#A85C5C]/10', border: 'border-[#A85C5C]/30', text: 'text-[#A85C5C]' },
};

export function TeamPoolOverview({ teamId }: TeamPoolOverviewProps) {
  const [teamPools, setTeamPools] = useState<UserPool[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTeamPools = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/api/champion-pool/team/${teamId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          const data = await response.json();
          setTeamPools(data);
        }
      } catch (err) {
        console.error('Failed to load team pools:', err);
      } finally {
        setLoading(false);
      }
    };

    loadTeamPools();
  }, [teamId]);

  const getEntriesByTier = (entries: ChampionEntry[], tier: string) => {
    return entries.filter((e) => e.tier === tier);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[#F5F5F5]/50">Loading team pools...</div>
      </div>
    );
  }

  if (teamPools.length === 0) {
    return (
      <div className="text-center text-[#F5F5F5]/50 py-8">
        No team members found.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-4">
      {teamPools.map((userPool) => {
        const hasPool = userPool.pool && userPool.pool.entries.length > 0;

        return (
          <div key={userPool.user_id} className="bg-[#1A1A1A] rounded-lg p-6">
            <h3 className="text-[#F5F5F5] font-semibold text-xl mb-4 border-b border-[#F5F5F5]/10 pb-3">
              {userPool.username}
            </h3>

            {!hasPool ? (
              <div className="text-[#F5F5F5]/40 text-sm py-4">
                No champion pool created yet
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {TIERS.map((tier) => {
                  const entries = getEntriesByTier(userPool.pool!.entries, tier);
                  const colors = tierColors[tier];

                  return (
                    <div
                      key={tier}
                      className={`
                        flex items-stretch border rounded-lg overflow-hidden
                        ${colors.border} ${colors.bg}
                      `}
                    >
                      {/* Tier label */}
                      <div className={`
                        w-12 flex-shrink-0 flex items-center justify-center font-bold text-xl
                        ${colors.text} border-r ${colors.border}
                      `}>
                        {tier}
                      </div>

                      {/* Champions */}
                      <div className="flex-1 flex flex-wrap gap-2 p-2 min-h-[56px]">
                        {entries.length === 0 ? (
                          <div className="text-[#F5F5F5]/20 text-xs flex items-center">
                            -
                          </div>
                        ) : (
                          entries.map((entry) => (
                            <div
                              key={entry.id}
                              className="relative group"
                            >
                              <div className="w-10 h-10 rounded overflow-hidden border border-[#F5F5F5]/10">
                                <img
                                  src={getChampionImageUrl(entry.champion_id)}
                                  alt={entry.champion_name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              {/* Tooltip */}
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black/90 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                                {entry.champion_name}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
