import { ImageWithFallback } from './ImageWithFallback';

interface TeamMember {
  solo_tier?: string | null;
  solo_rank?: string | null;
  preferred_lane?: string | null;
}

interface TeamCardProps {
  name: string;
  tag?: string;
  description?: string;
  memberCount: number;
  maxMembers: string;
  color: string;
  createdAt: string;
  members?: TeamMember[];
  onRequestJoin?: () => void;
}

const RANK_VALUES: Record<string, number> = {
  IRON: 0,
  BRONZE: 1,
  SILVER: 2,
  GOLD: 3,
  PLATINUM: 4,
  EMERALD: 5,
  DIAMOND: 6,
  MASTER: 7,
  GRANDMASTER: 8,
  CHALLENGER: 9,
};

const DIVISION_VALUES: Record<string, number> = {
  IV: 0,
  III: 1,
  II: 2,
  I: 3,
};

function calculateAverageRank(members: TeamMember[]): { tier: string; rank: string } | null {
  const rankedMembers = members.filter(m => m.solo_tier && m.solo_rank);
  if (rankedMembers.length === 0) return null;

  const totalValue = rankedMembers.reduce((sum, member) => {
    const tierValue = RANK_VALUES[member.solo_tier!] || 0;
    const divValue = DIVISION_VALUES[member.solo_rank!] || 0;
    return sum + (tierValue * 4 + divValue);
  }, 0);

  const avgValue = Math.round(totalValue / rankedMembers.length);
  const tier = Object.keys(RANK_VALUES).find(key => RANK_VALUES[key] === Math.floor(avgValue / 4)) || 'UNRANKED';
  const rank = Object.keys(DIVISION_VALUES).find(key => DIVISION_VALUES[key] === avgValue % 4) || 'IV';

  return { tier, rank };
}

function getMissingRoles(members: TeamMember[]): string[] {
  const ALL_ROLES = ['TOP', 'JUNGLE', 'MID', 'BOT', 'SUPPORT'];
  const occupiedRoles = new Set(members.map(m => m.preferred_lane).filter(Boolean));
  return ALL_ROLES.filter(role => !occupiedRoles.has(role));
}

export function TeamCard({
  name,
  tag,
  description,
  memberCount,
  maxMembers,
  color,
  createdAt,
  members = [],
  onRequestJoin,
}: TeamCardProps) {
  const averageRank = calculateAverageRank(members);
  const missingRoles = getMissingRoles(members);
  return (
    <div className="group relative bg-[#1A1A1A] border border-[#F5F5F5]/10 p-6 hover:border-[#F5F5F5]/30 transition-all h-full flex flex-col"
    >
      {/* Tag Badge */}
      {tag && (
        <div className="absolute top-4 right-4">
          <span
            className="text-xs font-bold px-2 py-1 rounded"
            style={{
              color: color,
              backgroundColor: `${color}20`,
            }}
          >
            {tag}
          </span>
        </div>
      )}

      {/* Team Name */}
      <h3 className="text-[#F5F5F5] text-xl font-semibold mb-3 group-hover:text-[#3D7A5F] transition-colors pr-16">
        {name}
      </h3>

      {/* Description */}
      {description ? (
        <p className="text-[#F5F5F5]/60 text-sm mb-auto line-clamp-3">
          {description}
        </p>
      ) : (
        <p className="text-[#F5F5F5]/40 text-sm mb-auto italic">
          No description
        </p>
      )}

      {/* Stats Row */}
      <div className="mt-4 pt-4 border-t border-[#F5F5F5]/10 space-y-3">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-[#F5F5F5]/60">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
            </svg>
            <span>{memberCount}/{maxMembers}</span>
          </div>
          <span className="text-[#F5F5F5]/40 text-xs">
            {new Date(createdAt).toLocaleDateString()}
          </span>
        </div>

        {/* Average Rank */}
        {averageRank && (
          <div className="flex items-center gap-2">
            <span className="text-[#F5F5F5]/40 text-xs">Avg:</span>
            <ImageWithFallback
              src={`/riot/Season_2022_-_${averageRank.tier.charAt(0).toUpperCase() + averageRank.tier.slice(1).toLowerCase()}.png`}
              alt={averageRank.tier}
              fallbackType="champion"
              className="w-5 h-5"
              style={{ width: '1.25rem', height: '1.25rem' }}
            />
            <span className="text-[#F5F5F5] text-xs font-semibold">
              {averageRank.tier} {averageRank.rank}
            </span>
          </div>
        )}

        {/* Missing Roles */}
        {missingRoles.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-[#F5F5F5]/40 text-xs">Need:</span>
            <div className="flex gap-1">
              {missingRoles.map((role) => (
                <ImageWithFallback
                  key={role}
                  src={`/riot/role/${role === 'BOT' ? 'Bottom' : role === 'MID' ? 'Middle' : role.charAt(0) + role.slice(1).toLowerCase()}_icon.png`}
                  alt={role}
                  fallbackType="champion"
                  className="w-4 h-4 opacity-60"
                  style={{ width: '1rem', height: '1rem' }}
                  title={role}
                />
              ))}
            </div>
          </div>
        )}

        {/* Join Request Button */}
        {onRequestJoin && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRequestJoin();
            }}
            className="w-full bg-[#3D7A5F] hover:bg-[#3D7A5F]/90 text-[#F5F5F5] font-medium py-2 px-4 transition-colors"
          >
            Request to Join
          </button>
        )}
      </div>
    </div>
  );
}
