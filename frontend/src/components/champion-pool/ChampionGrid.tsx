import { useState, useMemo } from 'react';
import { ChampionCard } from './ChampionCard';

interface Champion {
  id: string;
  name: string;
  tags: string[];
}

interface ChampionGridProps {
  champions: Champion[];
  selectedChampions: string[];
  onSelect: (championId: string, championName: string) => void;
  filterRole?: string;
}

export function ChampionGrid({ champions, selectedChampions, onSelect, filterRole }: ChampionGridProps) {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>(filterRole || 'all');

  const roles = [
    { id: 'all', label: 'All' },
    { id: 'Fighter', label: 'Fighter' },
    { id: 'Tank', label: 'Tank' },
    { id: 'Mage', label: 'Mage' },
    { id: 'Assassin', label: 'Assassin' },
    { id: 'Marksman', label: 'Marksman' },
    { id: 'Support', label: 'Support' },
  ];

  const filteredChampions = useMemo(() => {
    return champions.filter((champ) => {
      const matchesSearch = champ.name.toLowerCase().includes(search.toLowerCase());
      const matchesRole = roleFilter === 'all' || champ.tags.includes(roleFilter);
      return matchesSearch && matchesRole;
    });
  }, [champions, search, roleFilter]);

  return (
    <div className="flex flex-col h-full">
      {/* Search and filters */}
      <div className="flex gap-3 mb-4">
        <input
          type="text"
          placeholder="Search champion..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-4 py-2 bg-[#1A1A1A] border border-[#F5F5F5]/20 rounded text-[#F5F5F5] placeholder-[#F5F5F5]/40 focus:outline-none focus:border-[#3D7A5F]"
        />
      </div>

      {/* Role filters */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {roles.map((role) => (
          <button
            key={role.id}
            onClick={() => setRoleFilter(role.id)}
            className={`
              px-3 py-1 text-sm rounded transition-colors
              ${roleFilter === role.id
                ? 'bg-[#3D7A5F] text-white'
                : 'bg-[#1A1A1A] text-[#F5F5F5]/60 hover:text-[#F5F5F5] border border-[#F5F5F5]/20'
              }
            `}
          >
            {role.label}
          </button>
        ))}
      </div>

      {/* Champions grid */}
      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-6 gap-2">
          {filteredChampions.map((champion) => (
            <ChampionCard
              key={champion.id}
              championId={champion.id}
              championName={champion.name}
              isSelected={selectedChampions.includes(champion.id)}
              onClick={() => onSelect(champion.id, champion.name)}
              size="md"
            />
          ))}
        </div>

        {filteredChampions.length === 0 && (
          <div className="text-center text-[#F5F5F5]/40 py-8">
            No champions found
          </div>
        )}
      </div>
    </div>
  );
}
