import { ChampionCard } from './ChampionCard';

interface ChampionEntry {
  id?: string;
  championId: string;
  championName: string;
  tier: string;
  notes?: string;
}

interface TierRowProps {
  tier: 'S' | 'A' | 'B' | 'C';
  champions: ChampionEntry[];
  onChangeTier?: (championId: string, newTier: string) => void;
  onRemove?: (championId: string) => void;
  isEditable?: boolean;
}

const tierColors = {
  S: { bg: 'bg-[#FFD700]/10', border: 'border-[#FFD700]/30', text: 'text-[#FFD700]' },
  A: { bg: 'bg-[#3D7A5F]/10', border: 'border-[#3D7A5F]/30', text: 'text-[#3D7A5F]' },
  B: { bg: 'bg-[#5F7A8E]/10', border: 'border-[#5F7A8E]/30', text: 'text-[#5F7A8E]' },
  C: { bg: 'bg-[#A85C5C]/10', border: 'border-[#A85C5C]/30', text: 'text-[#A85C5C]' },
};

const TIERS = ['S', 'A', 'B', 'C'];

export function TierRow({ tier, champions, onChangeTier, onRemove, isEditable = true }: TierRowProps) {
  const colors = tierColors[tier];

  return (
    <div
      className={`
        flex items-stretch border rounded-lg overflow-hidden transition-all
        ${colors.border} ${colors.bg}
      `}
    >
      {/* Tier label */}
      <div className={`
        w-16 flex-shrink-0 flex items-center justify-center font-bold text-2xl
        ${colors.text} border-r ${colors.border}
      `}>
        {tier}
      </div>

      {/* Champions */}
      <div className="flex-1 flex flex-wrap gap-2 p-3 min-h-[80px]">
        {champions.length === 0 ? (
          <div className="text-[#F5F5F5]/30 text-sm flex items-center">
            {isEditable ? 'Click champions to add them here' : 'No champions'}
          </div>
        ) : (
          champions.map((champion) => (
            <div key={champion.championId} className="relative group">
              <ChampionCard
                championId={champion.championId}
                championName={champion.championName}
                notes={champion.notes}
                onRemove={isEditable && onRemove ? () => onRemove(champion.championId) : undefined}
                size="md"
              />

              {/* Tier change buttons on hover */}
              {isEditable && onChangeTier && (
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  {TIERS.filter((t) => t !== tier).map((t) => (
                    <button
                      key={t}
                      onClick={(e) => {
                        e.stopPropagation();
                        onChangeTier(champion.championId, t);
                      }}
                      className={`
                        w-5 h-5 text-[10px] font-bold rounded
                        ${t === 'S' ? 'bg-[#FFD700] text-black' : ''}
                        ${t === 'A' ? 'bg-[#3D7A5F] text-white' : ''}
                        ${t === 'B' ? 'bg-[#5F7A8E] text-white' : ''}
                        ${t === 'C' ? 'bg-[#A85C5C] text-white' : ''}
                        hover:scale-110 transition-transform
                      `}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
